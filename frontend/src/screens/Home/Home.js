import Sidebar from "../../GlobalComponents/Sidebar.js";
import Calendar from "../../GlobalComponents/Calendar.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import { apiRequest } from "../../api/apiHelper.js";

export default function Home() {
    const navigate = useNavigate();

    // All schedule events that will be shown in the calendar
    const [scheduleEvents, setScheduleEvents] = useState([]);

    const [isAuthenticated, setIsAuthenticated] = useState(null);
    // Check to see if user is authenticated, if not redirect to login
    useEffect(() => {
        async function checkAuth() {
            try {
                await apiRequest("/auth/me");
                setIsAuthenticated(true);
            } catch (e) {
                setIsAuthenticated(false);
            }
        }
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        async function fetchScheduleEvents() {
            try {
                const events = await apiRequest(
                    "/scheduleGeneration/getScheduleEvents",
                );
                setScheduleEvents(events);
            } catch (e) {
                console.error("Error fetching schedule events:", e);
            }
        }
        fetchScheduleEvents();
    }, []);

    if (isAuthenticated === null) {
        return (
            <Container
                className="page-container d-flex justify-content-center align-items-center"
                style={{ minHeight: "60vh" }}
            >
                <Spinner animation="border" variant="primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <>
            <Sidebar />
            <Container className="page-container">
                <h1>Welcome Back</h1>
                <h3 className="text-body-secondary fw-normal mb-4">
                    My Schedule
                </h3>
                <Calendar events={scheduleEvents} />
            </Container>
        </>
    );
}
