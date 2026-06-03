import { expect } from '@playwright/test';


export const StatusBadgeList = Object.freeze({
  Waiting: 'name',
  InProgress: 'I',
  CheckOut: 'O'
});

export class CicoPage {
    constructor(page) {
        this.page = page;
        
        // Base View Locators
        this.gridViewBtn = page.locator('div').filter({ hasText: /^Grid$/ });
        this.panelViewBtn = page.locator('div').filter({ hasText: /^Panel$/ });
        this.filterClearBtn = page.locator('.ui-autocomplete-token-icon');
        this.gridPane = page.locator('mtab-widget-container > div');
        this.groupByConfigBtn = page.locator('.ui-multiselect-trigger-icon').first();

        // Base Bucket Locators
        this.apptsWidget = page.locator('mtab-appointment-widget');
        this.waitingAndInProgressWidget = page.locator('.mtab-checkin-widget-card-container');
        this.waitingBadgeCount = page.locator('.mtab-checkin-widget-badge').first();
        this.gridApptList = page.locator('.mtab-cico-appointment-list-container');

        this.facilityDropdownFooterAddBtn = page.locator('#footerDiv')

        this.apptsSearchInput = this.apptsWidget.getByRole('textbox', { name: /Patient name, Chart#, DOB/i });
        this.gridApptListSearchInput = this.gridApptList.getByRole('textbox', { name: /Patient name, Chart#, DOB/i });

    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    // This removes all the duplicated wait/clear logic from your goto and view clicks!
    async _clearFiltersAndWait() {
        if (await this.filterClearBtn.isVisible()) {
            await this.filterClearBtn.click(); 
            await this.page.waitForTimeout(2000);
            if (await this.facilityDropdownFooterAddBtn.isVisible()) {
                await this.page.keyboard.press('Escape'); 
            }
        }
        await this.page.waitForTimeout(1000); 
    }

    // ==========================================
    // NAVIGATION & VIEWS
    // ==========================================
    async goto() {
        await this.page.goto('/#/app/check-in');
        await this.page.waitForLoadState('networkidle');
        await this._clearFiltersAndWait();
    }

    async clickGridView() {
        await this.gridViewBtn.click();
        await this._clearFiltersAndWait();
    }
    
    async clickPanelView() {
        await this.panelViewBtn.click();
        await this._clearFiltersAndWait();
    }

    // ==========================================
    // APPTS BUCKET (Panel View)
    // ==========================================
    async checkInPatient(patientName) {
        // Find the specific card inside the appts widget that contains the patient's name
        const patientCard = this.apptsWidget.locator('div').filter({ hasText: patientName }).first();
        
        // Scope the click strictly to that specific patient's card!
        // (Using a simpler selector, but you can swap to your longer one if it's strictly necessary)
        await patientCard.locator('.mtab-xxx-hide > .mtab-xxx-36').first().click();
        await this.page.waitForTimeout(5000); // Wait for the check-in action to process
        if ( await this.page.getByRole('button', { name: 'Yes' }).isVisible() ) {
            await this.page.getByRole('button', { name: 'Yes' }).click();
        } 
    }

    // ==========================================
    // WAITING BUCKET (Panel View)
    // ==========================================
    async verifyPatientInWaitingOrInProgress(patientName) {
        // Assert the card exists in the waiting widget
        const patientCard = this.waitingAndInProgressWidget.locator('div').filter({ hasText: patientName }).first();
        await expect(patientCard).toBeVisible();
    }

    async checkOutPatientFromWaiting(patientName) {
        const patientCard = this.waitingAndInProgressWidget.locator('div').filter({ hasText: patientName }).first();
        await patientCard.locator('.mtab-cico-panel-action-icon').click();
    }

    async getWaitingCount() {
        // Extract the number from the badge
        const badgeText = await this.waitingBadgeCount.innerText();
        return parseInt(badgeText.trim(), 10) || 0; 
    }

    // ==========================================
    // GRID VIEW VALIDATIONS
    // ==========================================
    async verifyPatientInGridLeftSide(patientName) {
        // Solution to your wildcard (*) problem: Use a RegExp!
        // By using `new RegExp(patientName)`, it matches the name regardless of what text comes after it (like HH:MM PM).
        const leftGridCard = this.page.locator('.mtab-appointment-widget-card-container-grid')
                                      .filter({ hasText: new RegExp(patientName, 'i') }).first();
        await expect(leftGridCard).toBeVisible();
    }

    async getPostCheckInStatusBadgeFromGrid(patientName) {
        const centralGridRow = this.page.locator('.mtab-cico-grid-filter-gridform-container')
                                        .filter({ hasText: patientName }).first();
        const statusBadgeW = centralGridRow.getByText(StatusBadgeList.Waiting, { exact: true }).first();
        const statusBadgeI = centralGridRow.getByText(StatusBadgeList.InProgress, { exact: true }).first();
        const statusBadgeCO = centralGridRow.getByText(StatusBadgeList.CheckOut, { exact: true }).first();

        await expect(statusBadgeW.or(statusBadgeI).or(statusBadgeCO)).toBeVisible();
        
        if (await statusBadgeW.isVisible()) return StatusBadgeList.Waiting;
        if (await statusBadgeI.isVisible()) return StatusBadgeList.InProgress;
        if (await statusBadgeCO.isVisible()) return StatusBadgeList.CheckedOut;
    
    }

    async verifyPatientInCentralGrid(patientName, statusLetter) {
        // Solution to the nth-child(6) Div problem
        // 1. Get ALL rows immediately inside the scrollable content
        // 2. Filter down to only the row containing our specific patient name
        const centralGridRow = this.page.locator('.mtab-cico-grid-filter-gridform-container')
                                        .filter({ hasText: patientName }).first();
        
        await expect(centralGridRow).toBeVisible();

        // Now that we have the exact row, we can assert on its children
        // Verifying the status badge ('W') exists specifically 
        const statusBadge = centralGridRow.getByText(statusLetter, { exact: true }).first();
        await expect.soft(statusBadge).toBeVisible();
    }

    async searchApptsBucket(searchText) {
        // 1. Click into the box first to ensure it has focus
        await this.apptsSearchInput.click();
        
        // 2. Clear any existing text just to be safe
        await this.apptsSearchInput.clear();

        // 3. The Magic Bullet: Type like a human, 100 milliseconds per keystroke
        await this.apptsSearchInput.pressSequentially(searchText, { delay: 100 });
        
        // 4. Hit Enter to force the search execution
        await this.apptsSearchInput.press('Enter');
        
        // 5. Wait for the frontend to process the filter
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000); // Buffer for Angular/React render cycle
    }

    async searchGridView(searchText) {
        await this.gridApptListSearchInput.click();
        await this.gridApptListSearchInput.clear();
        await this.gridApptListSearchInput.pressSequentially(searchText, { delay: 100 });
        await this.gridApptListSearchInput.press('Enter');
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
    }   

}