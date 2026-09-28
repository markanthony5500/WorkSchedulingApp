import pool from "../db/db.js";

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
