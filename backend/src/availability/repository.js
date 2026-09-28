import pool from "../db/db.js";

export async function createRequestOff(
    userId,
    date,
    startTime,
    endTime,
    reason,
) {
    const [result] = await pool.query(
        `INSERT INTO SpecificAvailability (userId, date, startTime, endTime, reason)
     VALUES (?, ?, ?, ?, ?)`,
        [userId, date, startTime, endTime, reason],
    );

    return result;
}

export async function getWeeklyAvailabilityByUserAndDay(userId, dayOfWeek) {
    const [rows] = await pool.query(
        `SELECT *
     FROM WeeklyAvailability
     WHERE userId = ? AND dayOfWeek = ?`,
        [userId, dayOfWeek],
    );

    return rows;
}

export async function updateWeeklyAvailability(
    userId,
    dayOfWeek,
    startTime,
    endTime,
    reason,
) {
    const [result] = await pool.query(
        `UPDATE WeeklyAvailability
     SET startTime = ?, endTime = ?, reason = ?
     WHERE userId = ? AND dayOfWeek = ?`,
        [startTime, endTime, reason, userId, dayOfWeek],
    );

    return result;
}

export async function createWeeklyAvailability(
    userId,
    dayOfWeek,
    startTime,
    endTime,
    reason,
) {
    const [result] = await pool.query(
        `INSERT INTO WeeklyAvailability (userId, dayOfWeek, startTime, endTime, reason)
     VALUES (?, ?, ?, ?, ?)`,
        [userId, dayOfWeek, startTime, endTime, reason],
    );

    return result;
}

// Returns specific dates an employee is unavailbe
export async function getSpecificUnavailableDates(userId) {
    const [rows] = await pool.query(
        `SELECT userId, date, startTime, endTime, reason
         FROM SpecificAvailability
         WHERE userId = ?`,
        [userId],
    );

    return rows;
}

// Returns all weekly unavailability for employee
export async function getWeeklyUnavailableDates(userId) {
    const [rows] = await pool.query(
        `SELECT userId, dayOfWeek, startTime, endTime, reason
         FROM WeeklyAvailability
         WHERE userId = ?`,
        [userId],
    );

    return rows;
}

// Returns all employees with their weekly unavailability and requested-off dates
export async function getAllEmployeesWithAvailability() {
    const [users] = await pool.query(
        `SELECT id, firstName, lastName FROM Users WHERE isActive = 1 ORDER BY firstName, lastName`,
    );

    const [weeklyRows] = await pool.query(
        `SELECT wa.userId, wa.dayOfWeek, wa.startTime, wa.endTime, wa.reason
     FROM WeeklyAvailability wa
     ORDER BY wa.userId, wa.dayOfWeek`,
    );

    const [specificRows] = await pool.query(
        `SELECT sa.userId, sa.date, sa.startTime, sa.endTime, sa.reason
     FROM SpecificAvailability sa
     ORDER BY sa.userId, sa.date`,
    );

    const weeklyByUser = {};
    weeklyRows.forEach((row) => {
        if (!weeklyByUser[row.userId]) weeklyByUser[row.userId] = [];
        weeklyByUser[row.userId].push(row);
    });

    const specificByUser = {};
    specificRows.forEach((row) => {
        if (!specificByUser[row.userId]) specificByUser[row.userId] = [];
        specificByUser[row.userId].push(row);
    });

    return users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        weeklyUnavailability: weeklyByUser[user.id] || [],
        requestedOffDates: specificByUser[user.id] || [],
    }));
}
