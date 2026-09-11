import { test, expect } from "../utils/fixtures";

// Flow: go to /patient -> open filters if not already open -> search "cassius" -> verify
// "Thunderfolk, Cassius" is in the results -> print facesheet -> open the patient ->
// navigate to Documents -> open the Face Sheet folder -> verify the newest record opens
// in the viewer.

test.skip('Verify Print Facesheet functionality', async ({ page, patientPage, docCenter }) => {
    // Flow within the Patient List
    await patientPage.goto();

    await patientPage.searchForPatient("cassius");

    const patientRecord = page.getByText('Thunderfolk, Cassius (173)').first();
    await expect(patientRecord).toBeVisible();

    await patientPage.printfacesheetBtn.first().click();

    await expect(patientPage.savefacesheetBtn).toBeVisible();

    await patientPage.savefacesheetBtn.click();
    await page.waitForTimeout(2000); // Let the facesheet save complete before navigating away

    await patientRecord.click();

    // Flow from the Patient Chart to Document Center, verifying the facesheet document
    await docCenter.navigateToSidebar();
    await docCenter.openFaceSheetFolder();
    const fileName = await docCenter.openLastDocument();
    await docCenter.verifyViewerSuccess(fileName);
});
