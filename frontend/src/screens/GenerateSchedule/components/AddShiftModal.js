import { useState, useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { apiRequest } from "../../../api/apiHelper";
import { formatDbTime } from "../../../util/dateTimeHelpers";

// Adds a shift on a clicked date. New slots get negative ids so they never clash with generated ones
export default function AddShiftModal({
    show,
    addDate,
    onHide,
    employees,
    shiftTypes,
    schedule,
    onScheduleChange,
}) {
    const [addEmployeeId, setAddEmployeeId] = useState("");
    const [addShiftTypeId, setAddShiftTypeId] = useState("");
    const [addEligibleShiftTypes, setAddEligibleShiftTypes] = useState(null);
    const [addShiftTypesLoading, setAddShiftTypesLoading] = useState(false);
    const nextSlotIdRef = useRef(-1);

    // Reset selections each time the modal opens for a (possibly new) date
    useEffect(() => {
        setAddEmployeeId("");
        setAddShiftTypeId("");
        setAddEligibleShiftTypes(null);
    }, [addDate]);

    // When an employee is picked, fetch the shifts they can work that day
    async function handleAddEmployeeChange(employeeId) {
        setAddEmployeeId(employeeId);
        setAddShiftTypeId("");
        setAddEligibleShiftTypes(null);
        if (!employeeId) return;
        setAddShiftTypesLoading(true);
        try {
            const existing = schedule.map((s) => ({
                date: s.date,
                shiftTypeId: s.shiftTypeId,
                userId: s.userId,
            }));
            const res = await apiRequest(
                "/scheduleGeneration/eligibleShiftTypes",
                "POST",
                {
                    slots: existing,
                    date: addDate,
                    userId: parseInt(employeeId),
                },
            );
            setAddEligibleShiftTypes(res.shiftTypes);
        } catch (e) {
            console.error(
                "Error fetching eligible shift types for new shift:",
                e,
            );
            setAddEligibleShiftTypes(shiftTypes);
        } finally {
            setAddShiftTypesLoading(false);
        }
    }

    function addSlot() {
        const shiftType = shiftTypes.find(
            (s) => s.id === parseInt(addShiftTypeId),
        );
        const emp = employees.find((e) => e.id === parseInt(addEmployeeId));
        if (!shiftType || !emp) return;
        const newSlot = {
            id: nextSlotIdRef.current--,
            date: addDate,
            dayOfWeek: new Date(addDate + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long" },
            ),
            shiftTypeId: shiftType.id,
            shiftName: shiftType.name,
            startTime: formatDbTime(shiftType.startTime),
            endTime: formatDbTime(shiftType.endTime),
            userId: emp.id,
            employee: `${emp.firstName} ${emp.lastName}`,
            position: emp.position,
            // Pinned so schedule generation keeps this shift instead of overwriting it
            pinned: true,
        };
        onScheduleChange([...schedule, newSlot]);
        onHide();
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Add Shift</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="mb-3">{addDate}</p>
                <Form.Group className="mb-2">
                    <Form.Label>Employee</Form.Label>
                    <Form.Control
                        as="select"
                        value={addEmployeeId}
                        onChange={(e) =>
                            handleAddEmployeeChange(e.target.value)
                        }
                    >
                        <option value="">-- Select Employee --</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} ({emp.position})
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>
                {addEmployeeId && (
                    <Form.Group className="mb-2">
                        <Form.Label>Shift</Form.Label>
                        {addShiftTypesLoading ? (
                            <p className="text-muted mb-0">
                                Checking what they're eligible to work that
                                day...
                            </p>
                        ) : (
                            <>
                                <Form.Control
                                    as="select"
                                    value={addShiftTypeId}
                                    onChange={(e) =>
                                        setAddShiftTypeId(e.target.value)
                                    }
                                >
                                    <option value="">-- Select Shift --</option>
                                    {(addEligibleShiftTypes || []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </Form.Control>
                                {addEligibleShiftTypes &&
                                    addEligibleShiftTypes.length === 0 && (
                                        <Form.Text className="text-muted">
                                            This employee isn't available for
                                            any shift on this day (or is already
                                            at their hour limit).
                                        </Form.Text>
                                    )}
                            </>
                        )}
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={addSlot}
                    disabled={!addShiftTypeId || addShiftTypesLoading}
                >
                    Add
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
