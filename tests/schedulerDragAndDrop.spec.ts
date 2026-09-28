import { test, expect } from "../utils/fixtures";

test.skip('Verify Scheduler Drag and Drop functionality @scheduler @regression', async ({ page, scheduler }) => {
    await scheduler.goto();

    await scheduler.closeNotesModalIfOpen();

    // Dragging the appointment from one time slot to another
    const appointment = page.locator('a').filter({ hasText: 'Thunderfolk, Cassius (173)08:' });
    const targetColumn = page.locator('.fc-day > table > tbody > tr > td:nth-child(6)');

    const columnBox = await targetColumn.boundingBox();
    expect(columnBox).not.toBeNull();

    const targetX = (columnBox?.width ?? 0) / 2;
    const targetY = 400;

    await appointment.dragTo(targetColumn, {
        targetPosition: { x: targetX, y: targetY },
        force: true, // Pierce any overlapping shadow elements during the drop
    });

    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Appointment updated successfully')).toBeVisible();
});
