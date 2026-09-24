// Initializes database tables if they don't exist
import pool from "./db.js";

const createTableQueries = [
    {
        name: "Users",
        query: `
			CREATE TABLE IF NOT EXISTS Users (
				id INT AUTO_INCREMENT PRIMARY KEY,
				firstName VARCHAR(100),
				lastName VARCHAR(100),
				email VARCHAR(100) UNIQUE,
				username VARCHAR(100) UNIQUE,
				password VARCHAR(255),
				position VARCHAR(100),
				hours FLOAT,
				maxHoursPerWeek FLOAT,
				salary FLOAT,
				isActive BOOLEAN DEFAULT TRUE
			)
		`,
    },
    {
        name: "Sessions",
        query: `
			CREATE TABLE IF NOT EXISTS Sessions (
				id INT AUTO_INCREMENT PRIMARY KEY,
				userId INT,
				token VARCHAR(255),
				createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				expiresAt DATETIME NOT NULL,
				FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
			)
		`,
    },
    {
        name: "ShiftTypes",
        query: `
			CREATE TABLE IF NOT EXISTS ShiftTypes (
				id INT AUTO_INCREMENT PRIMARY KEY,
				name VARCHAR(100),
				startTime TIME,
				endTime TIME,
				UNIQUE KEY (name, startTime, endTime)
			)
		`,
    },
    {
        name: "WeeklyAvailability",
        query: `
			CREATE TABLE IF NOT EXISTS WeeklyAvailability (
				id INT AUTO_INCREMENT PRIMARY KEY,
				userId INT,
				dayOfWeek INT,
				startTime TIME,
				endTime TIME,
				reason VARCHAR(255),
				approved BOOLEAN DEFAULT FALSE,
				createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
			)
		`,
    },
    {
        name: "SpecificAvailability",
        query: `
			CREATE TABLE IF NOT EXISTS SpecificAvailability (
				id INT AUTO_INCREMENT PRIMARY KEY,
				userId INT,
				date DATE,
				startTime TIME,
				endTime TIME,
				reason VARCHAR(255),
				approved BOOLEAN DEFAULT FALSE,
				createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
				updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
			)
		`,
    },
    {
        name: "WeeklyShiftRequirements",
        query: `
			CREATE TABLE IF NOT EXISTS WeeklyShiftRequirements (
				id INT AUTO_INCREMENT PRIMARY KEY,
				dayOfWeek INT,
				shiftTypeId INT NOT NULL,
				requiredRoles INT NOT NULL,
				requiredStaff INT,
				isActive BOOLEAN DEFAULT TRUE,
				FOREIGN KEY (shiftTypeId) REFERENCES ShiftTypes(id) ON DELETE CASCADE,
				UNIQUE KEY (dayOfWeek, shiftTypeId)
			)
		`,
    },
    {
        name: "DateShiftRequirements",
        query: `
			CREATE TABLE IF NOT EXISTS DateShiftRequirements (
				id INT AUTO_INCREMENT PRIMARY KEY,
				date DATE,
				shiftTypeId INT NOT NULL,
				requiredRoles INT NOT NULL,
				requiredStaff INT,
				FOREIGN KEY (shiftTypeId) REFERENCES ShiftTypes(id) ON DELETE CASCADE,
				UNIQUE KEY (date, shiftTypeId)
			)
		`,
    },
    {
        name: "ScheduleSlots",
        query: `
			CREATE TABLE IF NOT EXISTS ScheduleSlots (
				id INT AUTO_INCREMENT PRIMARY KEY,
				shiftTypeId INT,
				userId INT,
				date DATE,
				FOREIGN KEY (shiftTypeId) REFERENCES ShiftTypes(id) ON DELETE CASCADE,
				FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
			)
		`,
    },
];

export async function initDB() {
    console.log("Initializing database...");

    try {
        for (const table of createTableQueries) {
            await pool.query(table.query);
            console.log(`${table.name} table ready.`);
        }

        console.log("Database initialization complete.");
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
}
