import { test, expect } from "../utils/fixtures";

// Flow: go to /patient -> open filters if not already open -> search this worker's seed patient ->
// verify "PWAuto, Worker<n> (<chart#>)" is in the results -> print facesheet -> open the patient ->
// navigate to Documents -> open the Face Sheet folder -> verify the newest record opens
// in the viewer.

test('Verify Print Facesheet functionality', async ({ page, patientPage, docCenter, seedPatient }) => {
    // Flow within the Patient List
    await patientPage.goto();

    await patientPage.searchForPatient(seedPatient.firstName);

    const patientRecord = page
        .getByText(`${seedPatient.lastName}, ${seedPatient.firstName} (${seedPatient.chartNumber})`)
        .first();
    await expect(patientRecord).toBeVisible();

    await patientPage.printfacesheetBtn.first().click();

    await expect(patientPage.savefacesheetBtn).toBeVisible();

    await patientPage.savefacesheetBtn.click();
    await page.waitForTimeout(2000); // Let the facesheet save complete before navigating away

    // Saving the facesheet can refresh the grid back to the unfiltered list (seen on prod),
    // so search again if our patient's row is gone before opening the chart
    await expect(async () => {
        if (!await patientRecord.isVisible()) {
            await patientPage.searchForPatient(seedPatient.firstName);
        }
        await patientRecord.click({ timeout: 5000 });
    }).toPass({ timeout: 30000 });

    // Flow from the Patient Chart to Document Center, verifying the facesheet document
    await docCenter.navigateToSidebar();
    await docCenter.openFaceSheetFolder();
    const fileName = await docCenter.openLastDocument();
    await docCenter.verifyViewerSuccess(fileName);
});
