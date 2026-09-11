import { expect, Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export const StatusBadgeList = Object.freeze({
    Waiting: 'name',
    InProgress: 'I',
    CheckOut: 'O',
});
export type StatusBadge = (typeof StatusBadgeList)[keyof typeof StatusBadgeList];

/** Main POM for CICO, extended with BasePage to handle PrimeNG prompts. */
export class CicoPage extends BasePage {
    // Base View Locators
    readonly gridViewBtn: Locator;
    readonly panelViewBtn: Locator;
    readonly filterClearBtn: Locator;
    readonly gridPane: Locator;
    readonly groupByConfigBtn: Locator;

    // Base Bucket Locators
    readonly apptsWidget: Locator;
    readonly waitingAndInProgressWidget: Locator;
    readonly waitingBadgeCount: Locator;
    readonly gridApptList: Locator;
    readonly facilityDropdownFooterAddBtn: Locator;
    readonly apptsSearchInput: Locator;
    readonly gridApptListSearchInput: Locator;

    constructor(page: Page) {
        super(page); // Pass the Page context up to BasePage for modal handling and shared locators

        this.gridViewBtn = page.locator('div').filter({ hasText: /^Grid$/ });
        this.panelViewBtn = page.locator('div').filter({ hasText: /^Panel$/ });
        this.filterClearBtn = page.locator('.ui-autocomplete-token-icon');
        this.gridPane = page.locator('mtab-widget-container > div');
        this.groupByConfigBtn = page.locator('.ui-multiselect-trigger-icon').first();

        this.apptsWidget = page.locator('mtab-appointment-widget');
        this.waitingAndInProgressWidget = page.locator('.mtab-checkin-widget-card-container');
        this.waitingBadgeCount = page.locator('.mtab-checkin-widget-badge').first();
        this.gridApptList = page.locator('.mtab-cico-appointment-list-container');

        this.facilityDropdownFooterAddBtn = page.locator('#footerDiv');

        this.apptsSearchInput = this.apptsWidget.getByRole('textbox', { name: /Patient name, Chart#, DOB/i });
        this.gridApptListSearchInput = this.gridApptList.getByRole('textbox', { name: /Patient name, Chart#, DOB/i });
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    /** Removes the duplicated filter-clear/wait logic from goto() and the view-switch clicks. */
    private async clearFiltersAndWait(): Promise<void> {
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
    async goto(): Promise<void> {
        await this.page.goto('/#/app/check-in');
        await this.page.waitForLoadState('networkidle');
        await this.clearFiltersAndWait();
    }

    async clickGridView(): Promise<void> {
        await this.gridViewBtn.click();
        await this.clearFiltersAndWait();
    }

    async clickPanelView(): Promise<void> {
        await this.panelViewBtn.click();
        await this.clearFiltersAndWait();
    }

    // ==========================================
    // APPTS BUCKET (Panel View)
    // ==========================================
    async checkInPatient(patientName: string): Promise<void> {
        // Find the specific card inside the appts widget that contains the patient's name
        const patientCard = this.apptsWidget.locator('div').filter({ hasText: patientName }).first();

        // Scope the click strictly to that specific patient's card
        await patientCard.locator('.mtab-xxx-hide > .mtab-xxx-36').first().click();
        await this.page.waitForTimeout(4000); // Buffer for any immediate frontend changes
        await this.page.waitForLoadState('networkidle');

        // Handle any modals that pop up during check-in
        await this.handlePotentialModal(`Check-In for ${patientName}`);
    }

    // ==========================================
    // WAITING BUCKET (Panel View)
    // ==========================================
    async verifyPatientInWaitingOrInProgress(patientName: string): Promise<void> {
        const patientCard = this.waitingAndInProgressWidget.locator('div').filter({ hasText: patientName }).first();
        await expect(patientCard).toBeVisible();
    }

    async checkOutPatientFromWaiting(patientName: string): Promise<void> {
        const patientCard = this.waitingAndInProgressWidget.locator('div').filter({ hasText: patientName }).first();
        await patientCard.locator('.mtab-cico-panel-action-icon').click();
    }

    async getWaitingCount(): Promise<number> {
        const badgeText = await this.waitingBadgeCount.innerText();
        return parseInt(badgeText.trim(), 10) || 0;
    }

    // ==========================================
    // GRID VIEW VALIDATIONS
    // ==========================================

    /** Only for pre-check-in appointments; the left-side card does not display checked-in appointments. */
    async verifyPatientInGridLeftSide(patientName: string): Promise<void> {
        // Using a RegExp lets this match the name regardless of trailing text (like an "HH:MM PM" stamp).
        const leftGridCard = this.page
            .locator('.mtab-appointment-widget-card-container-grid')
            .filter({ hasText: new RegExp(patientName, 'i') })
            .first();
        await expect(leftGridCard).toBeVisible();
    }

    async getPostCheckInStatusBadgeFromGrid(patientName: string): Promise<StatusBadge> {
        const centralGridRow = this.page
            .locator('.mtab-cico-grid-filter-gridform-container')
            .filter({ hasText: patientName })
            .first();
        const statusBadgeW = centralGridRow.getByText(StatusBadgeList.Waiting, { exact: true }).first();
        const statusBadgeI = centralGridRow.getByText(StatusBadgeList.InProgress, { exact: true }).first();
        const statusBadgeCO = centralGridRow.getByText(StatusBadgeList.CheckOut, { exact: true }).first();

        await expect(statusBadgeW.or(statusBadgeI).or(statusBadgeCO)).toBeVisible();

        if (await statusBadgeW.isVisible()) return StatusBadgeList.Waiting;
        if (await statusBadgeI.isVisible()) return StatusBadgeList.InProgress;
        return StatusBadgeList.CheckOut;
    }

    async verifyPatientInCentralGrid(patientName: string, statusLetter: string): Promise<void> {
        // 1. Get the row containing our specific patient name
        const centralGridRow = this.page
            .locator('.mtab-cico-grid-filter-gridform-container')
            .filter({ hasText: patientName })
            .first();

        await expect(centralGridRow).toBeVisible();

        // Now that we have the exact row, assert on its children.
        // Verifying the status badge exists specifically within this row.
        const statusBadge = centralGridRow.getByText(statusLetter, { exact: true }).first();
        await expect.soft(statusBadge).toBeVisible();
    }

    async searchApptsBucket(searchText: string): Promise<void> {
        await this.searchInBox(this.apptsSearchInput, searchText);
    }

    async searchGridView(searchText: string): Promise<void> {
        await this.searchInBox(this.gridApptListSearchInput, searchText);
    }

    private async searchInBox(input: Locator, searchText: string): Promise<void> {
        // 1. Click into the box first to ensure it has focus
        await input.click();

        // 2. Clear any existing text just to be safe
        await input.clear();

        // 3. Type like a human so the app's keyup listeners fire correctly
        await input.pressSequentially(searchText, { delay: 100 });

        // 4. Hit Enter to force the search execution
        await input.press('Enter');

        // 5. Wait for the frontend to process the filter
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000); // Buffer for the Angular render cycle
    }
}
