import { expect } from "@playwright/test";

export class SchedulerPage {

    constructor(page) {
        this.page = page;

        this.notesModalHeader = page.getByText('Notes ui-btnAdd Notes');
        this.notesCloseBtn = page.getByRole('button', { name: 'close' });
    }

    async goto() {
        await this.page.goto("https://webims.meditab.local/#/app/scheduler");
        await this.page.waitForLoadState('networkidle');
    }

    async closeNotesModalIfOpen() {
        if (await this.notesModalHeader.isVisible()) {
            await this.notesCloseBtn.click();
            await expect(this.notesModalHeader).not.toBeVisible();
        }
    }    
}