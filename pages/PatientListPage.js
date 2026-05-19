import { expect } from "@playwright/test"; 

export class PatientListPage {

    constructor(page) {
        this.page = page;
        
        this.filterToggleBtn = page.locator('#ui-panel-0-label');
        this.firstNameInput = page.locator('mtab-form-input').filter({hasText : 'First Name'}).getByRole('textbox');

        this.filterSubmitBtn = page.getByRole('button', {name : 'Filter', exact : true});

        this.printfacesheetBtn = page.locator('.mtab-icon.mt-icon.mt-icon-print');

        this.savefacesheetBtn = page.getByRole('button', {name : 'Save Facesheet'});
    }

    async goto() {
        await this.page.goto("https://webims.meditab.local/#/app/patient");
    }

async openFiltersIfNeeded() {
    const isExpanded = await this.filterToggleBtn.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
        await this.filterToggleBtn.click();

        await this.page.waitForTimeout(500);
    }
}

async searchForPatient(firstName) {
    await this.openFiltersIfNeeded();

    await this.firstNameInput.clear();
    await this.firstNameInput.fill(firstName);
    await this.filterSubmitBtn.click();

}

}