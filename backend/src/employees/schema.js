// Schema for creating a new employee
import { z } from "zod";

export const createEmployeeSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    position: z.string().min(1, "Position is required"),
    salary: z.coerce.number().min(1, "Salary is required"),
});
