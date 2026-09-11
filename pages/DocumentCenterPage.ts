import { expect, Page, Locator } from "@playwright/test";

export class DocumentCenterPage {
    readonly page: Page;
    readonly sidebarDocsLink: Locator;
    readonly folderSearchInput: Locator;
    readonly faceSheetFolder: Locator;
    readonly fileIcons: Locator;
    readonly viewerTitleBase: Locator;

    constructor(page: Page) {
        this.page = page;

        this.sidebarDocsLink = page.getByRole('link', { name: 'Documents' }); // Patient Chart sidebar link
        this.folderSearchInput = page.getByRole('textbox', { name: /Search Folder/ }); // Patient Chart document folder search
        this.faceSheetFolder = page.getByRole('cell', { name: /Patient Face Sheet/ }); // "Print Face Sheet" folder in the document explorer
        this.fileIcons = page.locator('.mtab-document-explorer-list-icon'); // File icon within the folder
        this.viewerTitleBase = page.locator('.mtab-file-view-header'); // Document title in the viewer
    }

    async navigateToSidebar(): Promise<void> {
        await this.sidebarDocsLink.click();
        await this.page.waitForTimeout(1000);
    }

    async openFaceSheetFolder(): Promise<void> {
        await this.folderSearchInput.fill('Patient Face Sheet');
        await this.page.waitForTimeout(1000);
        await this.faceSheetFolder.click();
    }

    async openLastDocument(): Promise<string> {
        await expect(this.fileIcons.first()).toBeVisible();

        const lastFile = this.fileIcons.last();
        const fileName = await lastFile.textContent();

        await lastFile.click();

        return (fileName ?? '').trim();
    }

    async verifyViewerSuccess(expectedFileName: string): Promise<void> {
        const expectedViewerTitle = this.viewerTitleBase.filter({ hasText: expectedFileName });
        await expect(expectedViewerTitle).toBeVisible({ timeout: 10000 });
    }
}
