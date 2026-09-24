// Scheduling algorithm

import {
    DAYS_OF_WEEK,
    timesOverlap,
    calculateHours,
    formatTime12Hour,
    toDateString,
    getDayOfWeek,
    getDatesInRange,
    isWeekendDay,
} from "./scheduleHelpers.js";

//-----------------
// Helper functions
//-----------------

function createInitialState() {
    return {
        assignments: new Map(), // slotId -> employeeId
        hoursWorked: new Map(), // employeeId -> total hours scheduled
        lastWorkedDate: new Map(), // employeeId -> Date (for spacing optimization)
        lockedSlotIds: new Set(), // slotId -> pinned by the user before generation, never reassigned/swapped
    };
}

export function isShiftLeader(employee) {
    return (
        employee.position === "Shift Leader" || employee.position === "Manager"
    );
}

export function shiftGroupKey(slot) {
    return `${slot.date}-${slot.shiftTypeId}`;
}

export function isAlreadyAssignedOnDay(employee, slot, slots, state) {
    for (const s of slots) {
        if (s.date !== slot.date || s.id === slot.id) continue;
        if (state.assignments.get(s.id) === employee.id) return true;
    }
    return false;
}

export function isAvailableForSlot(employee, slot, lookups) {
    const weeklyUnavailability =
        lookups.weeklyUnavailabilityMap.get(employee.id) || [];
    const blockedWeekly = weeklyUnavailability.some(
        (w) =>
            w.dayOfWeek === slot.dayOfWeek &&
            timesOverlap(slot.startTime, slot.endTime, w.startTime, w.endTime),
    );
    if (blockedWeekly) return false;

    const specificUnavailability =
        lookups.specificUnavailabilityMap.get(employee.id) || [];
    const blockedSpecific = specificUnavailability.some(
        (s) =>
            s.date === slot.date &&
            timesOverlap(slot.startTime, slot.endTime, s.startTime, s.endTime),
    );
    return !blockedSpecific;
}

//----------------------------------------------------------
// Step 1: Normalize data and build slots for the date range
//----------------------------------------------------------

export function normalizeScheduleData(scheduleData) {
    const employeeMap = new Map();
    scheduleData.employees.forEach((emp) => employeeMap.set(emp.id, emp));

    const weeklyUnavailabilityMap = new Map();
    scheduleData.availability.weeklyAvailability.forEach((entry) => {
        if (!weeklyUnavailabilityMap.has(entry.userId))
            weeklyUnavailabilityMap.set(entry.userId, []);
        weeklyUnavailabilityMap.get(entry.userId).push(entry);
    });

    const specificUnavailabilityMap = new Map();
    scheduleData.availability.specificDates.forEach((entry) => {
        const normalized = { ...entry, date: toDateString(entry.date) };
        if (!specificUnavailabilityMap.has(entry.userId))
            specificUnavailabilityMap.set(entry.userId, []);
        specificUnavailabilityMap.get(entry.userId).push(normalized);
    });

    const weeklyRequirementsMap = new Map();
    scheduleData.shiftRequirements.weeklyRequirements.forEach((req) => {
        if (!weeklyRequirementsMap.has(req.dayOfWeek))
            weeklyRequirementsMap.set(req.dayOfWeek, []);
        weeklyRequirementsMap.get(req.dayOfWeek).push(req);
    });

    const dateRequirementsMap = new Map();
    scheduleData.shiftRequirements.dateRequirements.forEach((req) => {
        const dateString = toDateString(req.date);
        if (!dateRequirementsMap.has(dateString))
            dateRequirementsMap.set(dateString, []);
        dateRequirementsMap.get(dateString).push(req);
    });

    const shiftTypeMap = new Map();
    scheduleData.shiftTypes.forEach((shiftType) =>
        shiftTypeMap.set(shiftType.id, shiftType),
    );

    return {
        employeeMap,
        weeklyUnavailabilityMap,
        specificUnavailabilityMap,
        weeklyRequirementsMap,
        dateRequirementsMap,
        shiftTypeMap,
    };
}

