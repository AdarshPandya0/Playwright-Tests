import { test, expect } from "@playwright/test";
import { PatientListPage } from "../pages/PatientListPage.js";
import { DocumentCenterPage } from "../pages/DocumentCenterPage.js";

// go to /patient -> open filters if not alredy opened -> enter "cassius" as first name -> Click Filter -> Verify Thunderfolk, Cassius is visible in the results -> Click Print Facesheet -> Click patient name -> navigate to document -> find facesheet folder -> verify that a new facesheet record is present within past 2 minutes date time in the title -> open -> verify the document viewer open  

test('Verify Print Facesheet functionality', async( { page } ) => {
    const patientListPage = new PatientListPage(page);
    const documentCenterPage = new DocumentCenterPage(page);

    // Flow within Patient List 

    await patientListPage.goto();

    await patientListPage.searchForPatient("cassius");

    const patientRecord = page.getByText('Thunderfolk, Cassius (173)');
    await expect(patientRecord).toBeVisible();

    await patientListPage.printfacesheetBtn.click();

    await expect(patientListPage.savefacesheetBtn).toBeVisible();

    await patientListPage.savefacesheetBtn.click();

    await page.waitForTimeout(2000);

    await patientRecord.click();

    // Flow From Patient Chart to Document Center and verifying the facesheet document

    await documentCenterPage.navigateToSidebar();
    await documentCenterPage.openFaceSheetFolder();
    await page.waitForTimeout(1000);
    const fileName = await documentCenterPage.openLastDocument();
    await documentCenterPage.verifyViewerSuccess(fileName);

});