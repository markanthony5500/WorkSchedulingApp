// All functions for viewing / changing employee availability and time off
import {
    createRequestOff,
    getWeeklyAvailabilityByUserAndDay,
    updateWeeklyAvailability,
    createWeeklyAvailability,
    getSpecificUnavailableDates,
    getWeeklyUnavailableDates,
    getAllEmployeesWithAvailability,
} from "./repository.js";
import { getShiftTypeById } from "../shifts/repository.js";

export async function requestOff(req, res) {
    try {
        const { date, startTime, endTime, reason } = req.body;
        await createRequestOff(req.user.id, date, startTime, endTime, reason);

        return res
            .status(200)
            .json({ message: "Request off submitted successfully" });
    } catch (e) {
        console.error("Error in requestOff:", e);
        return res.status(500).json({ error: "Failed to request off" });
    }
}

export async function setAvailability(req, res) {
    try {
        const { dayOfWeek, shift, reason, userId } = req.body;
        const targetUserId = userId ?? req.user.id;

        // Map shift type names to time ranges
        const shiftTimes = {
            open: { startTime: "09:00:00", endTime: "13:00:00" },
            close: { startTime: "17:00:00", endTime: "21:00:00" },
            all: { startTime: "00:00:00", endTime: "23:59:59" },
        };
        const { startTime, endTime } = shiftTimes[shift] ?? shiftTimes.all;

        const existingAvailability = await getWeeklyAvailabilityByUserAndDay(
            targetUserId,
            dayOfWeek,
        );

        if (existingAvailability.length > 0) {
            await updateWeeklyAvailability(
                targetUserId,
                dayOfWeek,
                startTime,
                endTime,
                reason,
            );
        } else {
            await createWeeklyAvailability(
                targetUserId,
                dayOfWeek,
                startTime,
                endTime,
                reason,
            );
        }

        return res
            .status(200)
            .json({ message: "Availability updated successfully" });
    } catch (e) {
        console.error("Error in setAvailability:", e);
        return res.status(500).json({ error: "Failed to set availability" });
    }
}

export async function getUnavailableDates(req, res) {
    try {
        const specificDates = await getSpecificUnavailableDates(req.user.id);
        const weeklyAvailability = await getWeeklyUnavailableDates(req.user.id);

        return res.status(200).json({ specificDates, weeklyAvailability });
    } catch (e) {
        console.error("Error in getUnavailableDates:", e);
        return res
            .status(500)
            .json({ error: "Failed to get unavailable dates" });
    }
}

export async function getEmployeeAvailabilitySummary(req, res) {
    try {
        const employees = await getAllEmployeesWithAvailability();
        return res.status(200).json(employees);
    } catch (e) {
        console.error("Error in /getEmployeeAvailabilitySummary endpoint:", e);
        return res
            .status(500)
            .json({ error: "Failed to get employee availability summary" });
    }
}

export async function adminRequestOff(req, res) {
    try {
        const { userId, date, shiftTypeId } = req.body;
        const shiftType = await getShiftTypeById(shiftTypeId);
        if (!shiftType)
            return res.status(404).json({ error: "Shift type not found" });
        await createRequestOff(
            userId,
            date,
            shiftType.startTime,
            shiftType.endTime,
            "Requested Off",
        );
        return res
            .status(200)
            .json({ message: "Request off submitted successfully" });
    } catch (e) {
        console.error("Error in adminRequestOff:", e);
        return res.status(500).json({ error: "Failed to submit request off" });
    }
}
