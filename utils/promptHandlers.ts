import { Locator, Page } from "@playwright/test";

/**
 * Informational popups that can appear at any time (after login, after a new build, when a
 * screen has alerts) and whose mask blocks every click. They carry no test meaning, so they're
 * closed automatically.
 *
 * Uses page.addLocatorHandler: Playwright checks for these before every action and auto-waiting
 * assertion, and only runs the handler when the dialog is actually visible, so no time is spent
 * waiting for dialogs that never appear.
 *
 * Don't add confirmation prompts (Yes/No) here; those are part of test flows (see BasePage.handlePotentialModal).
 */
interface Prompt {
    name: string;
    dialog: (page: Page) => Locator;
    dismiss: (dialog: Locator) => Promise<void>;
}

const PROMPTS: Prompt[] = [
    {
        // One-time per account after each deployment
        name: 'Release note',
        dialog: (page) => page.getByRole('dialog').filter({ hasText: /Release Note - v/ }),
        dismiss: (dialog) => dialog.getByRole('button', { name: 'OK' }).click(),
    },
    {
        // Notes & alerts popup shown on login, the patient list, the scheduler, ... Its accessible
        // name is "Notes" or "Notes ui-btn Add Notes" depending on the screen.
        name: 'Notes',
        dialog: (page) => page.getByRole('dialog', { name: /^Notes\b/ }),
        // On some screens the app's loading overlay stays on top of this popup, so a real mouse click
        // never reaches the close button. Fire the click event on the button directly instead.
        dismiss: (dialog) => dialog.getByRole('button', { name: 'close' }).dispatchEvent('click'),
    },
];

export async function registerPromptHandlers(page: Page): Promise<void> {
    for (const prompt of PROMPTS) {
        await page.addLocatorHandler(prompt.dialog(page), async (dialog) => {
            console.log(`[Prompt] Dismissing "${prompt.name}" dialog`);
            await prompt.dismiss(dialog);
        });
    }
}
