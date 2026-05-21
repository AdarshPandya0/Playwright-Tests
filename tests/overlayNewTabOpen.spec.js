import { test, expect } from "../utils/fixtures.js";    

test('Verify New Tab Open while on an Overlay', async( { page, patientPage, topBar } ) => {

    await patientPage.goto();

    await patientPage.openFindaSlotFirstRecord();

    const newTabPromise = page.context().waitForEvent('page');

    await topBar.searchBar.click();

    await expect(topBar.searchBarAddBtn).toBeVisible();

    await topBar.searchBarAddBtn.click();

    const newTab = await newTabPromise;

    await newTab.waitForLoadState('networkidle');

    await expect(newTab).toHaveURL("https://webims.meditab.local/#/app/patient/create");

    await newTab.close();

});