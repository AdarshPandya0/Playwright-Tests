import { test, expect } from "../utils/fixtures";

test('Verify Patient Import Sample Download', async ({ page, patientPage }) => {
    await patientPage.goto();

    // Dropdown arrow of the "Import Patient" split button (the ng-tns-* class differs per build)
    await page.locator('.ui-splitbutton').filter({ hasText: 'Import Patient' }).locator('.ui-splitbutton-menubutton').click();

    const downloadPromise = page.waitForEvent('download');

    await page.locator('a').filter({ hasText: 'Download Sample' }).click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Import Patient Sample.csv');

    await download.saveAs('./test-results/downloads/' + download.suggestedFilename());
});
