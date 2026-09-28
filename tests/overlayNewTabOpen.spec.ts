import { test, expect } from "../utils/fixtures";

test('Verify New Tab Open while on an Overlay @smoke', async ({ page, patientPage, topBar }) => {
    await patientPage.goto();

    await patientPage.openFindaSlotFirstRecord();

    await page.waitForLoadState('networkidle');

    const newTabPromise = page.context().waitForEvent('page');

    await expect(async () => {
        await topBar.searchBar.click();

        await expect(topBar.searchBarAddBtn).toBeVisible({
            timeout: 500,
        });
    }).toPass();

    await topBar.searchBarAddBtn.click();

    const newTab = await newTabPromise;

    await newTab.waitForLoadState('networkidle');

    await expect(newTab).toHaveURL('/#/app/patient/create');

    await newTab.close();
});
