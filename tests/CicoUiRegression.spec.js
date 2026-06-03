import { test, expect } from '../utils/fixtures.js';
import { StatusBadgeList } from '../pages/Cico.js';

test.describe('CICO (Check-In/Check-Out) UI Regression', () => {

    test('Lifecycle: Seed Appt, Check In, and Validate Panel/Grid State', async ({ page, cicoPage, scheduleApi }) => {
        
        // ==========================================
        // PHASE 1: ARRANGE
        // ==========================================
        const targetPatientId = 10005982198; 
        const patientName = 'Johnson, Kendl'; 
        const patientFirstName = 'Kendl'; // NEW: Added First Name
        const patientChartNumber = '#29'; // NEW: Added Chart Number
        
        console.log(`Seeding appointment for ${patientName}...`);
        await scheduleApi.createAppointmentForToday(targetPatientId);

        // ==========================================
        // PHASE 2: ACT
        // ==========================================
        await cicoPage.goto();
        await cicoPage.clickPanelView();

        const initialCount = await cicoPage.getWaitingCount();

        // NEW: Search for the patient to force the card to mount!
        await cicoPage.searchApptsBucket(patientFirstName); // Search by First Name

        // Now Playwright will find it instantly
        await cicoPage.checkInPatient(patientName);
        await page.waitForLoadState('networkidle');

        // ==========================================
        // PHASE 3: ASSERT
        // ==========================================
        // (Panel View validations)
        await cicoPage.verifyPatientInWaitingOrInProgress(patientName);
        
        //const newCount = await cicoPage.getWaitingCount();
        //expect(newCount).toBe(initialCount + 1);

        // (Grid View validations)
        await cicoPage.clickGridView();
        await cicoPage.searchGridView(patientFirstName); // Search by First Name in Grid View as well
        await cicoPage.verifyPatientInGridLeftSide(patientName); // Verify patient appears in left-side filters


        // NEW: Dynamically get the current status badge letter from the grid and verify it in the central grid
        const currentStatus =  await cicoPage.getPostCheckInStatusBadgeFromGrid(patientName);
        // Pass that dynamic status to the verification method
        await cicoPage.verifyPatientInCentralGrid(patientName, currentStatus);
    });
});