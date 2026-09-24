import { useState, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { apiRequest } from "../../../api/apiHelper";

// Modal for creating/deleting weekly staffing requirements.
export default function ShiftRequirementsModal({
    show,
    onHide,
    shiftTypes,
    weeklyShiftRequirements,
    onWeeklyChange,
}) {
    const [weeklyDayOfWeek, setWeeklyDayOfWeek] = useState("0");
    const [weeklyShiftTypeId, setWeeklyShiftTypeId] = useState("");
    const [weeklyRequiredStaff, setWeeklyRequiredStaff] = useState("");

    async function submitWeeklyShiftRequirement(e) {
        e.preventDefault();
        try {
            const daysToAdd =
                weeklyDayOfWeek === "weekdays"
                    ? [1, 2, 3, 4]
                    : weeklyDayOfWeek === "weekends"
                      ? [0, 5, 6]
                      : [parseInt(weeklyDayOfWeek)];

            for (const day of daysToAdd) {
                await apiRequest(
                    "/shifts/createWeeklyShiftRequirement",
                    "POST",
                    {
                        dayOfWeek: day,
                        shiftTypeId: parseInt(weeklyShiftTypeId),
                        requiredStaff: parseInt(weeklyRequiredStaff),
                    },
                );
            }
            setWeeklyDayOfWeek("0");
            setWeeklyShiftTypeId("");
            setWeeklyRequiredStaff("");
            const updated = await apiRequest(
                "/shifts/getWeeklyShiftRequirements",
            );
            onWeeklyChange(updated);
        } catch (e) {
            console.error("Error adding weekly shift requirement:", e);
        }
    }

    async function handleDeleteWeeklyRequirement(id) {
        try {
            await apiRequest(
                `/shifts/deleteWeeklyShiftRequirement/${id}`,
                "DELETE",
            );
            const updated = await apiRequest(
                "/shifts/getWeeklyShiftRequirements",
            );
            onWeeklyChange(updated);
        } catch (e) {
            console.error("Error deleting weekly shift requirement:", e);
        }
    }

    // Map shiftTypeId -> shift name for display in requirements tables
    const shiftTypeMap = useMemo(() => {
        const map = {};
        shiftTypes.forEach((s) => {
            map[s.id] = s.name;
        });
        return map;
    }, [shiftTypes]);

    // Format Weekly Shift Requirements for display
    const formattedWeeklyShiftRequirements = useMemo(() => {
        return weeklyShiftRequirements.map((req) => {
            // Format day of week from number to string
            const daysOfWeek = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            return {
                ...req,
                dayOfWeek: daysOfWeek[req.dayOfWeek], // Convert dayOfWeek from number to string for display
            };
        });
    }, [weeklyShiftRequirements]);

    // Group weekly requirements by day so each day only appears once in the table
    const groupedWeeklyRequirements = useMemo(() => {
        const daysOrder = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const groups = {};
        formattedWeeklyShiftRequirements.forEach((req) => {
            if (!groups[req.dayOfWeek]) groups[req.dayOfWeek] = [];
            groups[req.dayOfWeek].push(req);
        });

        // Return only days that have shifts, in Sun-Sat order
        return daysOrder
            .filter((day) => groups[day])
            .map((day) => ({ dayOfWeek: day, shifts: groups[day] }));
    }, [formattedWeeklyShiftRequirements]);

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Shift Requirements</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Weekly Shift Requirements */}
                <h5>Weekly Shift Requirements</h5>
                {groupedWeeklyRequirements.length === 0 ? (
                    <p className="text-muted">
                        No weekly requirements added yet.
                    </p>
                ) : (
                    <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Shift</th>
                                <th>Required Staff</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedWeeklyRequirements.map((group) =>
                                group.shifts.map((shift, i) => (
                                    <tr key={shift.id}>
                                        {i === 0 && (
                                            <td
                                                rowSpan={group.shifts.length}
                                                style={{
                                                    verticalAlign: "middle",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {group.dayOfWeek}
                                            </td>
                                        )}
                                        <td>
                                            {shiftTypeMap[shift.shiftTypeId] ??
                                                `ID ${shift.shiftTypeId}`}
                                        </td>
                                        <td>{shift.requiredStaff}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteWeeklyRequirement(
                                                        shift.id,
                                                    )
                                                }
                                            >
                                                ✕
                                            </Button>
                                        </td>
                                    </tr>
                                )),
                            )}
                        </tbody>
                    </Table>
                )}

                {/* Add Weekly Shift Requirement Form */}
                <Form onSubmit={submitWeeklyShiftRequirement} className="mb-4">
                    <h6>Add Weekly Requirement</h6>
                    <Form.Group className="mb-2">
                        <Form.Label>Day of Week</Form.Label>
                        <Form.Control
                            as="select"
                            value={weeklyDayOfWeek}
                            onChange={(e) => setWeeklyDayOfWeek(e.target.value)}
                        >
                            <option value="0">Sunday</option>
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                            <option disabled>──────────</option>
                            <option value="weekdays">
                                All Weekdays (Mon–Thu)
                            </option>
                            <option value="weekends">
                                All Weekends (Fri, Sat, Sun)
                            </option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Shift Type</Form.Label>
                        <Form.Control
                            as="select"
                            value={weeklyShiftTypeId}
                            onChange={(e) =>
                                setWeeklyShiftTypeId(e.target.value)
                            }
                            required
                        >
                            <option value="">-- Select Shift --</option>
                            {shiftTypes.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Required Staff</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            value={weeklyRequiredStaff}
                            onChange={(e) =>
                                setWeeklyRequiredStaff(e.target.value)
                            }
                            required
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Add Weekly Requirement
                    </Button>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
