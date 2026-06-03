import { test, expect } from "../utils/fixtures.js";

test('Verify global auth setup working', async( { page } ) => {

    await page.goto('/#/app/patient');

    await expect(page).toHaveURL(/.*patient/);
    
    await page.getByRole('textbox', { name: ' Search Patient - lname' }).click();
   // await page.locator('.ui-splitbutton-menubutton.ng-tns-c128-14').click();
   // await page.locator('.mtab-icon.mt-icon.mt-icon-print').first().click();

    await page.waitForTimeout(3000);    
});

test('Find Locator', async( { page } ) => {

    await page.goto('/#/app/setup/scheduler/event-type')

    await page.waitForTimeout(3000);
})

test('Page Navigator to find locators', async({ page, scheduler}) => {

    await scheduler.goto();

    await scheduler.closeNotesModalIfOpen();

    await page.waitForTimeout(3000);

});

test('CICO Page Navigator to find locators', async( { page,  cicoPage } ) => {
    await cicoPage.goto();

    await page.waitForTimeout(2000);

    await cicoPage.clickGridView();

    await page.waitForTimeout(2000);
});
