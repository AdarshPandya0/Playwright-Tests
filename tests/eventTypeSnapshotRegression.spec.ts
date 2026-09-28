import fs from 'fs';
import { test, expect } from '../utils/fixtures';
import { ENV_NAME } from '../utils/testData';
import mockEventTypeList from '../data/mockEventTypeList.json';

// Baselines are per environment (local and prod can run different builds) and per OS
// (Playwright adds the -chromium-win32 / -chromium-linux suffix).
const SNAPSHOT = `event-type-grid-${ENV_NAME}.png`;

test('Event Type Snapshot Regression Test', async ({ page }, testInfo) => {
    // Linux baselines can only be produced on the CI runner. Until one is committed, skip in CI
    // instead of failing; generate it with the workflow's "update_snapshots" option.
    test.skip(
        !!process.env.CI && !process.env.UPDATE_SNAPSHOTS && !fs.existsSync(testInfo.snapshotPath(SNAPSHOT, { kind: 'screenshot' })),
        `No ${process.platform} baseline for ${SNAPSHOT} yet - run the workflow with update_snapshots and commit the artifact`
    );

    await page.route('**/api/eventtype?**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockEventTypeList),
        });
    });

    await page.goto('/#/app/setup/scheduler/event-type');

    // Only the grid is compared: its rows come from the mock above, whereas the rest of the page
    // (top bar, sidebar message/task counters) changes with live data.
    // Other open tabs (e.g. Dashboard) keep their own grid forms in the DOM, so pick ours by its rows
    const eventTypeGrid = page.locator('form.mtab-grid-form').filter({ hasText: 'General Meeting' });
    await expect(eventTypeGrid).toBeVisible();

    // Deliberate fixed wait: this is a pixel snapshot, so we wait for the grid's
    // render/animation to fully settle rather than just for network activity to stop.
    await page.waitForTimeout(2000);

    await expect(eventTypeGrid).toHaveScreenshot(SNAPSHOT, {
        maxDiffPixels: 50,
    });
});
