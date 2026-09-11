import { test, expect } from "../utils/fixtures";
import newPatientTemplate from '../data/newPatientTemplate.json';

test.skip('Create Patient via API and verify in UI', async ({ page, patientPage }) => {
    // ==========================================
    // PHASE 1: ARRANGE (Generate Unique Data)
    // ==========================================
    // Generate a unique 6-digit string using the current time
    const uniqueStamp = Date.now().toString().slice(-6);
    const uniqueFirstName = `Adam${uniqueStamp}`;
    const uniqueUID = `99900${uniqueStamp.slice(-4)}`; // Keeps the 9-digit format

    // Extract the auth token from the browser's cookies to authenticate the API call directly.
    const allCookies = await page.context().cookies();
    const xTokenCookie = allCookies.find((c) => c.name === 'x-token');

    // If the token isn't found, stop the test immediately and warn us!
    expect(xTokenCookie, 'CRITICAL: Could not find live x-token in browser cookies!').toBeDefined();

    const liveAuthToken = xTokenCookie!.value;
    const patientPayload = {
        ...newPatientTemplate,
        firstName: uniqueFirstName,
        uID: uniqueUID,
    };

    // ==========================================
    // PHASE 2: ACT (Fire the API Request)
    // ==========================================
    const response = await page.request.post('/api/patient', {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',

            // 1. Add the security origin headers
            'origin': process.env.URL!,
            'referer': `${process.env.URL}`,

            // 2. Add the custom routing header exactly as Postman has it
            'x-requestargs': 'iemoweb;0.0.1;PATIENTDEMOGRAPHICS;718ec9e7-4415-4b4d-ba54-49a66b2d09a9;/app/patient/create',

            'x-token': liveAuthToken,
        },
        data: patientPayload,
    });

    // Let's log the response body if it fails so we can see the exact error the server throws
    if (response.status() !== 200) {
        console.log(await response.text());
    }

    expect(response.status()).toBe(200);

    // ==========================================
    // PHASE 3: ASSERT (Verify in the UI)
    // ==========================================
    await patientPage.goto();

    // Search for the exact dynamic name we just created
    await patientPage.searchForPatient(uniqueFirstName);

    // Verify the grid loads the new patient
    const firstResult = page.locator('.mtab-primary-panel').first();

    await expect(async () => {
        await expect(firstResult).toContainText(uniqueFirstName, {
            timeout: 500, // Adjust timeout as needed for your app's response time
        });
    }).toPass();
});
