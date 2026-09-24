// DB quries used for Auth
import pool from "../db/db.js";

export async function getUserByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM Users WHERE email = ?", [
        email,
    ]);
    return rows[0] || null;
}

export async function getUserByUsername(username) {
    const [rows] = await pool.query("SELECT * FROM Users WHERE username = ?", [
        username,
    ]);
    return rows[0] || null;
}

export async function createUser({
    firstName,
    lastName,
    email,
    passwordHash,
    position,
    salary,
    username,
}) {
    await pool.query(
        `INSERT INTO Users (firstName, lastName, email, password, position, salary, username)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
        [firstName, lastName, email, passwordHash, position, salary, username],
    );
}

export async function createSession(userId, token, expiresAt) {
    await pool.query(
        `INSERT INTO Sessions (userId, token, expiresAt) VALUES (?, ?, ?)`,
        [userId, token, expiresAt],
    );
}

export async function deleteSessionByToken(token) {
    await pool.query(`DELETE FROM Sessions WHERE token = ?`, [token]);
}
