import { expect } from "@playwright/test";

export class TopBar {

    constructor(page) {
        this.page = page;

        this.arBtn = page.getByRole('link').filter({ hasText: 'Account Receivables' });
        this.iptBtn = page.getByRole('link').filter({ hasText: 'Insurance Payment Tracking' });
        this.statementsBtn = page.getByRole('link').filter({ hasText: 'Statements' });


        this.searchBar = page.getByRole('textbox', { name: ' Search Patient - lname' }); // Global Search bar in the top bar
        this.searchBarAddBtn = page.locator('#add'); // The + button in the global search bar > Bottom Left
    }

    async goto() {
        await this.page.goto('/#/app/main');
        await this.page.waitForLoadState('networkidle');
    }
}