// All funcitons for altering shifts (availability / shift types )
import {
    createRequestOff,
    getWeeklyAvailabilityByUserAndDay,
    updateWeeklyAvailability,
    createWeeklyAvailability,
    getSpecificUnavailableDates,
    getAllWeeklyUnavailableDates,
    createShiftType,
    deleteShiftType,
    createWeeklyShiftRequirement,
    deleteWeeklyShiftRequirement,
    createDateShiftRequirement,
    deleteDateShiftRequirement,
    getAllShiftTypes,
    getAllWeeklyShiftRequirements,
    getAllSpecificShiftRequirements,
    getAllEmployeesWithAvailability,
    getShiftTypeById,
} from "./repository.js";

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
        const { startDate, endDate } = req.query;
        const specificDates = await getSpecificUnavailableDates(
            startDate,
            endDate,
        );
        const weeklyAvailability = await getAllWeeklyUnavailableDates();

        return res.status(200).json({ specificDates, weeklyAvailability });
    } catch (e) {
        console.error("Error in getUnavailableDates:", e);
        return res
            .status(500)
            .json({ error: "Failed to get unavailable dates" });
    }
}

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
