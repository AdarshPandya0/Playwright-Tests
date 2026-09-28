/**
 * Time-zone helpers so tests can say "tomorrow 10:00 at the facility" regardless of where they
 * run (a developer machine on IST, a CI runner on UTC, ...). The scheduler shows appointments in the
 * facility's time zone ("Use Facility Timezone"), so that's the zone every calculation uses.
 */

export interface ZonedDate {
    year: number;
    month: number; // 1-12
    day: number;
}

interface ZonedParts extends ZonedDate {
    hour: number;
    minute: number;
    second: number;
}

function zonedParts(epochMs: number, timeZone: string): ZonedParts {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(epochMs);
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
    return {
        year: part('year'), month: part('month'), day: part('day'),
        hour: part('hour'), minute: part('minute'), second: part('second'),
    };
}

/** The calendar date `daysFromToday` days after today, as seen in `timeZone`. */
export function zonedDateFromToday(timeZone: string, daysFromToday: number): ZonedDate {
    const today = zonedParts(Date.now(), timeZone);
    const shifted = new Date(Date.UTC(today.year, today.month - 1, today.day + daysFromToday));
    return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

/** Epoch ms of a wall-clock time (`HH:MM`) on `date` in `timeZone`. */
export function zonedTimeToEpoch(date: ZonedDate, time: string, timeZone: string): number {
    const [hour = 0, minute = 0] = time.split(':').map(Number);
    const guess = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
    // How far the zone's wall clock is from UTC at that moment; one correction is enough outside DST jumps
    const p = zonedParts(guess, timeZone);
    const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - guess;
    return guess - offset;
}

/** Negative, zero or positive, like a sort comparator. */
export function compareZonedDates(a: ZonedDate, b: ZonedDate): number {
    return Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses the scheduler's date header, e.g. "Tue, Sep 29, 26". */
export function parseSchedulerDateLabel(label: string): ZonedDate {
    const match = /^\w{3}, (\w{3}) (\d{1,2}), (\d{2})$/.exec(label.trim());
    const [, month = '', day = '', year = ''] = match ?? [];
    if (!match || !MONTHS.includes(month)) throw new Error(`Unexpected scheduler date header: "${label}"`);
    return { year: 2000 + Number(year), month: MONTHS.indexOf(month) + 1, day: Number(day) };
}

/** The scheduler's date header format, e.g. "Tue, Sep 29, 26". */
export function schedulerDateLabel(date: ZonedDate): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: '2-digit',
    }).format(Date.UTC(date.year, date.month - 1, date.day, 12));
}
