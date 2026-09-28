import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ZonedDate, compareZonedDates, parseSchedulerDateLabel, schedulerDateLabel } from "../utils/time";

/** Scheduler POM, extended with BasePage to handle the PrimeNG confirmation prompts. */
export class SchedulerPage extends BasePage {
    readonly notesModalHeader: Locator;
    readonly currentDate: Locator;
    readonly nextDateBtn: Locator;
    readonly prevDateBtn: Locator;
    readonly selectProvidersBtn: Locator;
    readonly editCriteriaBtn: Locator;
    readonly filterDialog: Locator;
    readonly rescheduleReasonDialog: Locator;

    constructor(page: Page) {
        super(page);

        this.notesModalHeader = page.getByText('Notes ui-btnAdd Notes');

        // Date header ("Tue, Sep 29, 26") and its prev/next arrows
        this.currentDate = page.locator('.mtab-scheduler-current-date');
        this.nextDateBtn = page.locator('button.mtab-date-prev-next:has(.mt-icon-chevron-right)');
        this.prevDateBtn = page.locator('button.mtab-date-prev-next:has(.mt-icon-chevron-left)');

        // The provider/location filter opens from "Select Providers and Locations" when the user has no
        // saved criteria yet, otherwise from the pencil ("Edit Selected Scheduler Criteria")
        this.selectProvidersBtn = page.getByRole('button', { name: 'Select Providers and Locations' });
        this.editCriteriaBtn = page.locator('.mt-icon-pencil').locator('visible=true').first();
        this.filterDialog = page.locator('.ui-dialog:visible').filter({ hasText: 'Scheduler Filter' });

        this.rescheduleReasonDialog = page.getByRole('dialog', { name: 'Reason for reschedule' });
    }

    async goto(): Promise<void> {
        await this.page.goto('/#/app/scheduler');
        await this.page.waitForLoadState('networkidle');
    }

    /** The Notes popup is closed by the global prompt handler (utils/promptHandlers.ts); this just confirms it's gone. */
    async closeNotesModalIfOpen(): Promise<void> {
        await expect(this.notesModalHeader).not.toBeVisible();
    }

    // ==========================================
    // PROVIDER COLUMNS
    // ==========================================
    /** Column header for a provider at a facility, e.g. "Adre, Rush - Carle Clinicc" */
    providerColumn(providerName: string, facilityName: string): Locator {
        return this.page.locator('.fc-head').getByText(`${providerName} - ${facilityName}`, { exact: true });
    }

    /**
     * Makes sure the day view has a column for this provider at this facility. Reuses the user's saved
     * criteria when it already contains them, otherwise adds them through the Scheduler Filter
     * (which saves them to this user's criteria).
     */
    async showProvider(providerName: string, facilityName: string): Promise<void> {
        const column = this.providerColumn(providerName, facilityName);
        const savedEntry = this.page.locator('.mtab-schedule-fitler-drag-drop-list-item')
            .filter({ hasText: `${providerName} - ${facilityName}` });

        // The criteria panel and the calendar columns render after the page settles; decide only once
        // something is there, otherwise a provider that's already selected looks missing
        await expect(column.or(savedEntry).or(this.selectProvidersBtn).or(this.editCriteriaBtn).first()).toBeVisible();
        await savedEntry.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { /* not in the saved criteria */ });

        if (await savedEntry.isVisible()) {
            await this.tickSavedEntry(savedEntry);
            await expect(column).toBeVisible();
            return;
        }
        if (await column.isVisible()) return;

        if (await this.selectProvidersBtn.isVisible()) {
            await this.selectProvidersBtn.click();
        } else {
            await this.editCriteriaBtn.click();
        }
        await expect(this.filterDialog).toBeVisible();

        // Narrow the provider list to this provider
        const employeeField = this.filterDialog.locator('.form-input').filter({ has: this.page.getByText('Employee', { exact: true }) });
        if (!await employeeField.isVisible()) {
            await this.filterDialog.locator('.ui-panel-titlebar-toggler').first().click();
        }
        const lastName = (providerName.split(',')[0] ?? providerName).trim();
        await employeeField.locator('input:visible').first().fill(lastName);
        await this.page.locator('.ui-autocomplete-panel:visible, .ui-overlaypanel:visible')
            .getByText(providerName, { exact: false }).first().click();
        await this.filterDialog.getByRole('button', { name: 'Filter', exact: true }).click();

