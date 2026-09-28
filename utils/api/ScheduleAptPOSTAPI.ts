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

export interface AppointmentOptions {
    /** Defaults to the facility in data/env/<ENV>.json */
    facilityName?: string;
    /** Start time, epoch ms. Defaults to one hour from now. */
    fromTime?: number;
    /** Minutes. Defaults to 45. */
    duration?: number;
}

/** The fields tests read back from GET /api/Schedule/{id} */
export interface AppointmentRecord {
    id: number;
    fromTime: number;
    duration: number;
    lastModifiedDate: number;
}

export class ScheduleAptPOSTAPI extends ApiClient {

    /** @param facilityName - defaults to the facility in data/env/<ENV>.json */
    async createAppointmentForToday(patientId: number, facilityName?: string): Promise<ScheduleApiResponse> {
        // Starts one hour from now to ensure it shows up in "Appts"
        return this.createAppointment(patientId, { facilityName });
    }

    async createAppointment(patientId: number, options: AppointmentOptions = {}): Promise<ScheduleApiResponse> {
        // 1. Resolve this clinic's facility/provider/visit type/status IDs (cached per worker)
        const ctx = await new LookupAPI(this.request, this.token).schedulingContext(options.facilityName);

        // 2. Default start: an epoch timestamp for 1 hour from now
        const fromTimeMs = options.fromTime ?? Date.now() + 60 * 60 * 1000;

        // 3. Payload
        const payload = {
                "id": null,
                "fromTime": fromTimeMs,
                "duration": options.duration ?? 45,
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

    async getAppointment(apptId: number): Promise<AppointmentRecord> {
        return await this.result<AppointmentRecord>('GET', `/api/Schedule/${apptId}`, SCHEDULER);
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
