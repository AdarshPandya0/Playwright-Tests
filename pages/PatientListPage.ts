import { expect, Page, Locator } from "@playwright/test";

export class PatientListPage {
    readonly page: Page;
    readonly filterToggleBtn: Locator;
    readonly firstNameInput: Locator;
    readonly filterSubmitBtn: Locator;
    readonly printfacesheetBtn: Locator;
    readonly savefacesheetBtn: Locator;
    readonly orderByPatientColumnBtn: Locator;
    readonly ptInfoIconBtn: Locator;
    readonly ptIconBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.filterToggleBtn = page.locator('#ui-panel-0-label');
        this.firstNameInput = page.locator('mtab-form-input').filter({ hasText: 'First Name' }).getByRole('textbox');

        this.filterSubmitBtn = page.getByRole('button', { name: 'Filter', exact: true });

        this.printfacesheetBtn = page.locator('.mtab-icon.mt-icon.mt-icon-print');

        this.savefacesheetBtn = page.getByRole('button', { name: 'Save Facesheet' });
        this.orderByPatientColumnBtn = page.getByRole('link').filter({ hasText: /^$/ }).nth(0);
        this.ptInfoIconBtn = page.locator('.mt-icon.mt-icon-info').first();
        this.ptIconBtn = page.locator('.mtab-icon.mt-icon.mt-icon-user');
    }

    async goto(): Promise<void> {
        await expect(async () => {
            await this.page.goto('/#/app/patient');
            await this.page.waitForLoadState('networkidle');
            await expect(this.ptIconBtn.first()).toBeVisible({
                timeout: 500,
            });
        }).toPass();
    }

    async openFiltersIfNeeded(): Promise<void> {
        const isExpanded = await this.filterToggleBtn.getAttribute('aria-expanded');
        if (isExpanded === 'false') {
            await this.filterToggleBtn.click();
            await this.page.waitForTimeout(500);
        }
    }

    async openFindaSlotFirstRecord(): Promise<void> {
        await this.page.locator('.mtab-icon.mt-icon.mt-reg-icon').first().click();
        await expect(this.page.locator('div').filter({ hasText: 'Find a slot ui-btn' }).nth(1)).toBeVisible();
    }

    async searchForPatient(firstName: string): Promise<void> {
        await this.openFiltersIfNeeded();

        await this.firstNameInput.clear();
        await this.firstNameInput.fill(firstName);
        await this.filterSubmitBtn.click();
    }

    async clickOrderByPatientColumn(): Promise<void> {
        await this.orderByPatientColumnBtn.click();
    }
}
