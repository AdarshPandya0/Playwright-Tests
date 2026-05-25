import { test, expect } from "../utils/fixtures.js";
import searchdata from '../data/patientSearch.json';

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