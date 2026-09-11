import { expect, Page, Locator } from "@playwright/test";

export class SchedulerPage {
    readonly page: Page;
    readonly notesModalHeader: Locator;
    readonly notesCloseBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.notesModalHeader = page.getByText('Notes ui-btnAdd Notes');
        this.notesCloseBtn = page.getByRole('button', { name: 'close' });
    }

    async goto(): Promise<void> {
        await this.page.goto('/#/app/scheduler');
        await this.page.waitForLoadState('networkidle');
    }

    async closeNotesModalIfOpen(): Promise<void> {
        if (await this.notesModalHeader.isVisible()) {
            await this.notesCloseBtn.click();
            await expect(this.notesModalHeader).not.toBeVisible();
        }
    }
}
