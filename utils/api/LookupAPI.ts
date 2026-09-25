import { ApiClient, RequestOrigin } from "./ApiClient";
import { envData } from "../testData";

const SCHEDULER: RequestOrigin = { module: 'NOTESANDALERTS', route: '/app/scheduler' };
const PATIENT: RequestOrigin = { module: 'PATIENTDEMOGRAPHICS', route: '/app/patient/create' };

export interface MiscValue {
    id: number;
    code: string;
    type?: string;
    [key: string]: unknown;
}

interface NamedRecord {
    id: number;
    name: string;
    timezoneId?: number | null;
}

interface EmployeeRecord {
    id: number;
    firstName: string;
    lastName: string;
}

interface EmployeeDetail {
    primaryFacilityDetail?: {
        employeeFacilityDetailSpecialty?: { specialtyId: number; isPrimary?: boolean }[];
    };
}

/** Every ID the appointment payload needs, resolved for the current clinic. */
export interface SchedulingContext {
    facilityId: number;
    providerId: number;
    specialtyId: number;
    visitTypeId: number;
    statusId: number;
    appointmentTypeId: number;
    serviceLocationTypeId: number;
    signOffStatusId: number;
    roleId: number;
}

/** Everything the patient payload needs, resolved for the current clinic. */
export interface PatientContext {
    facilityId: number;
    timeZoneId: number | null;
    sexIds: Record<string, number>;
    addressTypes: MiscValue[];
    preferenceTypes: MiscValue[];
    country: MiscValue;
}

// Lookups never change during a run, so cache them per worker process and environment.
const cache = new Map<string, Promise<unknown>>();
function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
    const fullKey = `${process.env.URL}|${key}`;
    if (!cache.has(fullKey)) {
        cache.set(fullKey, load().catch((error) => {
            cache.delete(fullKey); // don't cache failures
            throw error;
        }));
    }
    return cache.get(fullKey) as Promise<T>;
}

function pick<T>(items: T[], matches: (item: T) => boolean, what: string): T {
    const found = items.find(matches);
    if (!found) {
        throw new Error(`Lookup failed: ${what} not found in this clinic (${process.env.URL}).`);
    }
    return found;
}

/**
 * Resolves clinic-specific IDs by code or name, so tests never hardcode IDs.
 * IDs are only unique within a type and differ per clinic; codes are stable.
 */
export class LookupAPI extends ApiClient {

    /** Static values the app preloads at login (Gender, ScheduleStatus, AddressType, ...). */
    async staticMisc(type: string, code: string): Promise<number> {
        const values = await memo(`staticMisc:${type}`, () =>
            this.result<MiscValue[]>('GET', `/api/StaticMisc?staticMiscType=${type}`, SCHEDULER));
        return pick(values, (v) => v.code === code, `StaticMisc ${type}/${code}`).id;
    }

    /** Configurable misc values (e.g. ParticipantType). */
    async miscValue(type: string, code: string): Promise<number> {
        const values = await memo(`miscValue:${type}`, () =>
            this.result<MiscValue[]>('GET', `/api/miscValue?model=id&type=${type}`, SCHEDULER));
        return pick(values, (v) => v.code === code, `miscValue ${type}/${code}`).id;
    }

    async facility(name: string): Promise<NamedRecord> {
        const facilities = await memo(`facility:${name}`, () =>
            this.result<NamedRecord[]>('GET',
                `/api/facility?model=id&search=${encodeURIComponent(name)}&isActive=true&timeZone=true`, SCHEDULER));
        return pick(facilities, (f) => f.name === name, `Facility "${name}"`);
    }

    async providerId(facilityId: number, firstName: string, lastName: string): Promise<number> {
        const employees = await memo(`provider:${facilityId}:${lastName}`, () =>
            this.result<EmployeeRecord[]>('GET',
                `/api/employee?model=id&facilityId=${facilityId}&isSchedulable=true&isInActive=true` +
                `&search=${encodeURIComponent(lastName)}&page=1&size=10`, SCHEDULER));
        return pick(employees, (e) => e.firstName === firstName && e.lastName === lastName,
            `Provider "${lastName}, ${firstName}"`).id;
    }

    async primarySpecialtyId(employeeId: number): Promise<number> {
        const employee = await memo(`employee:${employeeId}`, () =>
            this.result<EmployeeDetail>('GET', `/api/employee/${employeeId}`, SCHEDULER));
        const specialties = employee.primaryFacilityDetail?.employeeFacilityDetailSpecialty ?? [];
        const primary = specialties.find((s) => s.isPrimary) ?? specialties[0];
        if (!primary) {
            throw new Error(`Lookup failed: provider ${employeeId} has no specialty at its primary facility.`);
        }
        return primary.specialtyId;
    }

    async visitTypeId(facilityId: number, specialtyId: number, name: string): Promise<number> {
        const visitTypes = await memo(`visitType:${facilityId}:${specialtyId}:${name}`, () =>
            this.result<NamedRecord[]>('GET',
                `/api/visitType?model=id&search=${encodeURIComponent(name)}&page=1&size=10&facilityId=${facilityId}` +
                `&specialtyId=${specialtyId}&screenTypeCode=AppointmentType&isShowInDropDown=true`, SCHEDULER));
        return pick(visitTypes, (v) => v.name === name, `Visit type "${name}"`).id;
    }

    /** Resolves the full appointment context from data/env/<ENV>.json. */
    schedulingContext(): Promise<SchedulingContext> {
        return memo('schedulingContext', async () => {
            const facility = await this.facility(envData.facility);
            const providerId = await this.providerId(facility.id, envData.provider.firstName, envData.provider.lastName);
            const specialtyId = await this.primarySpecialtyId(providerId);

            return {
                facilityId: facility.id,
                providerId,
                specialtyId,
                visitTypeId: await this.visitTypeId(facility.id, specialtyId, envData.visitType),
                statusId: await this.staticMisc('ScheduleStatus', 'Unconfirmed'),
                appointmentTypeId: await this.staticMisc('AppointmentType', 'Appointment'),
                serviceLocationTypeId: await this.staticMisc('ServiceLocationType', 'Facility'),
                signOffStatusId: await this.staticMisc('SignOffStatus', 'Pending'),
                roleId: await this.miscValue('ParticipantType', 'PPRF'), // Primary Performer
            };
        });
    }

    /** Resolves everything needed to register a patient from data/env/<ENV>.json. */
    patientContext(): Promise<PatientContext> {
        return memo('patientContext', async () => {
            const facility = await this.facility(envData.facility);
            const sexes = await this.result<MiscValue[]>('GET', '/api/StaticMisc?staticMiscType=Gender', PATIENT);

            return {
                facilityId: facility.id,
                timeZoneId: facility.timezoneId ?? null,
                sexIds: Object.fromEntries(sexes.map((s) => [s.code, s.id])),
                addressTypes: await this.result<MiscValue[]>('GET', '/api/patient/addresstypes', PATIENT),
                preferenceTypes: await this.result<MiscValue[]>('GET', '/api/patient/preferencetypes', PATIENT),
                country: await this.result<MiscValue>('GET', '/api/country?model=id&Code=US', PATIENT),
            };
        });
    }
}
