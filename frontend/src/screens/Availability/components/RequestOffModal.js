import { useState } from "react";
import Modal from "../../../GlobalComponents/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

// Triggered by clicking a date on the calendar - requests off the given date.
export default function RequestOffModal({
    show,
    onHide,
    selectedDate,
    shiftTypes,
    onSubmit,
}) {
    const [requestOffShiftType, setRequestOffShiftType] = useState("");
    const [requestOffReason, setRequestOffReason] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(requestOffShiftType, requestOffReason);
    }

    return (
        <Modal show={show} handleClose={onHide} title="Request Off">
            <Form onSubmit={handleSubmit}>
                <h3 className="h5 mb-3">Requesting Off for {selectedDate}</h3>
                <Form.Group className="mb-3">
                    <Form.Label>Shift you can't work</Form.Label>
                    <Form.Select
                        value={requestOffShiftType}
                        required
                        onChange={(e) => setRequestOffShiftType(e.target.value)}
                    >
                        <option value="" disabled>
                            -- Select Shift --
                        </option>
                        {shiftTypes.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                        <option value="all">All</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Reason for Request</Form.Label>
                    <Form.Control
                        type="text"
                        value={requestOffReason}
                        required
                        onChange={(e) => setRequestOffReason(e.target.value)}
                    />
                </Form.Group>
                <Button type="submit" variant="primary">
                    Submit Request
                </Button>
            </Form>
        </Modal>
    );
}
