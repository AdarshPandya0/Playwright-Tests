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

interface FacilityDetail {
    timeZone?: { code?: string } | null;
}

/** Every ID the appointment payload needs, resolved for the current clinic. */
export interface SchedulingContext {
    facilityId: number;
    facilityName: string;
    /** IANA zone the facility's schedule is shown in, e.g. "Asia/Kolkata" */
    facilityTimeZone: string;
    providerId: number;
    /** As the scheduler labels providers, e.g. "Adre, Rush" */
    providerName: string;
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

    async provider(facilityId: number, firstName: string, lastName: string): Promise<EmployeeRecord> {
        const employees = await memo(`provider:${facilityId}:${lastName}`, () =>
            this.result<EmployeeRecord[]>('GET',
                `/api/employee?model=id&facilityId=${facilityId}&isSchedulable=true&isInActive=true` +
                `&search=${encodeURIComponent(lastName)}&page=1&size=10`, SCHEDULER));
        return pick(employees, (e) => e.firstName === firstName && e.lastName === lastName,
            `Provider "${lastName}, ${firstName}"`);
    }

    /** IANA time zone of a facility (the scheduler shows its appointments in this zone). */
    async facilityTimeZone(facilityId: number): Promise<string> {
        const facility = await memo(`facilityDetail:${facilityId}`, () =>
            this.result<FacilityDetail>('GET', `/api/facility/${facilityId}`, SCHEDULER));
        const zone = facility.timeZone?.code;
        if (!zone) throw new Error(`Lookup failed: facility ${facilityId} has no time zone.`);
        return zone;
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

    /**
     * A provider who can take the configured visit type at this facility: the provider from
     * data/env/<ENV>.json when they're schedulable there, otherwise the first one who is.
     */
    private async bookableProvider(facilityId: number): Promise<{ provider: EmployeeRecord; specialtyId: number; visitTypeId: number }> {
        const candidates: EmployeeRecord[] = [];
        try {
            candidates.push(await this.provider(facilityId, envData.provider.firstName, envData.provider.lastName));
        } catch {
            // Configured provider isn't schedulable at this facility
        }
        const schedulable = await memo(`providers:${facilityId}`, () =>
            this.result<EmployeeRecord[]>('GET',
                `/api/employee?model=id&facilityId=${facilityId}&isSchedulable=true&isInActive=true&search=&page=1&size=10`, SCHEDULER));
        candidates.push(...schedulable.filter((e) => !candidates.some((c) => c.id === e.id)));

        for (const provider of candidates) {
            try {
                const specialtyId = await this.primarySpecialtyId(provider.id);
                const visitTypeId = await this.visitTypeId(facilityId, specialtyId, envData.visitType);
                return { provider, specialtyId, visitTypeId };
            } catch {
                // No specialty, or the visit type isn't offered for it - try the next provider
            }
        }
        throw new Error(`Lookup failed: no provider at facility ${facilityId} can take visit type "${envData.visitType}".`);
    }

    /**
     * Resolves the full appointment context. The facility defaults to data/env/<ENV>.json but can be
     * overridden, e.g. to book where a screen's saved facility filter is looking.
     */
    schedulingContext(facilityName: string = envData.facility): Promise<SchedulingContext> {
        return memo(`schedulingContext:${facilityName}`, async () => {
            const facility = await this.facility(facilityName);
            const { provider, specialtyId, visitTypeId } = await this.bookableProvider(facility.id);

            return {
                facilityId: facility.id,
                facilityName: facility.name,
                facilityTimeZone: await this.facilityTimeZone(facility.id),
                providerId: provider.id,
                providerName: `${provider.lastName}, ${provider.firstName}`,
                specialtyId,
                visitTypeId,
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
