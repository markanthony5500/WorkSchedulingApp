export function getDbDateOnly(dbDateValue) {
    if (!dbDateValue) return "";
    const dateString = String(dbDateValue);
    return dateString.split("T")[0];
}

export function formatDbDate(dbDateValue, locale = "en-US") {
    const dateOnly = getDbDateOnly(dbDateValue);
    if (!dateOnly) return "";

    const [yearStr, monthStr, dayStr] = dateOnly.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        return dateOnly;
    }

    return new Date(year, month - 1, day).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDbTime(dbTimeValue) {
    if (!dbTimeValue) return "";

    const [hourStr, minute = "00"] = String(dbTimeValue).split(":");
    const hour = Number(hourStr);

    if (!Number.isInteger(hour)) {
        return String(dbTimeValue);
    }

    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minute} ${ampm}`;
}
