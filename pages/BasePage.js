// pages/BasePage.js

export class BasePage {
    constructor(page) {
        this.page = page;
    }

    /**
     * PrimeNG Modal Catcher
     * @param {string} contextName - To Help track exactly where the modal popped up in the logs
     */
    async handlePotentialModal(contextName = 'Unknown Action') {
        // 1. Target the PrimeNG dialog container
        const modalContainer = this.page.locator('.ui-dialog').first();
        
        try {
            // Wait briefly for the dialog animation to finish rendering
            await modalContainer.waitFor({ state: 'visible', timeout: 1500 });
            
            // 2. Extract the Title and Body cleanly based on your DOM structure
            const titleText = await modalContainer.locator('.ui-dialog-title').innerText();
            const bodyText = await modalContainer.locator('.ui-dialog-content').innerText();
            const cleanBody = bodyText.replace(/\n/g, ' | ').trim(); 
            
            console.log(`\n========================================`);
            console.log(`A Prompt Appeared during [${contextName}]`);
            console.log(`TITLE: ${titleText}`);
            console.log(`MESSAGE: ${cleanBody}`);
            console.log(`========================================\n`);

            // 3. Look for the exact button IDs from your screenshot
            const yesBtn = modalContainer.locator('button#YES');
            const noBtn = modalContainer.locator('button#NO');
            const closeXBtn = modalContainer.locator('.ui-dialog-titlebar-close'); // The 'X' in the top right
            
            // Optional: If you have generic "Ok" buttons on error popups
            const okBtn = modalContainer.getByRole('button', { name: 'Ok', exact: true });

            // SCENARIO A: Confirmation Prompt (Has a 'Yes' button)
            if (await yesBtn.isVisible()) {
                console.log(`Action: Clicking 'Yes' to proceed.`);
                await yesBtn.click();
                
                // Wait for the PrimeNG exit animation to finish so the DOM is clear
                await modalContainer.waitFor({ state: 'hidden', timeout: 3000 });
                return; 
            }

            // SCENARIO B: Error or Warning Prompt (No 'Yes' button, just Ok/Close)
            if (await okBtn.isVisible() || await closeXBtn.isVisible() || cleanBody.toLowerCase().includes('error')) {
                
                // Try to dismiss it cleanly so the browser isn't locked
                if (await okBtn.isVisible()) {
                    await okBtn.click();
                } else if (await closeXBtn.isVisible()) {
                    await closeXBtn.click();
                }
                
                // Crash the test with the exact UI error message
                throw new Error(`ERROR PROMPT during [${contextName}]: [${titleText}] ${cleanBody}`);
            }

        } catch (error) {
            if (error.message.includes('ERROR PROMPT')) {
                throw error; // Fail the test
            }
            // If it's a TimeoutError, no modal appeared. Happy path! Let it continue silently.
        }
    }
}