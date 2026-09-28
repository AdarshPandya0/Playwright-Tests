import { test, expect } from "../utils/fixtures";

// Note: patients can't be deleted, so every run of this test leaves one "Jones, Adam<stamp>" patient behind.
test('Create Patient via API and verify in UI', async ({ page, patientPage, patientApi }) => {
    // ==========================================
    // PHASE 1: ARRANGE (Generate Unique Data)
    // ==========================================
    // Generate a unique 6-digit string using the current time
    const uniqueStamp = Date.now().toString().slice(-6);
    const uniqueFirstName = `Adam${uniqueStamp}`;
    const uniqueUID = `99900${uniqueStamp.slice(-4)}`; // Keeps the 9-digit format

    // ==========================================
    // PHASE 2: ACT (Create the patient through the backend)
    // ==========================================
    // PatientAPI resolves this clinic's facility/sex/address/country IDs before posting
    const created = await patientApi.create({
        firstName: uniqueFirstName,
        lastName: 'Jones',
        uID: uniqueUID,
    });

    expect(created.id).toBeTruthy();

    // ==========================================
    // PHASE 3: ASSERT (Verify in the UI)
    // ==========================================
    await patientPage.goto();

    // Search for the exact dynamic name we just created
    await patientPage.searchForPatient(uniqueFirstName);

    // Verify the grid loads the new patient
    const firstResult = page.locator('.mtab-primary-panel').first();

    await expect(async () => {
        await expect(firstResult).toContainText(uniqueFirstName, {
            timeout: 500, // Adjust timeout as needed for your app's response time
        });
    }).toPass();
});
