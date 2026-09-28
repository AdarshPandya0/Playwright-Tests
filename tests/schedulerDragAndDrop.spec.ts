import { test, expect } from "../utils/fixtures";
import { zonedDateFromToday, zonedTimeToEpoch } from "../utils/time";

// Facility wall-clock times, inside the day view's visible hours. The scheduler shows appointments in
// the facility's time zone, so these mean the same thing whether the test runs on IST, UTC, ...
const FROM = '10:00';
const TO = '11:00';
const MOVE_MINUTES = 60;

test.describe('Scheduler drag and drop @scheduler @regression', () => {
    let apptId: number | undefined;

    // The appointment is never checked in, so it can always be deleted
    test.afterEach(async ({ scheduleApi }) => {
        if (apptId) {
            const appt = await scheduleApi.getAppointment(apptId);
            await scheduleApi.deleteAppointment(apptId, appt.lastModifiedDate);
            apptId = undefined;
        }
    });

    test('Verify Scheduler Drag and Drop functionality', async ({ scheduler, scheduleApi, lookupApi, seedPatient }) => {
        // PHASE 1: ARRANGE - seed an appointment for tomorrow (never in the past, never clashing with
        // today's CICO appointments) at FROM facility time
        const ctx = await lookupApi.schedulingContext();
        const tomorrow = zonedDateFromToday(ctx.facilityTimeZone, 1);
        const fromTime = zonedTimeToEpoch(tomorrow, FROM, ctx.facilityTimeZone);

        const created = await scheduleApi.createAppointment(seedPatient.id, { fromTime, duration: 15 });
        const result = created.data?.result;
        apptId = typeof result === 'number' ? result : result?.id;
        expect(apptId, 'Appointment seeding returned no id').toBeTruthy();

        await scheduler.goto();
        await scheduler.showProvider(ctx.providerName, ctx.facilityName);
        await scheduler.goToDate(tomorrow);

        const patientName = `${seedPatient.lastName}, ${seedPatient.firstName}`;
        const seeded = scheduler.appointment(patientName).filter({ hasText: `${FROM} - ` }).first();
        await expect(seeded).toBeVisible();

        // PHASE 2: ACT - drag it to TO within the same provider column
        await scheduler.dragAppointment(seeded, FROM, TO);
        await scheduler.confirmReschedule('Automation: drag and drop regression');

        // PHASE 3: ASSERT - the backend moved it by exactly the dragged amount, and the grid shows it there.
        // Comparing the difference keeps this independent of time zones.
        await expect.poll(async () => (await scheduleApi.getAppointment(apptId!)).fromTime, {
            message: `Appointment start should move by ${MOVE_MINUTES} minutes`,
        }).toBe(fromTime + MOVE_MINUTES * 60 * 1000);

        await expect(scheduler.appointment(patientName).filter({ hasText: `${TO} - ` })).toBeVisible();
    });
});
