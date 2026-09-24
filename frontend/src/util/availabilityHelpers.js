import { formatDbTime } from "./dateTimeHelpers";

// Sentinel time range the backend uses to mean "unavailable/off the entire
// day" (see setAvailability's "all" option and the mock data seeder) - it
// won't line up with any real shift type's time range, so it has to be
// special-cased rather than matched against shiftTypes.
const FULL_DAY_START = "00:00:00";
const FULL_DAY_END = "23:59:59";

// Groups unavailability/request-off rows by employee + day (a specific date,
// or a recurring day-of-week) so the calendar can show one combined event per
// employee per day instead of one event per underlying shift row.
export function groupRowsByEmployeeAndDay(rows, dayField) {
    const groups = new Map();
    rows.forEach((row) => {
        const key = `${row.userId}_${row[dayField]}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    });
    return [...groups.values()];
}

// Given the rows for one employee on one day, describes which shift(s) they
// cover - e.g. "Open, Close" or "All Day" - by matching each row's time range
// against the known shift types. Falls back to a formatted time range for any
// row that doesn't match a known shift type.
export function summarizeShiftCoverage(rows, shiftTypes) {
    const isExplicitFullDay = rows.some(
        (row) =>
            row.startTime === FULL_DAY_START && row.endTime === FULL_DAY_END,
    );
    if (isExplicitFullDay) return "All Day";

    const matchedNames = new Set();
    const unmatchedRanges = new Set();

    rows.forEach((row) => {
        const matched = shiftTypes.find(
            (s) => s.startTime === row.startTime && s.endTime === row.endTime,
        );
        if (matched) {
            matchedNames.add(matched.name);
        } else {
            unmatchedRanges.add(
                `${formatDbTime(row.startTime)}-${formatDbTime(row.endTime)}`,
            );
        }
    });

    const coversEveryShiftType =
        shiftTypes.length > 0 &&
        matchedNames.size === shiftTypes.length &&
        unmatchedRanges.size === 0;

    if (coversEveryShiftType) return "All Day";

    return [...matchedNames, ...unmatchedRanges].join(", ");
}
