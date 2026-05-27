import { test, expect } from "../utils/fixtures.js";

test('Verify global auth setup working', async( { page } ) => {

    await page.goto('/#/app/patient');

    await expect(page).toHaveURL(/.*patient/);
    
    await page.getByRole('textbox', { name: ' Search Patient - lname' }).click();
   // await page.locator('.ui-splitbutton-menubutton.ng-tns-c128-14').click();
   // await page.locator('.mtab-icon.mt-icon.mt-icon-print').first().click();

    await page.waitForTimeout(3000);    
});

test.skip('Find Locator', async( { page } ) => {

    await page.goto('/#/app/patient/edit/10005982342/documents')

    await page.waitForTimeout(1000);

    await page.getByText('Patient insurance card 123').click();

    await page.waitForTimeout(1000);

    await page.locator('.mtab-document-explorer-list-icon').first().click();

    await page.waitForTimeout(3000);
})

test('Page Navigator to find locators', async({ page, scheduler}) => {

    await scheduler.goto();

    await scheduler.closeNotesModalIfOpen();

    await page.waitForTimeout(3000);

});