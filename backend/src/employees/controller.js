// All functions for managing employees (CRUD)
import bcrypt from "bcrypt";
import { createEmployeeSchema } from "./schema.js";
import {
    getAllEmployees,
    deleteEmployeeById,
    updateEmployeeById,
} from "./repository.js";
import { getUserByEmail, createUser } from "../auth/repository.js";

export async function getEmployees(req, res) {
    try {
        const employees = await getAllEmployees();
        return res.status(200).json(employees);
    } catch (e) {
        console.error("Error in getEmployees:", e);
        return res.status(500).json({ error: "Failed to get employees" });
    }
}

export async function createEmployee(req, res) {
    try {
        const parsedData = createEmployeeSchema.safeParse(req.body);

        if (!parsedData.success) {
            return res.status(400).json({ error: "Invalid employee data" });
        }

        const { firstName, lastName, email, position, salary } =
            parsedData.data;
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "Employee already exists with this email" });
        }

        // Generate a username and password for the new employee's login credentials
        const username = (firstName + lastName).toLowerCase();
        const password = firstName + "1234";
        const passwordHash = await bcrypt.hash(password, 10);

        await createUser({
            firstName,
            lastName,
            email,
            passwordHash,
            position,
            salary,
            username,
        });

        return res
            .status(201)
            .json({ message: "Employee created successfully" });
    } catch (e) {
        console.error("Error in createEmployee:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function deleteEmployee(req, res) {
    try {
        const { id } = req.params;
        await deleteEmployeeById(id);
        return res
            .status(200)
            .json({ message: "Employee deleted successfully" });
    } catch (e) {
        console.error("Error in deleteEmployee:", e);
        return res.status(500).json({ error: "Failed to delete employee" });
    }
}

export async function updateEmployee(req, res) {
    try {
        const { id } = req.params;
        const {
            firstName,
            lastName,
            email,
            position,
            salary,
            maxHoursPerWeek,
        } = req.body;
        await updateEmployeeById(id, {
            firstName,
            lastName,
            email,
            position,
            salary,
            maxHoursPerWeek,
        });
        return res
            .status(200)
            .json({ message: "Employee updated successfully" });
    } catch (e) {
        console.error("Error in updateEmployee:", e);
        return res.status(500).json({ error: "Failed to update employee" });
    }
}