export function buildSlotsForRange(startDate, endDate, lookups) {
    const slots = [];
    const dates = getDatesInRange(startDate, endDate);

    dates.forEach((date) => {
        const dayOfWeek = getDayOfWeek(date);
        const weeklyReqs = lookups.weeklyRequirementsMap.get(dayOfWeek) || [];
        const dateReqs = lookups.dateRequirementsMap.get(date) || [];
        const requirements = dateReqs.length > 0 ? dateReqs : weeklyReqs;

        requirements.forEach((req) => {
            const shiftType = lookups.shiftTypeMap.get(req.shiftTypeId);
            if (!shiftType) return;

            for (let i = 0; i < req.requiredStaff; i++) {
                slots.push({
                    id: `${date}-${req.shiftTypeId}-${i}`,
                    date,
                    dayOfWeek,
                    shiftTypeId: req.shiftTypeId,
                    shiftName: shiftType.name,
                    startTime: shiftType.startTime,
                    endTime: shiftType.endTime,
                    seatIndex: i,
                });
            }
        });
    });

    return slots;
}

//--------------------------------------------------------------------
// Step 2: Order slots by most constrained (fewest eligible employees)
//--------------------------------------------------------------------

function countEligibleEmployees(slot, lookups, requireLeader = false) {
    let count = 0;
    for (const employee of lookups.employeeMap.values()) {
        if (requireLeader && !isShiftLeader(employee)) continue;
        if (
            calculateHours(slot.startTime, slot.endTime) >
            employee.maxHoursPerWeek
        )
            continue;
        if (!isAvailableForSlot(employee, slot, lookups)) continue;
        count++;
    }
    return count;
}

function sortSlotsByMostConstrained(slots, lookups) {
    // Pre-identify which slots are the last seat in their group (leader required if shift needs one)
    const groupLastSeat = new Set();
    const groupSeen = new Set();
    for (let i = slots.length - 1; i >= 0; i--) {
        const key = shiftGroupKey(slots[i]);
        if (!groupSeen.has(key)) {
            groupSeen.add(key);
            if (slots[i].shiftName !== "MidShift")
                groupLastSeat.add(slots[i].id);
        }
    }

    return [...slots].sort((a, b) => {
        const aRequiresLeader = groupLastSeat.has(a.id);
        const bRequiresLeader = groupLastSeat.has(b.id);
        const aCount = countEligibleEmployees(a, lookups, aRequiresLeader);
        const bCount = countEligibleEmployees(b, lookups, bRequiresLeader);
        return aCount - bCount;
    });
}

//---------------------------------------------------------------------
// Step 3: Backtracking algorithm to fill slots with eligible employees
//---------------------------------------------------------------------

function shiftGroupHasLeader(groupKey, slots, state, lookups) {
    for (const s of slots) {
        if (shiftGroupKey(s) !== groupKey) continue;
        const emp = lookups.employeeMap.get(state.assignments.get(s.id));
        if (emp && isShiftLeader(emp)) return true;
    }
    return false;
}

function isLastSlotInGroup(slots, slotIndex) {
    const groupKey = shiftGroupKey(slots[slotIndex]);
    for (let i = slotIndex + 1; i < slots.length; i++) {
        if (shiftGroupKey(slots[i]) === groupKey) return false;
    }
    return true;
}

