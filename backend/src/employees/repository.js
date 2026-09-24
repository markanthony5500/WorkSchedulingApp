import pool from "../db/db.js";

export async function getAllEmployees() {
    const [rows] = await pool.query(
        `SELECT id, firstName, lastName, email, position, salary, maxHoursPerWeek FROM Users WHERE isActive = 1 ORDER BY firstName, lastName`,
    );
    return rows;
}

export async function deleteEmployeeById(id) {
    const [result] = await pool.query(
        `UPDATE Users SET isActive = 0 WHERE id = ?`,
        [id],
    );
    return result;
}

export async function updateEmployeeById(
    id,
    { firstName, lastName, email, position, salary, maxHoursPerWeek },
) {
    const [result] = await pool.query(
        `UPDATE Users
     SET firstName = ?, lastName = ?, email = ?, position = ?, salary = ?, maxHoursPerWeek = ?
     WHERE id = ?`,
        [firstName, lastName, email, position, salary, maxHoursPerWeek, id],
    );
    return result;
}
