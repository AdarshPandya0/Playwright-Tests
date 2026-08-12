import { test as base, expect, BrowserContext } from "@playwright/test";
import { PatientListPage } from "../pages/PatientListPage";
import { DocumentCenterPage } from "../pages/DocumentCenterPage";
import { TopBar } from "../pages/TopBar";
import { SchedulerPage } from "../pages/Scheduler";
import { CicoPage } from "../pages/Cico";
import { ScheduleAptPOSTAPI } from "./api/ScheduleAptPOSTAPI";
import fs from 'fs';
import path from "path";

// 1. THE MENU: We explicitly define exactly what objects this fixture provides.
type EHRFixtures = {
    patientPage: PatientListPage;
    docCenter: DocumentCenterPage;
    topBar: TopBar;
    scheduler: SchedulerPage;
    cicoPage: CicoPage;
    scheduleApi: ScheduleAptPOSTAPI;
}

// 2. THE EXTENSION: We pass our menu into base.extend<>
export const test = base.extend<EHRFixtures>({
    
    page: async ({ browser }, use, testInfo) => {
        let accountIndex = testInfo.config.shard ? testInfo.config.shard.current : (testInfo.parallelIndex % 4) + 1; 

        const dynamicUsername = process.env[`EHR_USERNAME_${accountIndex}`] as string;
        const dynamicPassword = process.env[`EHR_PASSWORD_${accountIndex}`] as string;
        const clinic = process.env.EHR_CLINIC as string;

        const statePath = path.resolve(`.auth/state-${accountIndex}.json`);
        const sessionPath = path.resolve(`.auth/session-${accountIndex}.json`); 

        const MAX_CACHE_AGE_HOURS = 3;
        let context: BrowserContext;

        // ==========================================================
        // STEP 1: CACHE AGE VALIDATION
        // ==========================================================
        if (fs.existsSync(statePath) && fs.existsSync(sessionPath)) {
            const stats = fs.statSync(statePath);
            const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

            if (ageInHours > MAX_CACHE_AGE_HOURS) {
                console.log(`Cached auth files are older than ${MAX_CACHE_AGE_HOURS} hours. Deleting...`);
                fs.unlinkSync(statePath);
                fs.unlinkSync(sessionPath);
            }
        }

        // ==========================================================
        // STEP 2: FAST PATH ATTEMPT
        // ==========================================================
        if (fs.existsSync(statePath) && fs.existsSync(sessionPath)) {
            console.log('Attempting Fast Path Login...');
            context = await browser.newContext({ storageState: statePath });

            await context.route('**/*logout*', route => {
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
            });

            const page = await context.newPage();
            await page.goto('/#/app/dashboard'); 

            const sessionData = fs.readFileSync(sessionPath, 'utf-8');

            await page.evaluate((data: string) => {
                const parsedSession = JSON.parse(data);
                for (const key of Object.keys(parsedSession)) {
                    window.sessionStorage.setItem(key, parsedSession[key]);
                }
            }, sessionData);

            await page.goto('/#/app/dashboard'); 

            try {
                // Wait for the Dashboard. If it redirects to login, this will fail!
                await expect(page.getByRole('link', { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
                
                // IF WE GET HERE, FAST PATH WAS A SUCCESS!
                await use(page);
                await context.close();
                return; // Exit the fixture completely!
                
            } catch (error) {
                // IF WE GET HERE, THE TOKEN WAS DEAD (401 Redirect)
                console.log('Fast path failed (Token likely expired server-side / Logout Attempt). Falling back to Slow Path...');
                
                // Delete the poisoned files so they aren't used again
                fs.unlinkSync(statePath);
                fs.unlinkSync(sessionPath);
                
                // Close the broken context
                await context.close();
                
                // DO NOT THROW AN ERROR. Let the code continue down to the Slow Path!
            }
        } 
        
        // ==========================================================
        // STEP 3: SLOW PATH (Runs if no files exist, or if Fast Path failed!)
        // ==========================================================
        console.log('Executing Slow Path Login...');
        context = await browser.newContext();

        await context.route('**/*logout*', route => {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        const setupPage = await context.newPage();

        await setupPage.goto('/#/login');
        await setupPage.locator('#clinic input').fill(clinic);
        await setupPage.locator('#username input').fill(dynamicUsername);
        await setupPage.locator('#password input').fill(dynamicPassword);
        await setupPage.getByRole('button', { name: 'Login' }).click();

        await expect(setupPage.getByRole('link', { name: "Dashboard" })).toBeVisible();

        // Snapshot Cookies and Local Storage
        await context.storageState({ path: statePath });

        // Extract Session Storage
        const sessionStorageData = await setupPage.evaluate(() => {
            const data: Record<string, string | null> = {};
            for (let i = 0; i < window.sessionStorage.length; i++) {
                const key = window.sessionStorage.key(i);
                if (key) {
                    data[key] = window.sessionStorage.getItem(key);
                }
            }
            return JSON.stringify(data);
        });
        fs.writeFileSync(sessionPath, sessionStorageData);
        
        await use(setupPage);
        await context.close();
    },
    
    // ... (Keep your other POM fixtures here)
        
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
    },

    cicoPage : async({ page }, use) => {
        const cicoPage = new CicoPage(page);
        await use(cicoPage);
    },

    scheduleApi: async({ page, request }, use) => {
        const allCookies = await page.context().cookies();
        const xTokenCookie = allCookies.find(c => c.name === 'x-token');
        
        if (!xTokenCookie) {
            throw new Error('CRITICAL: Could not find live x-token for API injection!');
        }

        const scheduleApi = new ScheduleAptPOSTAPI(request, xTokenCookie.value);
        await use(scheduleApi);
    }

});

export { expect } from "@playwright/test";