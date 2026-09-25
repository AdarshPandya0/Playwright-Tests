import { ApiClient, RequestOrigin } from "./ApiClient";
import { LookupAPI } from "./LookupAPI";

const SCHEDULER: RequestOrigin = { module: 'NOTESANDALERTS', route: '/app/scheduler' };

export interface ScheduleApiResponse {
    status: string;
    data?: {
        result?: {
            id?: number;
            lastModifiedDate?: number;
        } | number;
        messages?: unknown[];
    }
}

export class ScheduleAptPOSTAPI extends ApiClient {

    async createAppointmentForToday(patientId: number): Promise<ScheduleApiResponse> {
        // 1. Resolve this clinic's facility/provider/visit type/status IDs (cached per worker)
        const ctx = await new LookupAPI(this.request, this.token).schedulingContext();

        // 2. Generate an epoch timestamp for 1 hour from now to ensure it shows up in "Appts"
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        const fromTimeMs = oneHourFromNow.getTime();

        // 3. Payload
        const payload = {
                "id": null,
                "fromTime": fromTimeMs,
                "duration": 45,
                "caseDetailId": null,
                "patientName": null,
                "contactNumber": null,
                "patientDOB": null,
                "patientId": patientId,
                "facilityId": ctx.facilityId,
                "visitTypeId": ctx.visitTypeId,
                "billingProviderId": null,
                "note": null,
                "statusId": ctx.statusId,
                "isAuthorizationRequired": false,
                "lastModifiedDate": null,
                "reasonCode": null,
                "reasonCodeTypeId": null,
                "appointmentTypeId": ctx.appointmentTypeId,
                "checkInTime": null,
                "checkOutTime": null,
                "vnId": null,
                "visitModeId": null,
                "roomId": null,
                "providerId": ctx.providerId,
                "tokenNo": null,
                "copay": null,
                "clinicalSpecialtyId": ctx.specialtyId,
                "procedureDetailIds": null,
                "resourceIds": null,
                "availabilityFromTime": null,
                "authorizationRequest": null,
                "reasonForVisit": {},
                "authTransaction": null,
                "billingOptionTypeId": null,
                "followUpId": null,
                "eligibilityId": [],
                "patientForms": {
                    "created": [],
                    "updated": [],
                    "deleted": []
                },
                "scheduleTeamMap": {
                    "created": [
                        {
                            "id": null,
                            "scheduleId": null,
                            "employeeId": ctx.providerId,
                            "roleId": ctx.roleId,
                            "sequence": null,
                            "isSignOffRequired": true,
                            "signOffStatusId": ctx.signOffStatusId,
                            "note": null,
                            "lastModifiedDate": null,
                            "highlighted": [],
                            "markAsReviewed": [],
                            "remark": [],
                            "footNote": [],
                            "comment": [],
                            "verified": [],
                            "signatureId": null,
                            "uid": 2
                        }
                    ],
                    "updated": [],
                    "deleted": []
                },
                "recurringAppointment": null,
                "recurringAppointmentId": null,
                "pOSId": null,
                "encounterClassId": null,
                "serviceLocationTypeId": ctx.serviceLocationTypeId,
                "serviceLocationId": ctx.facilityId,
                "isEncounter": true,
                "isBillable": true,
                "isServiceLocation": true,
                "vn": null,
                "authRequestId": null,
                "extGuid": null,
                "extId": null,
                "extUpdateDate": null,
                "extRefId": null,
                "currentVisitStatusId": null,
                "customStatus": [],
                "email": null,
                "referringProviderId": null,
                "referringProviderTypeId": null
            };

        // 4. Fire the request
        return await this.send('POST', '/api/Schedule', SCHEDULER, payload) as ScheduleApiResponse;
    }

    async deleteAppointment(apptId: number, lastModifiedDate?: number): Promise<ScheduleApiResponse> {
        const payload = {
            "id": apptId,
            "lastModifiedDate": lastModifiedDate || Date.now()
        };

        const response = await this.send('DELETE', `/api/Schedule/${apptId}`, SCHEDULER, payload) as ScheduleApiResponse;
        console.log(`Action Status : ${response.status || 'Deleted Successfully'}`);
        return response;
    }
}
