import { test, expect } from "../utils/fixtures";
import searchData from '../data/patientSearch.json';
import AxeBuilder from '@axe-core/playwright';

interface PatientSearchCase {
    testId: string;
    searchName: string;
    expectedResult: string;
    shouldFind: boolean;
}

for (const data of searchData as PatientSearchCase[]) {
    test(`[${data.testId}] Verify Patient Search for: ${data.searchName}`, async ({ page, patientPage }) => {
        await patientPage.goto();

        await expect(async () => {
            await patientPage.searchForPatient(data.searchName);
        }).toPass();

        await page.waitForLoadState('networkidle');

        if (data.shouldFind) {
            const patientGrid = page.locator('.mtab-primary-panel');
            await expect(async () => {
                await expect(patientGrid).toContainText(data.expectedResult);
            }).toPass();
        } else {
            const noRecordsMsg = page.getByText("No Patient Found. click 'Add Patient' button to register new Patient.");
            await expect(noRecordsMsg).toBeVisible();
        }
    });
}

test.skip('Accessibility Check on Patient Grid', async ({ page, patientPage }, testInfo) => {
    await patientPage.goto();

    const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

    await testInfo.attach('accessibility-scan-results.json', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json',
    });
});
