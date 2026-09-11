import { test, expect } from '../utils/fixtures';
import mockEventTypeList from '../data/mockEventTypeList.json';

test('Event Type Snapshot Regression Test', async ({ page }) => {
    await page.route('**/api/eventtype?**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockEventTypeList),
        });
    });

    await page.goto('/#/app/setup/scheduler/event-type');

    // Deliberate fixed wait: this is a pixel snapshot, so we wait for the grid's
    // render/animation to fully settle rather than just for network activity to stop.
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('event-type-snapshot.png', {
        maxDiffPixels: 50,
    });
});
