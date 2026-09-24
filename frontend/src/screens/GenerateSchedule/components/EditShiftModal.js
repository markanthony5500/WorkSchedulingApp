import { useState, useEffect, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

// Reassign/remove flow for an existing shift slot.
export default function EditShiftModal({
    show,
    editSlotId,
    onHide,
    schedule,
    employees,
    eligibleEmployees,
    eligibleLoading,
    onScheduleChange,
}) {
    const [editEmployeeId, setEditEmployeeId] = useState("");

    const editingSlot = useMemo(
        () => schedule.find((s) => s.id === editSlotId) ?? null,
        [schedule, editSlotId],
    );

    // Pre-select the employee currently assigned to the clicked shift
    useEffect(() => {
        setEditEmployeeId(
            editingSlot?.userId ? String(editingSlot.userId) : "",
        );
    }, [editingSlot]);

    // Eligible employees, plus the current employee even if no longer eligible, so the pre-selected option exists
    const dropdownEmployees = useMemo(() => {
        if (!eligibleEmployees) return [];
        const list = [...eligibleEmployees];
        if (
            editingSlot?.userId &&
            !list.some((e) => e.id === editingSlot.userId)
        ) {
            const current = employees.find((e) => e.id === editingSlot.userId);
            if (current) list.unshift(current);
        }
        return list;
    }, [eligibleEmployees, editingSlot, employees]);

    function saveSlotEdit() {
        const emp = employees.find((e) => e.id === parseInt(editEmployeeId));
        const updated = schedule.map((s) =>
            s.id === editSlotId
                ? {
                      ...s,
                      userId: emp ? emp.id : null,
                      employee: emp ? `${emp.firstName} ${emp.lastName}` : null,
                      position: emp ? emp.position : null,
                  }
                : s,
        );
        onScheduleChange(updated);
        onHide();
    }

    function removeSlot() {
        const updated = schedule.filter((s) => s.id !== editSlotId);
        onScheduleChange(updated);
        onHide();
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Shift</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {editingSlot && (
                    <>
                        <p className="mb-3">
                            {editingSlot.shiftName} — {editingSlot.date} (
                            {editingSlot.startTime}–{editingSlot.endTime})
                        </p>
                        <Form.Group className="mb-2">
                            <Form.Label>Employee</Form.Label>
                            {eligibleLoading ? (
                                <p className="text-muted mb-0">
                                    Checking who's eligible for this shift...
                                </p>
                            ) : (
                                <>
                                    <Form.Control
                                        as="select"
                                        value={editEmployeeId}
                                        onChange={(e) =>
                                            setEditEmployeeId(e.target.value)
                                        }
                                    >
                                        <option value="">
                                            -- Unassigned --
                                        </option>
                                        {dropdownEmployees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} (
                                                {emp.position})
                                            </option>
                                        ))}
                                    </Form.Control>
                                    {dropdownEmployees.length === 0 && (
                                        <Form.Text className="text-muted">
                                            No employees are available and under
                                            their hour limit for this shift.
                                        </Form.Text>
                                    )}
                                </>
                            )}
                        </Form.Group>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={removeSlot}>
                    Remove Shift
                </Button>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={saveSlotEdit}
                    disabled={eligibleLoading}
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