function getValidEmployees(slot, slotIndex, slots, state, lookups) {
    const groupKey = shiftGroupKey(slot);
    const shiftRequiresLeader = slot.shiftName !== "MidShift";
    const mustBeLeader =
        shiftRequiresLeader &&
        isLastSlotInGroup(slots, slotIndex) &&
        !shiftGroupHasLeader(groupKey, slots, state, lookups);

    const valid = [];

    for (const employee of lookups.employeeMap.values()) {
        if (mustBeLeader && !isShiftLeader(employee)) continue;

        if (isAlreadyAssignedOnDay(employee, slot, slots, state)) continue;

        const hoursWorked = state.hoursWorked.get(employee.id) || 0;
        if (
            hoursWorked + calculateHours(slot.startTime, slot.endTime) >
            employee.maxHoursPerWeek
        )
            continue;

        if (!isAvailableForSlot(employee, slot, lookups)) continue;

        valid.push(employee);
    }

    // Prefer employees who didn't work yesterday, then least hours worked
    const yesterday = new Date(slot.date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    valid.sort((a, b) => {
        const aWorkedYesterday =
            state.lastWorkedDate.get(a.id)?.toISOString().slice(0, 10) ===
            yesterdayStr;
        const bWorkedYesterday =
            state.lastWorkedDate.get(b.id)?.toISOString().slice(0, 10) ===
            yesterdayStr;

        if (aWorkedYesterday !== bWorkedYesterday)
            return aWorkedYesterday ? 1 : -1;

        return (
            (state.hoursWorked.get(a.id) || 0) -
            (state.hoursWorked.get(b.id) || 0)
        );
    });

    return valid;
}

function applyAssignment(employee, slot, state) {
    state.assignments.set(slot.id, employee.id);
    state.hoursWorked.set(
        employee.id,
        (state.hoursWorked.get(employee.id) || 0) +
            calculateHours(slot.startTime, slot.endTime),
    );
    state.lastWorkedDate.set(employee.id, new Date(slot.date));
}

function undoAssignment(employee, slot, state, slots) {
    state.assignments.delete(slot.id);
    state.hoursWorked.set(
        employee.id,
        (state.hoursWorked.get(employee.id) || 0) -
            calculateHours(slot.startTime, slot.endTime),
    );

    // Restore lastWorkedDate to the employee's most recent remaining assignment
    let lastDate = null;
    for (const s of slots) {
        if (state.assignments.get(s.id) !== employee.id) continue;
        const d = new Date(s.date);
        if (!lastDate || d > lastDate) lastDate = d;
    }
    state.lastWorkedDate.set(employee.id, lastDate);
}

// Adds pre pinned employees to schedule slots before generating schedule
// Only needed if user assigns an employee to work a certain shift before schedule genration begins
function applyPresetAssignments(slots, presetSlots, state, lookups) {
    for (const preset of presetSlots) {
        const employee = lookups.employeeMap.get(preset.userId);
        if (!employee) continue;

        const slot = slots.find(
            (s) =>
                s.date === preset.date &&
                s.shiftTypeId === preset.shiftTypeId &&
                !state.assignments.has(s.id),
        );
        if (!slot) continue;

        applyAssignment(employee, slot, state);
        state.lockedSlotIds.add(slot.id);
    }
}

function backtrackFillSlots(slots, slotIndex, state, lookups, diagnostics) {
    if (slotIndex === slots.length) return true;

    const slot = slots[slotIndex];

    // Pinned slots were already filled by applyPresetAssignments - leave them alone.
    if (state.assignments.has(slot.id)) {
        return backtrackFillSlots(
            slots,
            slotIndex + 1,
            state,
            lookups,
            diagnostics,
        );
    }

    const candidates = getValidEmployees(
        slot,
        slotIndex,
        slots,
        state,
        lookups,
    );

    if (candidates.length === 0) {
        if (slotIndex >= diagnostics.deepestSlotIndex) {
            diagnostics.deepestSlotIndex = slotIndex;
            diagnostics.failedSlot = slot;
        }
        return false;
    }

    for (const employee of candidates) {
        applyAssignment(employee, slot, state);
        if (
            backtrackFillSlots(
                slots,
                slotIndex + 1,
                state,
                lookups,
                diagnostics,
            )
        )
            return true;
        undoAssignment(employee, slot, state, slots);
    }

    return false;
}

//-----------------------------------------------------------
// Step 4: Repair pass — swap assignments to improve fairness
//-----------------------------------------------------------

// Weights to determine how much each factor plays a role is schedule fairness score
const SCORE_WEIGHTS = {
    hours: 1,
    weekends: 2,
    consecutiveDays: 3,
};

function variance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function countConsecutiveDayPairs(datesByEmployee) {
    let count = 0;
    for (const dateSet of datesByEmployee.values()) {
        for (const dateStr of dateSet) {
            const next = new Date(dateStr + "T00:00:00");
            next.setDate(next.getDate() + 1);
            if (dateSet.has(toDateString(next))) count++;
        }
    }
    return count;
}

function computeEmployeeStats(slots, state) {
    const weekendsByEmployee = new Map();
    const datesByEmployee = new Map();

    for (const slot of slots) {
        const empId = state.assignments.get(slot.id);
        if (!empId) continue;

        if (!datesByEmployee.has(empId)) datesByEmployee.set(empId, new Set());
        datesByEmployee.get(empId).add(slot.date);

        if (isWeekendDay(slot.dayOfWeek)) {
            weekendsByEmployee.set(
                empId,
                (weekendsByEmployee.get(empId) || 0) + 1,
            );
        }
    }

    return { weekendsByEmployee, datesByEmployee };
}

// Lower is better. Combines hours variance, weekend-count variance, and the number of back-to-back workdays across all employees into one comparable number.
function scoreSchedule(slots, state, lookups) {
    const { weekendsByEmployee, datesByEmployee } = computeEmployeeStats(
        slots,
        state,
    );
    const employeeIds = [...lookups.employeeMap.keys()];

    const hours = employeeIds.map((id) => state.hoursWorked.get(id) || 0);
    const weekends = employeeIds.map((id) => weekendsByEmployee.get(id) || 0);

    return (
        variance(hours) * SCORE_WEIGHTS.hours +
        variance(weekends) * SCORE_WEIGHTS.weekends +
        countConsecutiveDayPairs(datesByEmployee) *
            SCORE_WEIGHTS.consecutiveDays
    );
}

function groupHasLeaderIfAssigned(slot, newEmployee, slots, state, lookups) {
    if (slot.shiftName === "MidShift") return true;
    if (isShiftLeader(newEmployee)) return true;

    const groupKey = shiftGroupKey(slot);
    for (const s of slots) {
        if (shiftGroupKey(s) !== groupKey || s.id === slot.id) continue;
        const emp = lookups.employeeMap.get(state.assignments.get(s.id));
        if (emp && isShiftLeader(emp)) return true;
    }
    return false;
}

// Can the employees currently on slotA and slotB trade places? Checks availability, same-day double-booking, hour caps, and shift-leader coverage for both shifts
function canSwap(slotA, slotB, slots, state, lookups) {
    if (state.lockedSlotIds.has(slotA.id) || state.lockedSlotIds.has(slotB.id))
        return false;

    const empAId = state.assignments.get(slotA.id);
    const empBId = state.assignments.get(slotB.id);
    if (!empAId || !empBId || empAId === empBId) return false;

    const empA = lookups.employeeMap.get(empAId);
    const empB = lookups.employeeMap.get(empBId);

    if (!isAvailableForSlot(empA, slotB, lookups)) return false;
    if (!isAvailableForSlot(empB, slotA, lookups)) return false;

    if (isAlreadyAssignedOnDay(empA, slotB, slots, state)) return false;
    if (isAlreadyAssignedOnDay(empB, slotA, slots, state)) return false;

    const durationA = calculateHours(slotA.startTime, slotA.endTime);
    const durationB = calculateHours(slotB.startTime, slotB.endTime);
    const newHoursA =
        (state.hoursWorked.get(empAId) || 0) - durationA + durationB;
    const newHoursB =
        (state.hoursWorked.get(empBId) || 0) - durationB + durationA;
    if (newHoursA > empA.maxHoursPerWeek) return false;
    if (newHoursB > empB.maxHoursPerWeek) return false;

    if (!groupHasLeaderIfAssigned(slotA, empB, slots, state, lookups))
        return false;
    if (!groupHasLeaderIfAssigned(slotB, empA, slots, state, lookups))
        return false;

    return true;
}

// Swaps whichever employees currently hold slotA/slotB and keeps hoursWorked in sync.
function applySwap(slotA, slotB, state) {
    const empAId = state.assignments.get(slotA.id);
    const empBId = state.assignments.get(slotB.id);
    const durationA = calculateHours(slotA.startTime, slotA.endTime);
    const durationB = calculateHours(slotB.startTime, slotB.endTime);

    state.assignments.set(slotA.id, empBId);
    state.assignments.set(slotB.id, empAId);

    state.hoursWorked.set(
        empAId,
        (state.hoursWorked.get(empAId) || 0) - durationA + durationB,
    );
    state.hoursWorked.set(
        empBId,
        (state.hoursWorked.get(empBId) || 0) - durationB + durationA,
    );
}

// Repeatedly looks for a pair of different-day slots whose employees can be swapped to
// lower the fairness score, applying every improving swap found, until a full pass finds
// none.
function repairSchedule(slots, state, lookups, maxPasses = 20) {
    let bestScore = scoreSchedule(slots, state, lookups);

    for (let pass = 0; pass < maxPasses; pass++) {
        let improved = false;

        for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
                const slotA = slots[i];
                const slotB = slots[j];
                if (slotA.date === slotB.date) continue;
                if (!canSwap(slotA, slotB, slots, state, lookups)) continue;

                applySwap(slotA, slotB, state);
                const newScore = scoreSchedule(slots, state, lookups);

                if (newScore < bestScore) {
                    bestScore = newScore;
                    improved = true;
                } else {
                    applySwap(slotA, slotB, state); // not an improvement so swap back
                }
            }
        }

        if (!improved) break;
    }
}

