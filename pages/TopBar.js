import { expect } from "@playwright/test";

export class TopBar {

    constructor(page) {
        this.page = page;

        this.searchBar = page.getByRole('textbox', { name: ' Search Patient - lname' }); // Global Search bar in the top bar
        this.searchBarAddBtn = page.locator('#add'); // The + button in the global search bar > Bottom Left
    }
}