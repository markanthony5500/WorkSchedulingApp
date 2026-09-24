// Mark Collins
// 2.5.26

import React, { useState, useEffect, useMemo } from "react";
import Calendar from "../../GlobalComponents/Calendar";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Alert from "react-bootstrap/Alert";
import Sidebar from "../../GlobalComponents/Sidebar";
import { apiRequest } from "../../api/apiHelper";
import ShiftTypesModal from "./components/ShiftTypesModal";
import ShiftRequirementsModal from "./components/ShiftRequirementsModal";
import AddShiftModal from "./components/AddShiftModal";
import EditShiftModal from "./components/EditShiftModal";

export default function GenerateSchedule() {
    //----------------------
    // Shared reference data
    //----------------------
    // Used by the modals below
    const [shiftTypes, setShiftTypes] = useState([]);
    const [weeklyShiftRequirements, setWeeklyShiftRequirements] = useState([]);
    const [employees, setEmployees] = useState([]);

    //-------------------------
    // Modal open/trigger state
    //-------------------------
    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);
    const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
    const [addDate, setAddDate] = useState(null);
    const [editShiftModalOpen, setEditShiftModalOpen] = useState(false);
    const [editSlotId, setEditSlotId] = useState(null);

    //--------------------------------------------
    // Schedule generation & calendar editing data
    //--------------------------------------------
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [scheduleError, setScheduleError] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [scheduleRange, setScheduleRange] = useState(null);
    const [violations, setViolations] = useState(null);
    const [finalizing, setFinalizing] = useState(false);
    const [finalizeSuccess, setFinalizeSuccess] = useState(false);

    // Eligible employees for whichever slot is currently open in EditShiftModal
    const [eligibleEmployees, setEligibleEmployees] = useState(null);
    const [eligibleLoading, setEligibleLoading] = useState(false);

    //---------------------------------
    // Shared reference data - handlers
    //---------------------------------
    useEffect(() => {
        async function fetchData() {
            // Initial load can fetch all data needed for modals
            try {
                const [shiftTypesData, weeklyShiftData, employeesData] =
                    await Promise.all([
                        apiRequest("/shifts/getShiftTypes"),
                        apiRequest("/shifts/getWeeklyShiftRequirements"),
                        apiRequest("/employees/getEmployees"),
                    ]);

                setShiftTypes(shiftTypesData);
                setWeeklyShiftRequirements(weeklyShiftData);
                setEmployees(employeesData);
            } catch (e) {
                console.error("Error fetching Shifts / Requirements", e);
            }
        }

        fetchData();
    }, [shiftModalOpen, requirementsModalOpen]); // Re-fetch when modals open/close

    //--------------------------------------------------
    // Schedule generation & calendar editing handlers
    //--------------------------------------------------
    async function createSchedule(startDate, endDate) {
        try {
            const presetSlots = schedule
                .filter((s) => s.pinned)
                .map((s) => ({
                    date: s.date,
                    shiftTypeId: s.shiftTypeId,
                    userId: s.userId,
                }));
            const res = await apiRequest(
                "/scheduleGeneration/generateSchedule",
                "POST",
                { startDate, endDate, presetSlots },
            );
            if (!res.schedule)
                throw new Error("No schedule was returned from the server");
            // Give each slot an id so it can be dragged, edited or removed
            const withIds = res.schedule.map((slot, i) => ({ ...slot, id: i }));
            const range = { startDate, endDate };
            setSchedule(withIds);
            setScheduleRange(range);
            setFinalizeSuccess(false);
            // Pass range directly since scheduleRange state hasn't updated yet
            await revalidateSchedule(withIds, range);
        } catch (e) {
            setScheduleError(e.message);
        }
    }

    // Re-validate the schedule after every edit
    async function revalidateSchedule(slots, range) {
        if (slots.length === 0) {
            setViolations(null);
            return;
        }
        try {
            const result = await apiRequest(
                "/scheduleGeneration/validateSchedule",
                "POST",
                {
                    slots: slots.map((s) => ({
                        date: s.date,
                        shiftTypeId: s.shiftTypeId,
                        userId: s.userId,
                    })),
                    startDate: range?.startDate,
                    endDate: range?.endDate,
                },
            );
            setViolations(result);
        } catch (e) {
            console.error("Error validating schedule:", e);
        }
    }

    // Used by the add/edit modals to update the schedule and re-validate it
    function onScheduleChange(updated) {
        setSchedule(updated);
        revalidateSchedule(updated, scheduleRange);
    }

    // Dragging a shift moves it to a new date
    function handleEventDrop(info) {
        const slotId = Number(info.event.id);
        const updated = schedule.map((s) =>
            s.id === slotId ? { ...s, date: info.event.startStr } : s,
        );
        onScheduleChange(updated);
    }

    async function handleFinalize() {
        setFinalizing(true);
        setFinalizeSuccess(false);
        try {
            await apiRequest("/scheduleGeneration/finalizeSchedule", "POST", {
                slots: schedule.map((s) => ({
                    date: s.date,
                    shiftTypeId: s.shiftTypeId,
                    userId: s.userId,
                })),
                startDate: scheduleRange?.startDate,
                endDate: scheduleRange?.endDate,
            });
            setSchedule([]);
            setScheduleRange(null);
            setViolations(null);
            setFinalizeSuccess(true);
        } catch (e) {
            if (e.body && e.body.violations) {
                setViolations({ valid: false, violations: e.body.violations });
            }
            setScheduleError(e.message);
        } finally {
            setFinalizing(false);
        }
    }

    // Built from schedule so the calendar always matches it
    const calendarEvents = useMemo(() => {
        return schedule.map((slot) => ({
            id: String(slot.id),
            title: `${slot.employee ?? "Unassigned"}\n${slot.startTime}-${slot.endTime}`,
            start: slot.date,
            allDay: true,
        }));
    }, [schedule]);

    // Clicking an empty date opens the add-shift modal (added shifts are pinned)
    function handleDateClick(info) {
        setAddDate(info.dateStr);
        setAddShiftModalOpen(true);
    }

    // Clicking a shift opens the reassign/remove modal with only eligible employees
    async function handleEventClick(info) {
        const slotId = Number(info.event.id);
        const slot = schedule.find((s) => s.id === slotId);
        if (!slot) return;
        setEditSlotId(slotId);
        setEditShiftModalOpen(true);
        setEligibleEmployees(null);
        setEligibleLoading(true);
        try {
            const res = await apiRequest(
                "/scheduleGeneration/eligibleEmployees",
                "POST",
                {
                    slots: schedule.map((s) => ({
                        id: s.id,
                        date: s.date,
                        shiftTypeId: s.shiftTypeId,
                        userId: s.userId,
                    })),
                    slotId,
                },
            );
            setEligibleEmployees(res.employees);
        } catch (e) {
            console.error("Error fetching eligible employees:", e);
            setEligibleEmployees(employees); // fall back to showing everyone
        } finally {
            setEligibleLoading(false);
        }
    }

    return (
        <div>
            <Sidebar />
            <Container className="page-container">
                <h1 className="mb-4">Generate Schedule</h1>

                {/* Setup: shift types and requirements */}
                <h6 className="text-uppercase text-muted mb-2">Setup</h6>
                <div className="d-flex flex-wrap gap-2 mb-4">
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            setShiftModalOpen(true);
                        }}
                    >
                        Modify Shift Types
                    </Button>
                    <ShiftTypesModal
                        show={shiftModalOpen}
                        onHide={() => setShiftModalOpen(false)}
                        shiftTypes={shiftTypes}
                        onShiftTypesChange={setShiftTypes}
                    />

                    <Button
                        variant="outline-secondary"
                        onClick={() => setRequirementsModalOpen(true)}
                    >
                        Modify Shift Requirements
                    </Button>
                    <ShiftRequirementsModal
                        show={requirementsModalOpen}
                        onHide={() => setRequirementsModalOpen(false)}
                        shiftTypes={shiftTypes}
                        weeklyShiftRequirements={weeklyShiftRequirements}
                        onWeeklyChange={setWeeklyShiftRequirements}
                    />

                    {/* Error modal shown when schedule generation fails */}
                    <Modal
                        show={!!scheduleError}
                        onHide={() => setScheduleError(null)}
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>
                                Schedule Generation Failed
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>{scheduleError}</Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="secondary"
                                onClick={() => setScheduleError(null)}
                            >
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>

                {/* Generate & finalize */}
                <h6 className="text-uppercase text-muted mb-2">
                    Generate &amp; Finalize
                </h6>
                <div className="border rounded p-3 mb-4">
                    <div className="d-flex flex-wrap align-items-end gap-3">
                        <Form.Group>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button
                            variant="primary"
                            onClick={() => createSchedule(startDate, endDate)}
                            disabled={!startDate || !endDate}
                        >
                            Generate Schedule
                        </Button>

                        <Button
                            variant="success"
                            onClick={handleFinalize}
                            disabled={
                                schedule.length === 0 ||
                                !violations ||
                                !violations.valid ||
                                finalizing
                            }
                        >
                            {finalizing ? "Finalizing..." : "Finalize Schedule"}
                        </Button>
                    </div>
                </div>

                {finalizeSuccess && (
                    <Alert
                        variant="success"
                        dismissible
                        onClose={() => setFinalizeSuccess(false)}
                    >
                        Schedule finalized successfully.
                    </Alert>
                )}

                {violations && !violations.valid && (
                    <Alert variant="warning">
                        <strong>
                            This schedule has {violations.violations.length}{" "}
                            issue(s) to resolve before it can be finalized:
                        </strong>
                        <ul className="mb-0">
                            {violations.violations.map((v, i) => (
                                <li key={i}>{v.message}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                {schedule.length > 0 && (
                    <p className="text-muted mb-3">
                        Drag a shift to move it to a different day, click a
                        shift to reassign or remove it, or click an empty date
                        to add one.
                    </p>
                )}

                {/* Draft schedule calendar */}
                <Calendar
                    events={calendarEvents}
                    editable={schedule.length > 0}
                    onEventDrop={handleEventDrop}
                    onEventClick={handleEventClick}
                    handleDateClick={handleDateClick}
                />

                <AddShiftModal
                    show={addShiftModalOpen}
                    addDate={addDate}
                    onHide={() => setAddShiftModalOpen(false)}
                    employees={employees}
                    shiftTypes={shiftTypes}
                    schedule={schedule}
                    onScheduleChange={onScheduleChange}
                />

                <EditShiftModal
                    show={editShiftModalOpen}
                    editSlotId={editSlotId}
                    onHide={() => setEditShiftModalOpen(false)}
                    schedule={schedule}
                    employees={employees}
                    eligibleEmployees={eligibleEmployees}
                    eligibleLoading={eligibleLoading}
                    onScheduleChange={onScheduleChange}
                />
            </Container>
        </div>
    );
}
