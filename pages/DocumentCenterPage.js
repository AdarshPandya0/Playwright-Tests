import { expect } from "@playwright/test";

export class DocumentCenterPage {

    constructor(page) {
        this.page = page;

        this.sidebarDocsLink = page.getByRole('link', {name : 'Documents'}); // Patient Chart sidebar link
        this.folderSearchInput = page.getByRole('textbox', {name : /Search Folder/}); // Patient Char Document folder search
        this.faceSheetFolder = page.getByRole('cell', { name: /Patient Face Sheet/ }); // Searching for Print Face Sheet folder in the document explorer
        this.fileIcons = page.locator('.mtab-document-explorer-list-icon'); // File Icon within the folder
        this.viewerTitleBase = page.locator('.mtab-file-view-header'); // Document title in the viewer
        // this.jsReportError = page.getByText('')

    } 
    
    async navigateToSidebar () {
        await this.sidebarDocsLink.click();
        await this.page.waitForTimeout(1000);
    }

    async openFaceSheetFolder() {
        await this.folderSearchInput.fill('Patient Face Sheet');
        await this.page.waitForTimeout(1000);
        await this.faceSheetFolder.click();
    }

    async openLastDocument() {

        await expect(this.fileIcons.first()).toBeVisible();

        const lastFile = this.fileIcons.last();
        const fileName = await lastFile.textContent();

        await lastFile.click();

        return fileName.trim();
    }

    async verifyViewerSuccess(expectedFileName) {
        
        const expectedViewerTitle = this.viewerTitleBase.filter({hasText : expectedFileName});
        await expect(expectedViewerTitle).toBeVisible({ timeout : 10000 });

        //await expect(this.jsReportError).not.toBeVisible();
    }
}