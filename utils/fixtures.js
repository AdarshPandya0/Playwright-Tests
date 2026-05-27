import { test as base, expect } from "@playwright/test";
import { PatientListPage } from "../pages/PatientListPage";
import { DocumentCenterPage } from "../pages/DocumentCenterPage";
import { TopBar } from "../pages/TopBar";
import { SchedulerPage } from "../pages/Scheduler";

export const test = base.extend({ 

    page: async({ page }, use) => {
        await page.goto('/#/login');
        await page.locator('#clinic input').fill(process.env.EHR_CLINIC);
        await page.locator('#username input').fill(process.env.EHR_USERNAME);
        await page.locator('#password input').fill(process.env.EHR_PASSWORD);
        await page.locator('p-checkbox').click();
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('link', {name : "Dashboard"})).toBeVisible();
        
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