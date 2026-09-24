// Utility functions for schedule generation algorithm

export const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

export function timesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
}

export function calculateHours(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return (end - start) / (1000 * 60 * 60);
}

export function formatTime12Hour(timeString) {
    const [hourStr, minute] = timeString.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
}

export function toDateString(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

export function getDayOfWeek(date) {
    return new Date(date + "T00:00:00").getDay();
}

export function isWeekendDay(dayOfWeek) {
    return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
}

export function getDatesInRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    while (current <= end) {
        dates.push(toDateString(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
