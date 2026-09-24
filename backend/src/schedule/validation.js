// Validates hand-edited schedules using the same rules as the generator

import { calculateHours, getDayOfWeek } from "./scheduleHelpers.js";
import {
    normalizeScheduleData,
    isShiftLeader,
    shiftGroupKey,
    isAlreadyAssignedOnDay,
    isAvailableForSlot,
    buildSlotsForRange,
} from "./scheduleGeneration.js";

// Adds shift details to raw assignments so the generator's rule checks can use them
function enrichSlots(assignedSlots, lookups) {
    return assignedSlots.map((a, i) => {
        const shiftType = lookups.shiftTypeMap.get(a.shiftTypeId);
        return {
            id: a.id ?? i,
            date: a.date,
            dayOfWeek: getDayOfWeek(a.date),
            shiftTypeId: a.shiftTypeId,
            shiftName: shiftType ? shiftType.name : null,
            startTime: shiftType ? shiftType.startTime : null,
            endTime: shiftType ? shiftType.endTime : null,
            userId: a.userId,
        };
    });
}

// Returns every rule violation in the schedule. Coverage is only checked if a date range is given
export function validateAssignedSlots(
    scheduleData,
    assignedSlots,
    startDate,
    endDate,
) {
    const lookups = normalizeScheduleData(scheduleData);
    const violations = [];

    const slots = enrichSlots(assignedSlots, lookups);

    const state = { assignments: new Map(slots.map((s) => [s.id, s.userId])) };
    const hoursByEmployee = new Map();

    for (const slot of slots) {
        const employee = lookups.employeeMap.get(slot.userId);

        if (!employee) {
            violations.push({
                type: "unknown_employee",
                message: `No active employee found for the ${slot.shiftName ?? "shift"} on ${slot.date}.`,
                date: slot.date,
                shiftTypeId: slot.shiftTypeId,
                userId: slot.userId,
            });
            continue;
        }

        if (!slot.shiftName) {
            violations.push({
                type: "unknown_shift_type",
                message: `Unknown shift type on ${slot.date}.`,
                date: slot.date,
                shiftTypeId: slot.shiftTypeId,
                userId: slot.userId,
            });
            continue;
        }

        if (isAlreadyAssignedOnDay(employee, slot, slots, state)) {
            violations.push({
                type: "double_booked",
                message: `${employee.firstName} ${employee.lastName} is assigned to more than one shift on ${slot.date}.`,
                date: slot.date,
                shiftTypeId: slot.shiftTypeId,
                userId: slot.userId,
            });
        }

        if (!isAvailableForSlot(employee, slot, lookups)) {
            violations.push({
                type: "unavailable",
                message: `${employee.firstName} ${employee.lastName} is not available for the ${slot.shiftName} shift on ${slot.date}.`,
                date: slot.date,
                shiftTypeId: slot.shiftTypeId,
                userId: slot.userId,
            });
        }

        hoursByEmployee.set(
            employee.id,
            (hoursByEmployee.get(employee.id) || 0) +
                calculateHours(slot.startTime, slot.endTime),
        );
    }

    for (const [employeeId, hours] of hoursByEmployee) {
        const employee = lookups.employeeMap.get(employeeId);
        if (employee && hours > employee.maxHoursPerWeek) {
            violations.push({
                type: "over_max_hours",
                message: `${employee.firstName} ${employee.lastName} is scheduled for ${hours} hours, over their ${employee.maxHoursPerWeek}-hour limit.`,
                date: null,
                shiftTypeId: null,
                userId: employeeId,
            });
        }
    }

    const groupKeys = new Set(slots.map((s) => shiftGroupKey(s)));
    for (const groupKey of groupKeys) {
        const groupSlots = slots.filter((s) => shiftGroupKey(s) === groupKey);
        if (groupSlots[0].shiftName === "MidShift") continue;

        const hasLeader = groupSlots.some((s) => {
            const employee = lookups.employeeMap.get(s.userId);
            return employee && isShiftLeader(employee);
        });

        if (!hasLeader) {
            violations.push({
                type: "missing_shift_leader",
                message: `The ${groupSlots[0].shiftName} shift on ${groupSlots[0].date} has no Shift Leader or Manager assigned.`,
                date: groupSlots[0].date,
                shiftTypeId: groupSlots[0].shiftTypeId,
                userId: null,
            });
        }
    }

    // Coverage: each shift must have exactly the required number of staff
    if (startDate && endDate) {
        const requiredSlots = buildSlotsForRange(startDate, endDate, lookups);

        const requiredByGroup = new Map();
        for (const rs of requiredSlots) {
            const key = shiftGroupKey(rs);
            if (!requiredByGroup.has(key)) {
                requiredByGroup.set(key, {
                    count: 0,
                    date: rs.date,
                    shiftTypeId: rs.shiftTypeId,
                    shiftName: rs.shiftName,
                });
            }
            requiredByGroup.get(key).count++;
        }

        const assignedByGroup = new Map();
        for (const slot of slots) {
            if (!slot.userId) continue;
            const key = shiftGroupKey(slot);
            if (!assignedByGroup.has(key)) {
                assignedByGroup.set(key, {
                    count: 0,
                    date: slot.date,
                    shiftTypeId: slot.shiftTypeId,
                    shiftName: slot.shiftName,
                });
            }
            assignedByGroup.get(key).count++;
        }

        const allGroupKeys = new Set([
            ...requiredByGroup.keys(),
            ...assignedByGroup.keys(),
        ]);
        for (const key of allGroupKeys) {
            const required = requiredByGroup.get(key);
            const assigned = assignedByGroup.get(key);
            const requiredCount = required ? required.count : 0;
            const actualCount = assigned ? assigned.count : 0;
            if (actualCount === requiredCount) continue;

            const info = required || assigned;
            violations.push({
                type:
                    actualCount < requiredCount
                        ? "understaffed"
                        : "overstaffed",
                message:
                    actualCount < requiredCount
                        ? `The ${info.shiftName} shift on ${info.date} needs ${requiredCount} staff but only has ${actualCount} assigned.`
                        : `The ${info.shiftName} shift on ${info.date} needs ${requiredCount} staff but has ${actualCount} assigned.`,
                date: info.date,
                shiftTypeId: info.shiftTypeId,
                userId: null,
            });
        }
    }

    return { valid: violations.length === 0, violations };
}

