import { ApiClient, RequestOrigin } from "./ApiClient";
import { LookupAPI } from "./LookupAPI";
import newPatientTemplate from '../../data/newPatientTemplate.json';

const PATIENT_CREATE: RequestOrigin = { module: 'PATIENTDEMOGRAPHICS', route: '/app/patient/create' };
const PATIENT_LIST: RequestOrigin = { module: 'PATIENTDEMOGRAPHICS', route: '/app/patient' };

export interface PatientRecord {
    id: number;
    firstName: string;
    lastName: string;
    chartNumber: string;
}

/** The parts of the patient template that get swapped per clinic. */
interface ContactDetailPayload {
    addressType: { code: string };
    addressTypeId: number | null;
    contactAddress: { country: Record<string, unknown>; countryId: number | null };
}

interface PatientPayload extends Record<string, unknown> {
    contactDetail: { created: ContactDetailPayload[] };
    contactDetailPreference: Record<string, unknown>[];
}

export interface NewPatient {
    firstName: string;
    lastName: string;
    /** SSN. Use the 999 prefix for test data; it is never issued as a real SSN. */
    uID: string;
    sexCode?: 'Male' | 'Female' | 'Unknown';
}

/** Patient search and registration. Patients cannot be deleted, so prefer findOrCreate(). */
export class PatientAPI extends ApiClient {

    async find(firstName: string, lastName: string): Promise<PatientRecord | undefined> {
        const patients = await this.result<PatientRecord[]>('POST', '/api/patient/fetch?page=1&size=20', PATIENT_LIST,
            { firstName, lastName, isActive: true });
        return patients.find((p) => p.firstName === firstName && p.lastName === lastName);
    }

    async create(patient: NewPatient): Promise<PatientRecord> {
        const lookups = new LookupAPI(this.request, this.token);
        const ctx = await lookups.patientContext();

        const sexCode = patient.sexCode ?? 'Male';
        const sexId = ctx.sexIds[sexCode];
        if (!sexId) throw new Error(`Lookup failed: sex "${sexCode}" not found in this clinic.`);

        // The template keeps only codes for clinic-specific values; swap in this clinic's records.
        const body = structuredClone(newPatientTemplate) as unknown as PatientPayload;
        Object.assign(body, {
            firstName: patient.firstName,
            lastName: patient.lastName,
            uID: patient.uID,
            facilityId: ctx.facilityId,
            sexId,
            timeZoneId: ctx.timeZoneId,
        });

        for (const detail of body.contactDetail.created) {
            const addressType = ctx.addressTypes.find((a) => a.code === detail.addressType.code);
            if (!addressType) throw new Error(`Lookup failed: address type "${detail.addressType.code}" not found.`);
            detail.addressType = addressType;
            detail.addressTypeId = addressType.id;
            detail.contactAddress.country = { ...detail.contactAddress.country, ...ctx.country };
            detail.contactAddress.countryId = ctx.country.id;
        }

        const preferenceShape = body.contactDetailPreference[0];
        body.contactDetailPreference = ctx.preferenceTypes.map((t) => ({ ...preferenceShape, preferenceTypeId: t.id }));

        return await this.result<PatientRecord>('POST', '/api/patient', PATIENT_CREATE, body);
    }

    async findOrCreate(patient: NewPatient): Promise<PatientRecord> {
        const existing = await this.find(patient.firstName, patient.lastName);
        if (existing) return existing;

        console.log(`[Seed] Creating patient ${patient.lastName}, ${patient.firstName}...`);
        return await this.create(patient);
    }
}
