// All functions for managing shift types and staffing requirements
import {
    createShiftType,
    deleteShiftType,
    createWeeklyShiftRequirement,
    deleteWeeklyShiftRequirement,
    createDateShiftRequirement,
    deleteDateShiftRequirement,
    getAllShiftTypes,
    getAllWeeklyShiftRequirements,
    getAllSpecificShiftRequirements,
} from "./repository.js";

export async function removeShiftType(req, res) {
    try {
        const { id } = req.params;
        await deleteShiftType(id);

        return res
            .status(200)
            .json({ message: "Shift type deleted successfully" });
    } catch (e) {
        console.error("Error in removeShiftType:", e);
        return res.status(500).json({ error: "Failed to delete shift type" });
    }
}

export async function addShiftType(req, res) {
    try {
        const { name, startTime, endTime } = req.body;
        await createShiftType(name, startTime, endTime);

        return res
            .status(200)
            .json({ message: "Shift type added successfully" });
    } catch (e) {
        console.error("Error in addShiftType:", e);
        return res.status(500).json({ error: "Failed to add shift type" });
    }
}

export async function removeWeeklyShiftRequirement(req, res) {
    try {
        const { id } = req.params;
        await deleteWeeklyShiftRequirement(id);
        return res
            .status(200)
            .json({ message: "Weekly shift requirement deleted successfully" });
    } catch (e) {
        console.error("Error in removeWeeklyShiftRequirement:", e);
        return res
            .status(500)
            .json({ error: "Failed to delete weekly shift requirement" });
    }
}

export async function removeDateShiftRequirement(req, res) {
    try {
        const { id } = req.params;
        await deleteDateShiftRequirement(id);
        return res
            .status(200)
            .json({ message: "Date shift requirement deleted successfully" });
    } catch (e) {
        console.error("Error in removeDateShiftRequirement:", e);
        return res
            .status(500)
            .json({ error: "Failed to delete date shift requirement" });
    }
}

export async function addWeeklyShiftRequirement(req, res) {
    try {
        const { shiftTypeId, dayOfWeek, requiredStaff } = req.body;
        await createWeeklyShiftRequirement(
            dayOfWeek,
            shiftTypeId,
            requiredStaff,
        );

        return res
            .status(200)
            .json({ message: "Weekly shift requirement added successfully" });
    } catch (e) {
        console.error("Error in addWeeklyShiftRequirement:", e);
        return res
            .status(500)
            .json({ error: "Failed to add weekly shift requirement" });
    }
}

export async function addDateShiftRequirement(req, res) {
    try {
        const { shiftTypeId, date, requiredStaff } = req.body;
        await createDateShiftRequirement(date, shiftTypeId, requiredStaff);

        return res
            .status(200)
            .json({ message: "Date shift requirement added successfully" });
    } catch (e) {
        console.error("Error in addDateShiftRequirement:", e);
        return res
            .status(500)
            .json({ error: "Failed to add date shift requirement" });
    }
}

export async function getShiftTypes(req, res) {
    try {
        const shiftTypes = await getAllShiftTypes();

        return res.status(200).json(shiftTypes);
    } catch (e) {
        console.error("Error in /getShiftTypes endpoint:", e);
        return res.status(500).json({ error: "Failed to get shift types" });
    }
}

export async function getWeeklyShiftRequirements(req, res) {
    try {
        const weeklyShiftRequirements = await getAllWeeklyShiftRequirements();

        return res.status(200).json(weeklyShiftRequirements);
    } catch (e) {
        console.error("Error in /getWeeklyShiftRequirements endpoint:", e);
        return res
            .status(500)
            .json({ error: "Failed to get weekly shift requirements" });
    }
}

export async function getSpecificShiftRequirements(req, res) {
    try {
        const specificShiftRequirements =
            await getAllSpecificShiftRequirements();

        return res.status(200).json(specificShiftRequirements);
    } catch (e) {
        console.error("Error in /getSpecificShiftRequirements endpoint:", e);
        return res
            .status(500)
            .json({ error: "Failed to get specific shift requirements" });
    }
}
