import { expect, Page, Locator } from "@playwright/test";

export class TopBar {
    // 1. DECLARE PROPERTIES: Tell TypeScript what objects live inside this class.
    // Using 'readonly' is a TS best practice for POMs so we don't accidentally overwrite a locator later.

    readonly page: Page;
    readonly arBtn: Locator;
    readonly iptBtn: Locator;
    readonly statementsBtn: Locator;
    readonly searchBar: Locator;
    readonly searchBarAddBtn: Locator;

    // 2. TYPE THE ARGUMENTS: Tell the constructor it can ONLY accept a Playwright Page object.

    constructor(page: Page) {
        this.page = page;

        this.arBtn = page.getByRole('link').filter({ hasText: 'Account Receivables' });
        this.iptBtn = page.getByRole('link').filter({ hasText: 'Insurance Payment Tracking' });
        this.statementsBtn = page.getByRole('link').filter({ hasText: 'Statements' });


        this.searchBar = page.getByRole('textbox', { name: ' Search Patient - lname' }); // Global Search bar in the top bar
        this.searchBarAddBtn = page.locator('#add'); // The + button in the global search bar > Bottom Left
    }

    // 3. TYPE THE RETURN VALUE: Because 'goto' has an 'await', it returns a Promise. 
    // It doesn't return any actual data, so the Promise resolves to 'void' (nothing).
    async goto(): Promise<void> {
        await this.page.goto('/#/app/main');
        await this.page.waitForLoadState('networkidle');
    }
    // Example of how a method returning data would look:
    // async getSearchBarText(): Promise<string> {
    //     return await this.searchBar.inputValue();
    // }
}