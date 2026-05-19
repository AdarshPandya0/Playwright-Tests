import { test, expect } from "@playwright/test";


// const loginViaOAuth = async({ page }, token)  => {
// 	await page.context().addCookies([{
// 		name: 'access_token',
// 		value: token,
// 		domain : 'meditab.local',
// 		path:'/'
// 	}]);
	
// 	await page.goto('https://webims.meditab.local/#/app/dashboard');
// }

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