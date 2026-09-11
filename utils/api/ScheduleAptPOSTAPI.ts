// utils/api/ScheduleAptPOSTAPI.js
import { APIRequestContext } from "@playwright/test";

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


export class ScheduleAptPOSTAPI {

    readonly request: APIRequestContext;
    readonly token: string;

    constructor(requestContext: APIRequestContext, liveToken: string) {
        this.request = requestContext;
        this.token = liveToken;
    }

    async createAppointmentForToday(patientId: number): Promise<ScheduleApiResponse> {
        // 1. Generate an epoch timestamp for 1 hour from now to ensure it shows up in "Appts"
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        const fromTimeMs = oneHourFromNow.getTime();

        // 2. Payload
        const payload = {
                "id": null,
                "fromTime": fromTimeMs,
                "duration": 45,
                "caseDetailId": null,
                "patientName": null,
                "contactNumber": null,
                "patientDOB": null,
                "patientId": patientId,
                "facilityId": 10005192,
                "visitTypeId": 1000534,
                "billingProviderId": null,
                "note": null,
                "statusId": 100051311,
                "isAuthorizationRequired": false,
                "lastModifiedDate": null,
                "reasonCode": null,
                "reasonCodeTypeId": null,
                "appointmentTypeId": 1000580,
                "checkInTime": null,
                "checkOutTime": null,
                "vnId": null,
                "visitModeId": null,
                "roomId": null,
                "providerId": 100053557,
                "tokenNo": null,
                "copay": null,
                "clinicalSpecialtyId": 10005200,
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
                            "employeeId": 100053557,
                            "roleId": 1000560,
                            "sequence": null,
                            "isSignOffRequired": true,
                            "signOffStatusId": 100051479,
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
                "serviceLocationTypeId": 100051442,
                "serviceLocationId": 10005192,
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

        // 3. Fire the request
        const response = await this.request.post('/api/Schedule', {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'origin': process.env.URL!,
                'referer': `${process.env.URL}/`,
                'x-requestargs': 'iemoweb;0.0.1;NOTESANDALERTS;230c95c3-f3b0-41bb-9141-5fc15fef78e1;/app/scheduler',
                'x-token': this.token
            },
            data: payload
        });

        if (response.status() !== 200) {
            throw new Error(`API Appointment Seeding Failed! Status: ${response.status()} Body: ${await response.text()}`);
        }

        return await response.json();
    }

    async deleteAppointment(apptId: number, lastModifiedDate?: number): Promise<ScheduleApiResponse> {
        const payload = {
            "id": apptId,
            "lastModifiedDate": lastModifiedDate || Date.now()
        };

        const response = await this.request.delete(`/api/Schedule/${apptId}`, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'origin': process.env.URL!,
                'referer': `${process.env.URL}/`,
                'x-requestargs': 'iemoweb;0.0.1;NOTESANDALERTS;230c95c3-f3b0-41bb-9141-5fc15fef78e1;/app/scheduler',
                'x-token': this.token
            },
            data: payload
        });

        if (response.status() !== 200) {
            throw new Error(`API Appointment Deletion Failed! Status: ${response.status()} Body: ${await response.text()}`);
        } else {
            console.log(`Action Status : ${response.statusText() || 'Deleted Successfully'}`);
        }

        return await response.json() as ScheduleApiResponse;
    }
}