// Employees who could take the given slot
export function getEligibleEmployees(scheduleData, assignedSlots, slotId) {
    const lookups = normalizeScheduleData(scheduleData);
    const slots = enrichSlots(assignedSlots, lookups);

    const targetSlot = slots.find((s) => s.id === slotId);
    if (!targetSlot) return [];

    const otherSlots = slots.filter((s) => s.id !== slotId);
    const state = {
        assignments: new Map(otherSlots.map((s) => [s.id, s.userId])),
    };

    const hoursByEmployee = new Map();
    for (const slot of otherSlots) {
        if (!slot.userId) continue;
        hoursByEmployee.set(
            slot.userId,
            (hoursByEmployee.get(slot.userId) || 0) +
                calculateHours(slot.startTime, slot.endTime),
        );
    }

    const duration = calculateHours(targetSlot.startTime, targetSlot.endTime);
    const eligible = [];

    for (const employee of lookups.employeeMap.values()) {
        if (isAlreadyAssignedOnDay(employee, targetSlot, otherSlots, state))
            continue;
        if (!isAvailableForSlot(employee, targetSlot, lookups)) continue;
        if (
            (hoursByEmployee.get(employee.id) || 0) + duration >
            employee.maxHoursPerWeek
        )
            continue;
        eligible.push(employee);
    }

    return eligible;
}

// Shift types the given employee could be added to on the given date
export function getEligibleShiftTypes(
    scheduleData,
    assignedSlots,
    date,
    userId,
) {
    const lookups = normalizeScheduleData(scheduleData);
    const employee = lookups.employeeMap.get(userId);
    if (!employee) return [];

    const slots = enrichSlots(assignedSlots, lookups);
    const state = { assignments: new Map(slots.map((s) => [s.id, s.userId])) };

    let hoursWorked = 0;
    for (const slot of slots) {
        if (slot.userId === userId)
            hoursWorked += calculateHours(slot.startTime, slot.endTime);
    }

    const dayOfWeek = getDayOfWeek(date);
    const eligible = [];

    for (const shiftType of lookups.shiftTypeMap.values()) {
        const candidate = {
            id: "candidate",
            date,
            dayOfWeek,
            shiftTypeId: shiftType.id,
            shiftName: shiftType.name,
            startTime: shiftType.startTime,
            endTime: shiftType.endTime,
        };

        if (isAlreadyAssignedOnDay(employee, candidate, slots, state)) continue;
        if (!isAvailableForSlot(employee, candidate, lookups)) continue;
        if (
            hoursWorked +
                calculateHours(shiftType.startTime, shiftType.endTime) >
            employee.maxHoursPerWeek
        )
            continue;

        eligible.push(shiftType);
    }

    return eligible;
}
