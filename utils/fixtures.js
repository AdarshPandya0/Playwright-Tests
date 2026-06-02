import { test as base, expect } from "@playwright/test";
import { PatientListPage } from "../pages/PatientListPage";
import { DocumentCenterPage } from "../pages/DocumentCenterPage";
import { TopBar } from "../pages/TopBar";
import { SchedulerPage } from "../pages/Scheduler";
import { CicoPage } from "../pages/Cico";
import { ScheduleAptPOSTAPI } from "./api/ScheduleAptPOSTAPI";
import fs from 'fs';
import path from "path";

export const test = base.extend({
    
    page: async ({ browser }, use, testInfo) => {
        let accountIndex = testInfo.config.shard ? testInfo.config.shard.current : (testInfo.parallelIndex % 4) + 1; 

        const dynamicUsername = process.env[`EHR_USERNAME_${accountIndex}`];
        const dynamicPassword = process.env[`EHR_PASSWORD_${accountIndex}`];
        const clinic = process.env.EHR_CLINIC;

        const statePath = path.resolve(`.auth/state-${accountIndex}.json`);
        const sessionPath = path.resolve(`.auth/session-${accountIndex}.json`); 

        let context;

        // ==========================================================
        // FAST PATH: INJECT TOTAL BROWSER MEMORY
        // ==========================================================
        if (fs.existsSync(statePath) && fs.existsSync(sessionPath)) {
            
            context = await browser.newContext({ storageState: statePath });

            // THE PACIFIER: Fake a successful logout so the frontend doesn't panic!
            await context.route('**/*logout*', route => {
                console.log('Pacified malicious logout attempt! Faking a 200 OK.');
                route.fulfill({ 
                    status: 200, 
                    contentType: 'application/json', 
                    body: JSON.stringify({ success: true, message: "Fake logout successful" }) 
                });
            });

            const page = await context.newPage();

            await page.goto('/#/app/dashboard'); 

            // Read and inject Session Storage
            const sessionData = fs.readFileSync(sessionPath, 'utf-8');
            await page.evaluate((data) => {
                const parsedSession = JSON.parse(data);
                for (const key of Object.keys(parsedSession)) {
                    window.sessionStorage.setItem(key, parsedSession[key]);
                }
            }, sessionData);

            // Wake up the SPA router
            await page.goto('/#/app/dashboard'); 

            try {
                await expect(page.getByRole('link', { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
            } catch (error) {
                fs.unlinkSync(statePath);
                fs.unlinkSync(sessionPath);
                throw new Error(`CRITICAL: The router killed the session;  deleted the poisoned files. Please re-run.`);
            }
            
            await use(page);
            await context.close();
            return; 
        } 
        
        // ==========================================================
        // SLOW PATH: LOG IN AND CLONE TOTAL MEMORY
        // ==========================================================
        context = await browser.newContext();

        // THE PACIFIER: Must be here too so Test 1's cleanup doesn't kill the token!
        await context.route('**/*logout*', route => {
            console.log('Pacified malicious logout attempt on context close!');
            route.fulfill({ 
                status: 200, 
                contentType: 'application/json', 
                body: JSON.stringify({ success: true }) 
            });
        });

        const setupPage = await context.newPage();

        await setupPage.goto('/#/login');
        await setupPage.locator('#clinic input').fill(clinic);
        await setupPage.locator('#username input').fill(dynamicUsername);
        await setupPage.locator('#password input').fill(dynamicPassword);
        //await setupPage.locator('p-checkbox').click();
        await setupPage.getByRole('button', { name: 'Login' }).click();

        await expect(setupPage.getByRole('link', { name: "Dashboard" })).toBeVisible();

        // 1. Snapshot Cookies and Local Storage
        await context.storageState({ path: statePath });

        // 2. BULLETPROOF EXTRACTION: Use a hard loop to grab every single sessionStorage key
        const sessionStorageData = await setupPage.evaluate(() => {
            const data = {};
            for (let i = 0; i < window.sessionStorage.length; i++) {
                const key = window.sessionStorage.key(i);
                data[key] = window.sessionStorage.getItem(key);
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