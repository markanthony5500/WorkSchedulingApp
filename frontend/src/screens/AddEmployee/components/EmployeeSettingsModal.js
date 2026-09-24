import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { apiRequest } from "../../../api/apiHelper";

// Lets a managert edit an existing employee
export default function EmployeeSettingsModal({
    show,
    onHide,
    employee,
    onSave,
}) {
    const [editPosition, setEditPosition] = useState("");
    const [editSalary, setEditSalary] = useState("");
    const [dayUnavailable, setDayUnavailable] = useState("1");
    const [shiftUnavailable, setShiftUnavailable] = useState("open");
    const [availabilityReason, setAvailabilityReason] = useState("");
    const [maxHoursPerWeek, setMaxHoursPerWeek] = useState("");

    // Reset form fields when new employee being edited
    useEffect(() => {
        if (employee) {
            setEditPosition(employee.position);
            setEditSalary(employee.salary);
            setMaxHoursPerWeek(employee.maxHoursPerWeek);
        }
    }, [employee]);

    async function handleAvailabilitySubmit(
        dayUnavailable,
        shiftUnavailable,
        availabilityReason,
    ) {
        await apiRequest("/shifts/setAvailability", "POST", {
            userId: employee.id,
            dayOfWeek: dayUnavailable,
            shift: shiftUnavailable,
            reason: availabilityReason,
        });
    }

    function handleAvailabilityFormSubmit(e) {
        e.preventDefault();
        handleAvailabilitySubmit(
            dayUnavailable,
            shiftUnavailable,
            availabilityReason,
        );
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Employee Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="mb-3">
                    {employee?.firstName} {employee?.lastName}
                </p>
                <Form.Group className="mb-3">
                    <Form.Label>Position</Form.Label>
                    <Form.Select
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                    >
                        {/* Hardcoded positions for now, could possibly change this later */}
                        <option value="Manager">Manager</option>
                        <option value="Shift Leader">Shift Leader</option>
                        <option value="Employee">Employee</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Salary</Form.Label>
                    <Form.Control
                        type="text"
                        value={editSalary}
                        onChange={(e) => setEditSalary(e.target.value)}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Max Hours</Form.Label>
                    <Form.Control
                        type="number"
                        value={maxHoursPerWeek}
                        onChange={(e) => setMaxHoursPerWeek(e.target.value)}
                    />
                </Form.Group>

                <hr className="my-4" />

                {/* Change Availability Section */}
                <h6 className="text-uppercase text-muted mb-3">
                    Change Availability
                </h6>
                <Form
                    onSubmit={handleAvailabilityFormSubmit}
                    className="border rounded p-3"
                >
                    <Form.Group className="mb-3">
                        <Form.Label>Day Of Week</Form.Label>
                        <Form.Select
                            value={dayUnavailable}
                            onChange={(e) => setDayUnavailable(e.target.value)}
                        >
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                            <option value="0">Sunday</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Unavailable Shift</Form.Label>
                        <Form.Select
                            value={shiftUnavailable}
                            onChange={(e) =>
                                setShiftUnavailable(e.target.value)
                            }
                        >
                            <option value="open">Open</option>
                            <option value="close">Close</option>
                            <option value="all">All</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Reason</Form.Label>
                        <Form.Control
                            type="text"
                            value={availabilityReason}
                            onChange={(e) =>
                                setAvailabilityReason(e.target.value)
                            }
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary">
                        Update Availability
                    </Button>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                <Button
                    variant="primary"
                    onClick={() =>
                        onSave(editPosition, editSalary, maxHoursPerWeek)
                    }
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
