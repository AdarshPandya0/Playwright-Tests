import { test, expect } from "../utils/fixtures.js";
import searchdata from '../data/patientSearch.json';
import AxeBuilder from '@axe-core/playwright';

for(const data of searchdata) {
    test(`[${data.testId}] Verify Patient Search for: ${data.searchName}`, async({ page, patientPage }) => {
        await patientPage.goto();

        await patientPage.searchForPatient(data.searchName);

        if (data.shouldFind) {
            const patientGrid = page.locator('.mtab-primary-panel');
            await expect(patientGrid).toContainText(data.expectedResult);
        }
        else {
            const noRecordsMsg = page.getByText("No Patient Found. click 'Add Patient' button to register new Patient.");
            await expect(noRecordsMsg).toBeVisible();
        }
    });
}

test('Accessibility Check on Patient Grid', async({ page, patientPage }, testInfo) => {

    await patientPage.goto();

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a' ,'wcag21aa']).analyze();

    await testInfo.attach('accessibility-scan-results.json', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json'
    });
});