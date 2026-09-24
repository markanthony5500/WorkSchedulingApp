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

// Returns specific dates employees are unavailable; optionally filtered by date range
export async function getSpecificUnavailableDates(startDate, endDate) {
    if (startDate && endDate) {
        const [rows] = await pool.query(
            `SELECT sa.userId, u.firstName, sa.date, sa.startTime, sa.endTime, sa.reason
       FROM SpecificAvailability sa
       JOIN Users u ON u.id = sa.userId
       WHERE sa.date BETWEEN ? AND ?`,
            [startDate, endDate],
        );

        return rows;
    } else {
        const [rows] = await pool.query(
            `SELECT sa.userId, u.firstName, sa.date, sa.startTime, sa.endTime, sa.reason
       FROM SpecificAvailability sa
       JOIN Users u ON u.id = sa.userId`,
        );

        return rows;
    }
}

// Returns all weekly unavailability entries for all employees
export async function getAllWeeklyUnavailableDates() {
    const [rows] = await pool.query(
        `SELECT wa.userId, u.firstName, wa.dayOfWeek, wa.startTime, wa.endTime, wa.reason
     FROM WeeklyAvailability wa
     JOIN Users u ON u.id = wa.userId`,
    );

    return rows;
}

export async function createShiftType(name, startTime, endTime) {
    const [result] = await pool.query(
        `INSERT INTO ShiftTypes (name, startTime, endTime)
     VALUES (?, ?, ?)`,
        [name, startTime, endTime],
    );

    return result;
}

export async function deleteShiftType(id) {
    const [result] = await pool.query(`DELETE FROM ShiftTypes WHERE id = ?`, [
        id,
    ]);

    return result;
}

export async function deleteWeeklyShiftRequirement(id) {
    const [result] = await pool.query(
        `DELETE FROM WeeklyShiftRequirements WHERE id = ?`,
        [id],
    );
    return result;
}

export async function deleteDateShiftRequirement(id) {
    const [result] = await pool.query(
        `DELETE FROM DateShiftRequirements WHERE id = ?`,
        [id],
    );
    return result;
}

export async function createWeeklyShiftRequirement(
    dayOfWeek,
    shiftTypeId,
    requiredStaff,
) {
    const [result] = await pool.query(
        `INSERT INTO WeeklyShiftRequirements (dayOfWeek, shiftTypeId, requiredRoles, requiredStaff)
     VALUES (?, ?, 0, ?)`,
        [dayOfWeek, shiftTypeId, requiredStaff],
    );

    return result;
}

export async function createDateShiftRequirement(
    date,
    shiftTypeId,
    requiredStaff,
) {
    const [result] = await pool.query(
        `INSERT INTO DateShiftRequirements (date, shiftTypeId, requiredRoles, requiredStaff)
     VALUES (?, ?, 0, ?)`,
        [date, shiftTypeId, requiredStaff],
    );

    return result;
}

export async function getAllShiftTypes() {
    const [rows] = await pool.query(
        `SELECT *
     FROM ShiftTypes`,
    );

    return rows;
}

export async function getAllWeeklyShiftRequirements() {
    const [rows] = await pool.query(
        `SELECT *
     FROM WeeklyShiftRequirements`,
    );

    return rows;
}

export async function getAllSpecificShiftRequirements() {
    const [rows] = await pool.query(
        `SELECT *
     FROM DateShiftRequirements`,
    );

    return rows;
}

export async function getShiftTypeById(id) {
    const [rows] = await pool.query(`SELECT * FROM ShiftTypes WHERE id = ?`, [
        id,
    ]);
    return rows[0] || null;
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