//------------
// Entry point
//------------
export function generateScheduleFromData(
    scheduleData,
    startDate,
    endDate,
    presetSlots = [],
) {
    const lookups = normalizeScheduleData(scheduleData);
    const state = createInitialState();
    const slots = sortSlotsByMostConstrained(
        buildSlotsForRange(startDate, endDate, lookups),
        lookups,
    );

    applyPresetAssignments(slots, presetSlots, state, lookups);

    const diagnostics = { deepestSlotIndex: -1, failedSlot: null };
    const success = backtrackFillSlots(slots, 0, state, lookups, diagnostics);

    if (!success) {
        const f = diagnostics.failedSlot;
        const reason = f
            ? `Could not fill the "${f.shiftName}" shift on ${f.date} (${DAYS_OF_WEEK[f.dayOfWeek]}). No eligible employees were available for that slot.`
            : "Could not complete the schedule. Not enough eligible employees to fill all required shifts.";
        return { schedule: null, reason };
    }

    repairSchedule(slots, state, lookups);

    const schedule = slots.map((slot) => {
        const employee = lookups.employeeMap.get(
            state.assignments.get(slot.id),
        );
        return {
            date: slot.date,
            dayOfWeek: DAYS_OF_WEEK[slot.dayOfWeek],
            shiftTypeId: slot.shiftTypeId,
            shiftName: slot.shiftName,
            startTime: formatTime12Hour(slot.startTime),
            endTime: formatTime12Hour(slot.endTime),
            userId: employee ? employee.id : null,
            employee: employee
                ? `${employee.firstName} ${employee.lastName}`
                : null,
            position: employee ? employee.position : null,
            pinned: state.lockedSlotIds.has(slot.id),
        };
    });

    return { schedule, reason: null };
}
