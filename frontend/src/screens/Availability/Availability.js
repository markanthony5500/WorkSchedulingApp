// Screen combining schedule view, request off, change availability, and switch shift
import Sidebar from "../../GlobalComponents/Sidebar";
import Calendar from "../../GlobalComponents/Calendar";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Container from "react-bootstrap/Container";
import { useState, useEffect } from "react";
import { apiRequest } from "../../api/apiHelper";
import RequestOffModal from "./components/RequestOffModal";
import SwitchShiftModal from "./components/SwitchShiftModal";
import {
    groupRowsByEmployeeAndDay,
    summarizeShiftCoverage,
} from "../../util/availabilityHelpers";

export default function Availability() {
    // Calendar / request off states
    const [showRequestOffModal, setShowRequestOffModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [requestOffs, setRequestOffs] = useState([]);
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);

    // Filter toggle to show all, request offs, or unavailabale shifs
    const [filter, setFilter] = useState("all");

    const [showSwitchShiftModal, setShowSwitchShiftModal] = useState(false);

    // Total shift types for request off
    const [shiftTypes, setShiftTypes] = useState([]);

    // This screen only ever shows the logged-in user's own availability (admin can see total availablility in analytics instead)
    const [currentUserId, setCurrentUserId] = useState(null);

    const handleDateClick = (info) => {
        setSelectedDate(info.dateStr);
        setShowRequestOffModal(true);
    };

    const handleRequestOffSubmit = async (
        requestOffShiftType,
        requestOffReason,
    ) => {
        try {
            // "all" means requesting off every shift type on this day;
            // otherwise it's a single shift type id (string, from the select)
            const selectedShiftTypes =
                requestOffShiftType === "all"
                    ? shiftTypes
                    : shiftTypes.filter(
                          (s) => s.id === parseInt(requestOffShiftType),
                      );

            await Promise.all(
                selectedShiftTypes.map((shiftType) =>
                    apiRequest("/availability/requestOff", "POST", {
                        date: selectedDate,
                        startTime: shiftType.startTime,
                        endTime: shiftType.endTime,
                        reason: requestOffReason,
                    }),
                ),
            );
            console.log(
                "Requested off submitted for",
                selectedShiftTypes.length,
                "shift(s)",
            );
        } catch (e) {
            console.error("Error submitting request off:", e);
        }
        setShowRequestOffModal(false);
    };

    const createCalendarEvents = (activeFilter) => {
        const events = [];

        const myRequestOffs = requestOffs.filter(
            (r) => r.userId === currentUserId,
        );
        const myUnavailableDates = unavailableDates.filter(
            (u) => u.userId === currentUserId,
        );

        if (activeFilter !== "unavailable" && myRequestOffs) {
            // Group by date so multiple shifts requested off on the same day
            // become a single readable event instead of one per shift
            const requestOffGroups = groupRowsByEmployeeAndDay(
                myRequestOffs,
                "date",
            );

            requestOffGroups.forEach((rowsForDate) => {
                const shiftLabel = summarizeShiftCoverage(
                    rowsForDate,
                    shiftTypes,
                );
                events.push({
                    title: `Requested Off\n${shiftLabel}`,
                    start: rowsForDate[0].date,
                    allDay: true,
                    color: "#e74c3c",
                });
            });
        }
        if (activeFilter !== "requestOff" && myUnavailableDates) {
            // Group by day-of-week so multiple unavailable shifts on the same
            // day become a single readable event instead of one per shift
            const unavailableGroups = groupRowsByEmployeeAndDay(
                myUnavailableDates,
                "dayOfWeek",
            );

            unavailableGroups.forEach((rowsForDay) => {
                const shiftLabel = summarizeShiftCoverage(
                    rowsForDay,
                    shiftTypes,
                );
                events.push({
                    title: `Unavailable\n${shiftLabel}`,
                    daysOfWeek: [rowsForDay[0].dayOfWeek],
                    allDay: true,
                    color: "#f39c12",
                });
            });
        }

        return events;
    };

    useEffect(() => {
        async function fetchUnavailableDates() {
            try {
                const data = await apiRequest("/availability/getUnavailableDates");
                setUnavailableDates(data.weeklyAvailability);
                setRequestOffs(data.specificDates);
            } catch (e) {
                console.error("Error fetching unavailable dates:", e);
            }
        }

        async function fetchShiftTypes() {
            try {
                const data = await apiRequest("/shifts/getShiftTypes");
                console.log(data);
                setShiftTypes(data);
            } catch (e) {
                console.error("Error fetching shift types: ", e);
            }
        }
        async function fetchCurrentUser() {
            try {
                const data = await apiRequest("/auth/me");
                setCurrentUserId(data.userId);
            } catch (e) {
                console.error("Error fetching current user:", e);
            }
        }

        fetchUnavailableDates();
        fetchShiftTypes();
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        setCalendarEvents(createCalendarEvents(filter));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestOffs, unavailableDates, filter, shiftTypes, currentUserId]);

    return (
        <div>
            <Sidebar />
            <Container className="page-container">
                <h1 className="mb-4">Availability</h1>

                <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <Button
                        variant="outline-secondary"
                        onClick={() => setShowSwitchShiftModal(true)}
                    >
                        Switch Shift
                    </Button>
                </div>

                <div className="text-muted small text-uppercase mb-2">
                    Filter
                </div>
                <ButtonGroup className="mb-3">
                    <Button
                        variant={
                            filter === "all" ? "primary" : "outline-primary"
                        }
                        onClick={() => setFilter("all")}
                    >
                        All
                    </Button>
                    <Button
                        variant={
                            filter === "requestOff"
                                ? "danger"
                                : "outline-danger"
                        }
                        onClick={() => setFilter("requestOff")}
                    >
                        Request Offs
                    </Button>
                    <Button
                        variant={
                            filter === "unavailable"
                                ? "warning"
                                : "outline-warning"
                        }
                        onClick={() => setFilter("unavailable")}
                    >
                        Unavailable
                    </Button>
                </ButtonGroup>

                <Calendar
                    events={calendarEvents}
                    handleDateClick={handleDateClick}
                />

                {/* Request Off Modal - triggered by clicking a date */}
                <RequestOffModal
                    show={showRequestOffModal}
                    onHide={() => setShowRequestOffModal(false)}
                    selectedDate={selectedDate}
                    shiftTypes={shiftTypes}
                    onSubmit={handleRequestOffSubmit}
                />

                {/* Switch Shift Modal */}
                <SwitchShiftModal
                    show={showSwitchShiftModal}
                    onHide={() => setShowSwitchShiftModal(false)}
                />
            </Container>
        </div>
    );
}
