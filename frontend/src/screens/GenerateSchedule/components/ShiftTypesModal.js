import { useState, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { apiRequest } from "../../../api/apiHelper";
import { formatDbTime } from "../../../util/dateTimeHelpers";

// Modal for creating/deleting shift types (e.g. Morning, Evening).
export default function ShiftTypesModal({
    show,
    onHide,
    shiftTypes,
    onShiftTypesChange,
}) {
    const [shiftTypeName, setShiftTypeName] = useState("");
    const [shiftStartTime, setShiftStartTime] = useState("");
    const [shiftEndTime, setShiftEndTime] = useState("");

    async function submitShiftType(e) {
        e.preventDefault();
        try {
            await apiRequest("/shifts/createShiftType", "POST", {
                name: shiftTypeName,
                startTime: shiftStartTime,
                endTime: shiftEndTime,
            });
            setShiftTypeName("");
            setShiftStartTime("");
            setShiftEndTime("");
            const updated = await apiRequest("/shifts/getShiftTypes");
            onShiftTypesChange(updated);
        } catch (e) {
            console.error("Error adding shift type:", e);
        }
    }

    async function handleDeleteShiftType(id) {
        try {
            await apiRequest(`/shifts/deleteShiftType/${id}`, "DELETE");
            const updated = await apiRequest("/shifts/getShiftTypes");
            onShiftTypesChange(updated);
        } catch (e) {
            console.error("Error deleting shift type:", e);
        }
    }

    // Formats shift type times for display
    const formattedShiftTypes = useMemo(() => {
        return shiftTypes.map((shiftType) => {
            return {
                ...shiftType,
                startTime: formatDbTime(shiftType.startTime),
                endTime: formatDbTime(shiftType.endTime),
            };
        });
    }, [shiftTypes]);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Shift Types</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Current Shift Types */}
                <h5>Current Shift Types</h5>
                {formattedShiftTypes.length === 0 ? (
                    <p className="text-muted">No shift types added yet.</p>
                ) : (
                    <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formattedShiftTypes.map((shiftType) => (
                                <tr key={shiftType.id}>
                                    <td>{shiftType.name}</td>
                                    <td>{shiftType.startTime}</td>
                                    <td>{shiftType.endTime}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() =>
                                                handleDeleteShiftType(
                                                    shiftType.id,
                                                )
                                            }
                                        >
                                            ✕
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <hr />

                {/* Add New Shift Type */}
                <h5>Add New Shift Type</h5>
                <Form onSubmit={submitShiftType}>
                    <Form.Group className="mb-2">
                        <Form.Label>Shift Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Morning"
                            value={shiftTypeName}
                            onChange={(e) => setShiftTypeName(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Start Time</Form.Label>
                        <Form.Control
                            type="time"
                            value={shiftStartTime}
                            onChange={(e) => setShiftStartTime(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>End Time</Form.Label>
                        <Form.Control
                            type="time"
                            value={shiftEndTime}
                            onChange={(e) => setShiftEndTime(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Add Shift Type
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
