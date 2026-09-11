import { test, expect } from "../utils/fixtures";

test('Verify global auth setup working', async ({ page }) => {
    await page.goto('/#/app/patient');

    await expect(page).toHaveURL(/.*patient/);

    await page.getByRole('textbox', { name: ' Search Patient - lname' }).click();
});

test('Page Navigator to find locators', async ({ scheduler }) => {
    await scheduler.goto();

    await scheduler.closeNotesModalIfOpen();
});

test('CICO Page Navigator to find locators', async ({ cicoPage }) => {
    await cicoPage.goto();

    await cicoPage.clickGridView();
});
