import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { formatDbDate } from "../../../util/dateTimeHelpers";
import {
    groupRowsByEmployeeAndDay,
    summarizeShiftCoverage,
} from "../../../util/availabilityHelpers";

const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

export default function EmployeeAvailabilityModal({
    show,
    onHide,
    employees,
    shiftTypes,
    loading,
}) {
    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Employee Availability</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <p className="mb-0">Loading...</p>
                ) : employees.length === 0 ? (
                    <p className="text-muted mb-0">No employees found.</p>
                ) : (
                    employees.map((emp, i) => {
                        // Combine rows for the same day into one badge
                        const unavailableGroups = groupRowsByEmployeeAndDay(
                            emp.weeklyUnavailability,
                            "dayOfWeek",
                        );
                        const requestOffGroups = groupRowsByEmployeeAndDay(
                            emp.requestedOffDates,
                            "date",
                        );
                        const hasNothing =
                            unavailableGroups.length === 0 &&
                            requestOffGroups.length === 0;

                        return (
                            <div
                                key={emp.id}
                                className={
                                    i < employees.length - 1
                                        ? "mb-3 pb-3 border-bottom"
                                        : "mb-1"
                                }
                            >
                                <h6 className="mb-2">
                                    {emp.firstName} {emp.lastName}
                                </h6>

                                {hasNothing && (
                                    <p className="text-muted small mb-0">
                                        No unavailability or time-off on file.
                                    </p>
                                )}

                                {unavailableGroups.length > 0 && (
                                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                        <span
                                            className="text-muted small text-uppercase"
                                            style={{ minWidth: 90 }}
                                        >
                                            Unavailable
                                        </span>
                                        {unavailableGroups.map((rows) => (
                                            <Badge
                                                key={rows[0].dayOfWeek}
                                                bg="warning"
                                                text="dark"
                                                className="fw-normal"
                                            >
                                                {
                                                    DAYS_OF_WEEK[
                                                        rows[0].dayOfWeek
                                                    ]
                                                }
                                                :{" "}
                                                {summarizeShiftCoverage(
                                                    rows,
                                                    shiftTypes,
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {requestOffGroups.length > 0 && (
                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                        <span
                                            className="text-muted small text-uppercase"
                                            style={{ minWidth: 90 }}
                                        >
                                            Requested Off
                                        </span>
                                        {requestOffGroups.map((rows) => (
                                            <Badge
                                                key={rows[0].date}
                                                bg="danger"
                                                className="fw-normal"
                                            >
                                                {formatDbDate(rows[0].date)}:{" "}
                                                {summarizeShiftCoverage(
                                                    rows,
                                                    shiftTypes,
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
