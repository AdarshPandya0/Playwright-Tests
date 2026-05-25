import { test , expect } from "../utils/fixtures.js";

test('Verify Patient Import Sample Download', async({ page, patientPage }) => {

    await patientPage.goto();

    await page.locator('.ui-splitbutton-menubutton.ng-tns-c128-15').click();

    const downloadPromise = page.waitForEvent('download');

    await page.locator('a').filter({ hasText: 'Download Sample' }).click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Import Patient Sample.csv'); 

    await download.saveAs('./test-results/downloads/' + download.suggestedFilename());

});
