import { test as base, expect } from "@playwright/test";
import { PatientListPage } from "../pages/PatientListPage";
import { DocumentCenterPage } from "../pages/DocumentCenterPage";
import { TopBar } from "../pages/TopBar";
import { SchedulerPage } from "../pages/Scheduler";

export const test = base.extend({ 

    page: async({ page }, use, testInfo) => {

        const currentShard = testInfo.config.shard?.current || 1;

        const dynamicUsername = process.env[`EHR_USERNAME_${currentShard}`];
        const dynamicPassword = process.env[`EHR_PASSWORD_${currentShard}`];

        await page.goto('/#/login');
        await page.locator('#clinic input').fill(process.env.EHR_CLINIC);

        await page.locator('#username input').fill(dynamicUsername);
        await page.locator('#password input').fill(dynamicPassword);

        await page.locator('p-checkbox').click();
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForLoadState('networkidle');
        await expect( async () => {
            await expect(page.getByRole('link', {name : "Dashboard"})).toBeVisible({
                timeout: 500,
            });
        }).toPass();

        await use(page);

    },

    patientPage: async({ page }, use) => {
        const patientPage = new PatientListPage(page);
        await use(patientPage);
    },

    docCenter : async({ page }, use) => {
        const docCenter = new DocumentCenterPage(page);
        await use(docCenter);
    },

    topBar : async({ page }, use) => {
        const topBar = new TopBar(page);
        await use(topBar);
    },

    scheduler : async({ page }, use) => {
        const scheduler = new SchedulerPage(page);
        await use(scheduler);
    }
});

export { expect } from "@playwright/test";