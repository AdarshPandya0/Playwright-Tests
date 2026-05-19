import { test as setup, expect} from '@playwright/test';

const authFile = '.auth/user.json';

setup('Authenticate via UI', async ({ page }) => {

    await page.goto('https://webims.meditab.local/#/login');

    await page.locator('#clinic input').fill('FAA');
    await page.locator('#username input').fill('will');
    await page.locator('#password input').fill('support');

    await page.locator('p-checkbox').click();

    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page.getByRole('link', {name : "Dashboard"})).toBeVisible();

    await page.context().storageState({ path: authFile });  

});