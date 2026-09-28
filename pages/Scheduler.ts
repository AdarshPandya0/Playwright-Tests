import { expect, Page, Locator } from "@playwright/test";

export class SchedulerPage {
    readonly page: Page;
    readonly notesModalHeader: Locator;

    constructor(page: Page) {
        this.page = page;

        this.notesModalHeader = page.getByText('Notes ui-btnAdd Notes');
    }

    async goto(): Promise<void> {
        await this.page.goto('/#/app/scheduler');
        await this.page.waitForLoadState('networkidle');
    }

    /** The Notes popup is closed by the global prompt handler (utils/promptHandlers.ts); this just confirms it's gone. */
    async closeNotesModalIfOpen(): Promise<void> {
        await expect(this.notesModalHeader).not.toBeVisible();
    }
}
