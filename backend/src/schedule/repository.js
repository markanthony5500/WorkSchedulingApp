import pool from "../db/db.js";

export async function getEmployees() {
    const [rows] = await pool.query(
        `SELECT id, firstName, lastName, position, maxHoursPerWeek
     FROM Users
     WHERE isActive = 1`,
    );

    return rows;
}

export async function getShiftTypes() {
    const [rows] = await pool.query(
        `SELECT id, name, startTime, endTime
     FROM ShiftTypes`,
    );

    return rows;
}

export async function getWeeklyRequirements() {
    const [rows] = await pool.query(
        `SELECT dayOfWeek, shiftTypeId, requiredRoles, requiredStaff
     FROM WeeklyShiftRequirements`,
    );

    return rows;
}

export async function getDateRequirements() {
    const [rows] = await pool.query(
        `SELECT date, shiftTypeId, requiredRoles, requiredStaff
     FROM DateShiftRequirements`,
    );

    return rows;
}

export async function getSpecificAvailability() {
    const [rows] = await pool.query(
        `SELECT userId, date, startTime, endTime
     FROM SpecificAvailability`,
    );

    return rows;
}

export async function getWeeklyAvailability() {
    const [rows] = await pool.query(
        `SELECT userId, dayOfWeek, startTime, endTime
     FROM WeeklyAvailability`,
    );

    return rows;
}

export async function getScheduleData() {
    const [
        employees,
        shiftTypes,
        weeklyRequirements,
        dateRequirements,
        specificAvailability,
        weeklyAvailability,
    ] = await Promise.all([
        getEmployees(),
        getShiftTypes(),
        getWeeklyRequirements(),
        getDateRequirements(),
        getSpecificAvailability(),
        getWeeklyAvailability(),
    ]);

    return {
        employees,
        shiftTypes,
        shiftRequirements: {
            weeklyRequirements,
            dateRequirements,
        },
        availability: {
            specificDates: specificAvailability,
            weeklyAvailability,
        },
    };
}

export async function addScheduleData(scheduleSlots) {
    const values = scheduleSlots.map((slot) => [
        slot.shiftTypeId,
        slot.userId,
        slot.date,
    ]);

    await pool.query(
        `INSERT INTO ScheduleSlots (shiftTypeId, userId, date)
     VALUES ?`,
        [values],
    );
}

export async function getScheduleSlots(startDate) {
    let query = `
		SELECT ss.id, ss.date, ss.shiftTypeId, u.firstName, u.lastName, st.name AS shiftTypeName, st.startTime, st.endTime
		FROM ScheduleSlots ss
		JOIN Users u ON ss.userId = u.id
		JOIN ShiftTypes st ON ss.shiftTypeId = st.id
	`;

    if (startDate) {
        query += ` WHERE ss.date >= ?`;
    }

    const [rows] = await pool.query(query, startDate ? [startDate] : []);
    return rows;
}
