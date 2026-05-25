import { test, expect } from "../utils/fixtures.js";

// go to /patient -> open filters if not alredy opened -> enter "cassius" as first name -> Click Filter -> Verify Thunderfolk, Cassius is visible in the results -> Click Print Facesheet -> Click patient name -> navigate to document -> find facesheet folder -> verify that a new facesheet record is present within past 2 minutes date time in the title -> open -> verify the document viewer open  

test('Verify Print Facesheet functionality', async( { page, patientPage, docCenter } ) => {

    // Flow within Patient List 

    await patientPage.goto();

    await patientPage.searchForPatient("cassius");

    const patientRecord = page.getByText('Thunderfolk, Cassius (173)').first();
    await expect(patientRecord).toBeVisible();

    await patientPage.printfacesheetBtn.first().click();

    await expect(patientPage.savefacesheetBtn).toBeVisible();

    await patientPage.savefacesheetBtn.click();

    await page.waitForTimeout(2000);

    await patientRecord.click();

    // Flow From Patient Chart to Document Center and verifying the facesheet document

    await docCenter.navigateToSidebar();
    await docCenter.openFaceSheetFolder();
    await page.waitForTimeout(1000);
    const fileName = await docCenter.openLastDocument();
    await docCenter.verifyViewerSuccess(fileName);

});