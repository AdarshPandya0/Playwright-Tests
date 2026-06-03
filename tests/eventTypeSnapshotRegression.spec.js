import { test, expect } from '../utils/fixtures.js';

test('Event Type Snapshot Regression Test', async ({ page }) => {
    
    await page.route('**/api/eventtype?**', route => {
                            route.fulfill({
                                    status: 200,
                                    contentType: 'application/json',
                                    body: JSON.stringify({
                                        "data": {
                                            "messages": [],
                                            "pagination": {
                                                "count": 2,
                                                "size": 10,
                                                "page": 1
                                            },
                                            "result": [
                                                {
                                                    "id": 100062,
                                                    "clientId": 10006,
                                                    "lastModifiedDate": 1764061791412,
                                                    "sequence": 1,
                                                    "count": 2,
                                                    "isActive": true,
                                                    "color": "#3ddb59",
                                                    "name": "Discussion"
                                                },
                                                {
                                                    "id": 100061,
                                                    "clientId": 10006,
                                                    "lastModifiedDate": 1763365287534,
                                                    "sequence": 1,
                                                    "count": 2,
                                                    "isActive": true,
                                                    "color": "#51f1d9",
                                                    "name": "General Meeting"
                                                }
                                            ]
                                        },
                                        "status": "success"
                                    }
                                )
                        });   
    });

    await page.goto('/#/app/setup/scheduler/event-type');

    await page.waitForTimeout(2000); // Wait for the page to load and render

    await expect(page).toHaveScreenshot('event-type-snapshot.png', {
        maxDiffPixels : 50
    });

});
