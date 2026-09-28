import pool from "./db.js";
import bcrypt from "bcrypt";

const DEFAULT_PASSWORD = "password123";
const FULL_DAY_START = "00:00:00";
const FULL_DAY_END = "23:59:59";

const mockUsers = [
    {
        firstName: "Manager",
        lastName: "",
        username: "manager",
        position: "Manager",
        maxHoursPerWeek: 40,
    },
    {
        firstName: "Jordan",
        lastName: "",
        username: "jordan",
        position: "Shift Leader",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Taylor",
        lastName: "",
        username: "taylor",
        position: "Shift Leader",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Morgan",
        lastName: "",
        username: "morgan",
        position: "Shift Leader",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Casey",
        lastName: "",
        username: "casey",
        position: "Shift Leader",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Riley",
        lastName: "",
        username: "riley",
        position: "Shift Leader",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Jamie",
        lastName: "",
        username: "jamie",
        position: "Shift Leader",
        maxHoursPerWeek: 15,
    },

    {
        firstName: "Avery",
        lastName: "",
        username: "avery",
        position: "Employee",
        maxHoursPerWeek: 5,
    },
    {
        firstName: "Quinn",
        lastName: "",
        username: "quinn",
        position: "Employee",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Drew",
        lastName: "",
        username: "drew",
        position: "Employee",
        maxHoursPerWeek: 15,
    },
    {
        firstName: "Sam",
        lastName: "",
        username: "sam",
        position: "Employee",
        maxHoursPerWeek: 15,
    },
];

const shiftTypes = [
    { name: "Open", startTime: "12:00:00", endTime: "17:00:00" },
    { name: "Close", startTime: "17:00:00", endTime: "22:00:00" },
];

const CLOSE_WINDOW = { startTime: "17:00:00", endTime: "22:00:00" };

// startTime/endTime are optional, defaults to full day if omitted
const weeklyUnavailable = [
    // Jordan can not close Mondays
    { username: "jordan", dayOfWeek: 1, ...CLOSE_WINDOW },

    // Casey can not work Wednesdays
    { username: "casey", dayOfWeek: 3 },

    // Avery can not work Sundays
    { username: "avery", dayOfWeek: 0 },
];

const specificUnavailable = [
    { username: "alex", date: "2026-09-25" },
    { username: "riley", date: "2026-09-27" },
    { username: "sam", date: "2026-09-30" },
    { username: "drew", date: "2026-10-02" },
    { username: "taylor", date: "2026-10-03" },
];

export async function addMockData() {
    console.log("Adding mock data...");

    try {
        await pool.query("START TRANSACTION");

        await clearExistingMockData();

        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        await insertMockUsers(hashedPassword);
        const userIdMap = await getUserIdMap();

        await insertShiftTypes();
        const shiftTypeIdMap = await getShiftTypeIdMap();

        await insertWeeklyShiftRequirements(shiftTypeIdMap);
        await insertWeeklyAvailability(userIdMap);
        await insertSpecificAvailability(userIdMap);

        await pool.query("COMMIT");
        console.log("Mock data seeded successfully.");
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error adding mock data:", error);
        throw error;
    }
}

export async function clearExistingMockData() {
    await pool.query("DELETE FROM WeeklyAvailability");
    await pool.query("DELETE FROM SpecificAvailability");
    await pool.query("DELETE FROM WeeklyShiftRequirements");
    await pool.query("DELETE FROM ShiftTypes");
    await pool.query("DELETE FROM Users");
    await pool.query("DELETE FROM ScheduleSlots");
}

async function insertMockUsers(hashedPassword) {
    const userValues = mockUsers.map((user) => [
        user.firstName,
        user.lastName,
        `${user.username}@mock.com`,
        user.username,
        hashedPassword,
        user.position,
        0,
        user.maxHoursPerWeek,
        0,
    ]);

    if (userValues.length === 0) return;

    await pool.query(
        `
		INSERT INTO Users
			(firstName, lastName, email, username, password, position, hours, maxHoursPerWeek, salary)
		VALUES ?
		`,
        [userValues],
    );
}

export async function getUserIdMap() {
    const [rows] = await pool.query("SELECT id, username FROM Users");
    return Object.fromEntries(rows.map((row) => [row.username, row.id]));
}

async function insertShiftTypes() {
    const shiftTypeValues = shiftTypes.map((shiftType) => [
        shiftType.name,
        shiftType.startTime,
        shiftType.endTime,
    ]);

    await pool.query(
        `
		INSERT INTO ShiftTypes (name, startTime, endTime)
		VALUES ?
		`,
        [shiftTypeValues],
    );
}

async function getShiftTypeIdMap() {
    const [rows] = await pool.query("SELECT id, name FROM ShiftTypes");
    return Object.fromEntries(rows.map((row) => [row.name, row.id]));
}

async function insertWeeklyShiftRequirements(shiftTypeIdMap) {
    const weeklyShiftRequirements = [];

    for (let day = 0; day <= 6; day++) {
        const isWeekend = day === 0 || day === 5 || day === 6; // Fri, Sat, Sun

        weeklyShiftRequirements.push([
            day,
            shiftTypeIdMap.Open,
            0,
            isWeekend ? 2 : 1,
            true,
        ]);
        weeklyShiftRequirements.push([
            day,
            shiftTypeIdMap.Close,
            0,
            isWeekend ? 3 : 2,
            true,
        ]);
    }

    await pool.query(
        `
		INSERT INTO WeeklyShiftRequirements
			(dayOfWeek, shiftTypeId, requiredRoles, requiredStaff, isActive)
		VALUES ?
		`,
        [weeklyShiftRequirements],
    );
}

export async function insertWeeklyAvailability(userIdMap) {
    const weeklyValues = weeklyUnavailable.map((entry) => [
        userIdMap[entry.username],
        entry.dayOfWeek,
        entry.startTime || FULL_DAY_START,
        entry.endTime || FULL_DAY_END,
        "Template Unavailable",
        true,
    ]);

    if (weeklyValues.length === 0) return;

    await pool.query(
        `
		INSERT INTO WeeklyAvailability
			(userId, dayOfWeek, startTime, endTime, reason, approved)
		VALUES ?
		`,
        [weeklyValues],
    );
}

export async function insertSpecificAvailability(userIdMap) {
    const specificValues = specificUnavailable.map((entry) => [
        userIdMap[entry.username],
        entry.date,
        entry.startTime || FULL_DAY_START,
        entry.endTime || FULL_DAY_END,
        "Requested Off",
        true,
    ]);

    if (specificValues.length === 0) return;

    await pool.query(
        `
		INSERT INTO SpecificAvailability
			(userId, date, startTime, endTime, reason, approved)
		VALUES ?
		`,
        [specificValues],
    );
}
