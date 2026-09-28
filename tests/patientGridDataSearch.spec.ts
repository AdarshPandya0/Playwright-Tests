import { test, expect } from "../utils/fixtures";
import searchData from '../data/patientSearch.json';
import AxeBuilder from '@axe-core/playwright';

interface PatientSearchCase {
    testId: string;
    /** Search for this worker's seed patient instead of a fixed name (which may not exist in every clinic). */
    useSeedPatient?: boolean;
    searchName?: string;
    expectedResult?: string;
    shouldFind: boolean;
}

for (const data of searchData as PatientSearchCase[]) {
    const title = data.useSeedPatient ? 'seed patient' : data.searchName;

    test(`[${data.testId}] Verify Patient Search for: ${title}`, async ({ page, patientPage, seedPatient }) => {
        const searchName = data.useSeedPatient ? seedPatient.firstName : data.searchName!;
        const expectedResult = data.useSeedPatient
            ? `${seedPatient.lastName}, ${seedPatient.firstName}`
            : data.expectedResult!;

        await patientPage.goto();

        await expect(async () => {
            await patientPage.searchForPatient(searchName);
        }).toPass();

        await page.waitForLoadState('networkidle');

        if (data.shouldFind) {
            const patientGrid = page.locator('.mtab-primary-panel');
            await expect(async () => {
                await expect(patientGrid).toContainText(expectedResult);
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
