import { test, expect } from "../utils/fixtures";

test('Verify Top Bar Elements with Soft Assertions @topbar @smoke @targeted', async ({ page, topBar }) => {
    await topBar.goto();

    await expect.soft(topBar.iptBtn).toBeVisible();

    await expect.soft(topBar.arBtn).toBeVisible();

    await expect.soft(topBar.statementsBtn).toBeVisible();

    await page.waitForTimeout(2000);
});
