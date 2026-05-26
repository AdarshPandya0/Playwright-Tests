import { test, expect } from "../utils/fixtures.js";

test.skip('Verify Scheduler Drag and Drop functionality  @scheduler @regression', async( { page, scheduler } ) => {

    await scheduler.goto();

    await scheduler.closeNotesModalIfOpen();

    // Dragging the appointment from one time slot to another 

    const appointment = page.locator('a').filter({ hasText: 'Thunderfolk, Cassius (173)08:' });

    const targetColumn = page.locator('.fc-day > table > tbody > tr > td:nth-child(6)');

    const columnBox = await targetColumn.boundingBox();
    expect(columnBox).not.toBeNull();

    // await appointment.hover();
    // await page.mouse.down();
    // const carddBox = await appointment.boundingBox();
    // await page.mouse.move(carddBox.x + 20, carddBox.y + 20);
    // await page.waitForTimeout(300);

    // await page.mouse.wheel(0, 500);

    // await page.waitForTimeout(500);

    // columnBox = await targetColumn.boundingBox();

    // const targetX = columnBox.x + (columnBox.width / 2);
    // const targetY = columnBox.y + 200;

    // await page.mouse.move(columnBox.x, targetY, { steps: 5 });
    // await page.waitForTimeout(300);
    // await page.mouse.up();

    const targetX = columnBox.width / 2;
    const targetY = 400;

    await appointment.dragTo(targetColumn,{
        targetPosition: { x : targetX, y:targetY },
        force: true // Pierce any overlapping shadow elements during the drop
    });

    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Appointment updated successfully')).toBeVisible();
    
});