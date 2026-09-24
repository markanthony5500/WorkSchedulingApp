import {
    getScheduleData,
    addScheduleData,
    getScheduleSlots,
} from "./repository.js";
import { generateScheduleFromData } from "./scheduleGeneration.js";
import {
    validateAssignedSlots,
    getEligibleEmployees,
    getEligibleShiftTypes,
} from "./validation.js";
import { formatTime12Hour } from "./scheduleHelpers.js";

// Schedule algorithm entry point. Only computes a schedule, without saving so it can be edited
export async function generateSchedule(req, res) {
    const { startDate, endDate, presetSlots } = req.body;

    try {
        const scheduleData = await getScheduleData();
        const result = generateScheduleFromData(
            scheduleData,
            startDate,
            endDate,
            presetSlots || [],
        );

        if (!result.schedule) {
            return res.status(400).json({
                error: result.reason || "Failed to generate a valid schedule",
            });
        }

        return res.status(200).json({
            message: "Schedule generated successfully",
            schedule: result.schedule,
        });
    } catch (error) {
        console.error("Error in generateSchedule controller:", error);
        return res.status(500).json({
            error: "Failed to generate schedule",
        });
    }
}

// Re validates the scheudle in the case of hand edidted slot assignmetns
export async function validateSchedule(req, res) {
    const { slots, startDate, endDate } = req.body;

    try {
        const scheduleData = await getScheduleData();
        const result = validateAssignedSlots(
            scheduleData,
            slots || [],
            startDate,
            endDate,
        );
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error in validateSchedule controller:", error);
        return res.status(500).json({
            error: "Failed to validate schedule",
        });
    }
}

// Which active employees can work a schedule slot
export async function eligibleEmployees(req, res) {
    const { slots, slotId } = req.body;

    try {
        const scheduleData = await getScheduleData();
        const employees = getEligibleEmployees(
            scheduleData,
            slots || [],
            slotId,
        );
        return res.status(200).json({ employees });
    } catch (error) {
        console.error("Error in eligibleEmployees controller:", error);
        return res.status(500).json({
            error: "Failed to compute eligible employees",
        });
    }
}

// Which shift types an employee can work on a certain date
export async function eligibleShiftTypes(req, res) {
    const { slots, date, userId } = req.body;

    try {
        const scheduleData = await getScheduleData();
        const shiftTypes = getEligibleShiftTypes(
            scheduleData,
            slots || [],
            date,
            parseInt(userId),
        );
        return res.status(200).json({ shiftTypes });
    } catch (error) {
        console.error("Error in eligibleShiftTypes controller:", error);
        return res.status(500).json({
            error: "Failed to compute eligible shift types",
        });
    }
}

// Re-validates schedule and adds it in db
export async function finalizeSchedule(req, res) {
    const { slots, startDate, endDate } = req.body;

    try {
        const scheduleData = await getScheduleData();
        const result = validateAssignedSlots(
            scheduleData,
            slots || [],
            startDate,
            endDate,
        );

        if (!result.valid) {
            return res.status(400).json({
                error: "Schedule is not valid",
                violations: result.violations,
            });
        }

        await addScheduleData(slots);

        return res.status(200).json({
            message: "Schedule finalized successfully",
        });
    } catch (error) {
        console.error("Error in finalizeSchedule controller:", error);
        return res.status(500).json({
            error: "Failed to finalize schedule",
        });
    }
}

// Format and return schedule events for calendar output based on start date
export async function getScheduleEvents(req, res) {
    const { startDate } = req.query;

    try {
        const scheduleSlots = await getScheduleSlots(startDate);

        const events = scheduleSlots.map((slot) => ({
            start: slot.date,
            title: `${slot.firstName} ${slot.lastName}\n${formatTime12Hour(slot.startTime)}-${formatTime12Hour(slot.endTime)}`,
            shiftTypeId: slot.shiftTypeId,
            allDay: true,
        }));

        return res.status(200).json(events);
    } catch (error) {
        console.error("Error in getScheduleEvents controller:", error);
        return res.status(500).json({
            error: "Failed to fetch schedule events",
        });
    }
}