        // Tick the facility in that provider's row and save the criteria. If it's already ticked, close
        // instead: saving unchanged criteria fails with "Same Name(s) is/are already present".
        const facilityBox = this.filterDialog.locator('.selection-list-item')
            .filter({ hasText: facilityName }).first().locator('.ui-chkbox-box');
        if (await this.isTicked(facilityBox)) {
            await this.filterDialog.getByRole('button', { name: 'Close' }).click();
        } else {
            await facilityBox.click();
            await this.filterDialog.getByRole('button', { name: 'Save' }).click();
        }
        await expect(this.filterDialog).toBeHidden();

        await this.tickSavedEntry(savedEntry);
        await expect(column).toBeVisible();
    }

    private async isTicked(checkboxBox: Locator): Promise<boolean> {
        return await checkboxBox.evaluate((el) => el.classList.contains('ui-state-active'));
    }

    /** Ticks a provider entry in the left criteria panel (clicking an already ticked one would hide its column). */
    private async tickSavedEntry(savedEntry: Locator): Promise<void> {
        const box = savedEntry.locator('.ui-chkbox-box');
        await expect(box).toBeVisible();
        if (!await this.isTicked(box)) {
            await box.click();
        }
    }

    // ==========================================
    // DATE NAVIGATION
    // ==========================================
    /** Steps the day view to `target` using the header's prev/next arrows. */
    async goToDate(target: ZonedDate, maxSteps = 14): Promise<void> {
        const targetLabel = schedulerDateLabel(target);
        for (let step = 0; step < maxSteps; step++) {
            const shownLabel = (await this.currentDate.innerText()).trim();
            if (shownLabel === targetLabel) {
                await this.page.waitForLoadState('networkidle');
                return;
            }
            const forward = compareZonedDates(target, parseSchedulerDateLabel(shownLabel)) > 0;
            await (forward ? this.nextDateBtn : this.prevDateBtn).click();
            await expect(this.currentDate).not.toHaveText(shownLabel);
        }
        throw new Error(`Scheduler: could not navigate to "${targetLabel}" (showing "${await this.currentDate.innerText()}")`);
    }

    // ==========================================
    // APPOINTMENTS
    // ==========================================
    appointment(text: string): Locator {
        return this.page.locator('.fc-event').filter({ hasText: text });
    }

    /** 15-minute row of the day view, `time` as "HH:MM" in the facility's time zone */
    timeSlot(time: string): Locator {
        return this.page.locator(`.fc-slats tr[data-time="${time}:00"]`).first();
    }

    /**
     * Drags an appointment onto another time row, staying in its own column. Uses real mouse steps
     * because FullCalendar only starts a drag after the pointer has moved a few pixels.
     */
    async dragAppointment(appointment: Locator, fromTime: string, toTime: string): Promise<void> {
        // Bring the start row to the top of the grid's scroller so both rows are on screen
        await this.timeSlot(fromTime).evaluate((row) => row.scrollIntoView({ block: 'start' }));
        await expect(appointment).toBeVisible();

        const from = await appointment.boundingBox();
        const target = await this.timeSlot(toTime).boundingBox();
        if (!from || !target) throw new Error(`Scheduler: appointment or ${toTime} row is not on screen`);

        // Grab to the right of the patient-name link and away from the bottom resize handle
        const x = from.x + from.width * 0.75;
        await this.page.mouse.move(x, from.y + 8);
        await this.page.mouse.down();
        await this.page.mouse.move(x, from.y + 30, { steps: 5 });
        await this.page.mouse.move(x, target.y + 8, { steps: 20 });
        await this.page.mouse.up();
    }

    /**
     * Gets through the prompts a reschedule can raise: an availability warning (answered Yes by
     * BasePage) and, on clinics that require it, a "Reason for reschedule" form.
     */
    async confirmReschedule(reason: string): Promise<void> {
        await this.handlePotentialModal('Reschedule');

        try {
            await this.rescheduleReasonDialog.waitFor({ state: 'visible', timeout: 5000 });
        } catch {
            return; // This clinic doesn't ask for a reason
        }
        // The dialog also holds a hidden read-only input; the Reason field is the visible one
        await this.rescheduleReasonDialog.getByRole('textbox').filter({ visible: true }).first().fill(reason);
        await this.rescheduleReasonDialog.getByRole('button', { name: 'Save' }).click();
        await expect(this.rescheduleReasonDialog).toBeHidden();
    }
}
