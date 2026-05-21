import { test, expect } from "@playwright/test";

test('Verify global auth setup working', async( { page } ) => {

    await page.goto('https://webims.meditab.local/#/app/patient');

    await expect(page).toHaveURL(/.*patient/);

    await page.locator('.mtab-icon.mt-icon.mt-icon-print').first().click();

    await page.waitForTimeout(3000);    
});

test('Find Locator', async( { page } ) => {

    await page.goto('https://webims.meditab.local/#/app/patient/edit/10005982342/documents')

    await page.waitForTimeout(1000);

    await page.getByText('Patient insurance card 123').click();

    await page.waitForTimeout(1000);

    await page.locator('.mtab-document-explorer-list-icon').first().click();

    await page.waitForTimeout(3000);
})