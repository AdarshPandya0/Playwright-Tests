import { expect, test } from '../utils/fixtures';
import mockDrugCheckError from '../data/mockDrugCheckError.json';

test('Verify Error Prompt @patient @regression', async ({ page, patientPage }) => {
    await patientPage.goto();

    await page.route(
        '**/api/patient/fetch?page=1&size=20&orderBy=name&search=&title=&isSorted=true',
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockDrugCheckError),
            });
        }
    );

    await patientPage.orderByPatientColumnBtn.click();

    const errorMessage = page.getByText('An error occurred. Please contact support.');

    await expect(errorMessage).toBeVisible();
});
