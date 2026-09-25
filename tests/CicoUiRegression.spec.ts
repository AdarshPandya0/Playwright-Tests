import { test } from '../utils/fixtures';

test.describe('CICO (Check-In/Check-Out) UI Regression', () => {
    // ==========================================
    // SHARED TEST STATE (Accessible by all hooks)
    // ==========================================
    // Filled from this worker's seed patient (see the seedPatient fixture)
    let patientName: string;
    let patientFirstName: string;

    let createdApptId: number | undefined;
    let createdLastModifiedDate: number | undefined;

    // ==========================================
    // SETUP: Runs before the test starts
    // ==========================================
    test.beforeEach(async ({ cicoPage, scheduleApi, seedPatient }) => {
        patientName = `${seedPatient.lastName}, ${seedPatient.firstName}`;
        patientFirstName = seedPatient.firstName;
        console.log(`[Setup] Seeding appointment for ${patientName}...`);

        // 1. Create the appointment where this user's CICO screen is looking (its saved facility filter,
        //    else the env's default facility) and capture the response
        const [savedFacility] = await cicoPage.savedFacilityFilters();
        const apiResponse = await scheduleApi.createAppointmentForToday(seedPatient.id, savedFacility);

        // 2. Extract the ID and Date from the JSON response so we can delete it later.
        // `result` can come back as either an object or a bare number - handle both shapes.
        const result = apiResponse.data?.result;
        if (typeof result === 'number') {
            createdApptId = result;
            createdLastModifiedDate = Date.now();
        } else {
            createdApptId = result?.id;
            createdLastModifiedDate = result?.lastModifiedDate ?? Date.now();
        }

        // 3. Navigate the browser to the starting point
        await cicoPage.goto();
    });

    // ==========================================
    // TEARDOWN: Runs after the test (even if it fails!)
    // ==========================================
    test.afterEach(async ({ scheduleApi }) => {
        // Only attempt deletion if the ID was successfully captured
        if (createdApptId) {
            console.log(`[Teardown] Cleaning up appointment ID: ${createdApptId}...`);
            await scheduleApi.deleteAppointment(createdApptId, createdLastModifiedDate);
        }
    });

    // ==========================================
    // THE TEST
    // ==========================================
    test('Lifecycle: Seed Appt, Check In, and Validate Panel/Grid State', async ({ page, cicoPage }) => {
        // PHASE 2: ACT
        await cicoPage.clickPanelView();

        // Search for the patient to force the card to mount
        await cicoPage.searchApptsBucket(patientFirstName);

        // Check in the patient
        await cicoPage.checkInPatient(patientName);
        await page.waitForLoadState('networkidle');

        // PHASE 3: ASSERT
        // (Panel View validations)
        await page.waitForTimeout(2000); // Buffer for any frontend updates after check-in
        await cicoPage.verifyPatientInWaitingOrInProgress(patientName);

        // (Grid View validations)
        await cicoPage.clickGridView();

        // The left-side list only shows pre-check-in appointments, so validate the central grid only
        await cicoPage.searchGridView(patientFirstName);

        // Dynamically get the current status badge letter from the grid and verify it
        const currentStatus = await cicoPage.getPostCheckInStatusBadgeFromGrid(patientName);
        await cicoPage.verifyPatientInCentralGrid(patientName, currentStatus);

        // Note: for this test, the appointment will not be deleted since it is already
        // checked in - expect a "No cascade delete" error in the teardown response.
    });
});
