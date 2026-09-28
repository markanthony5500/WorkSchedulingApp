// Used for sidebar navigation in the app
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import { List } from "react-bootstrap-icons";
import { apiRequest } from "../api/apiHelper.js";
import { useAuth } from "./RouteGuards/AuthContext.js";
export default function Sidebar() {
    // Current user info
    const {user, setUser} = useAuth();

    // State to control sidebar visibility
    const [show, setShow] = useState(false);
    const navigate = useNavigate();

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    async function handleLogout() {
        try {
            await apiRequest("/auth/logout", "POST");
        } catch (e) {
            console.error("Error during logout:", e);
        }

        setUser(null);
        navigate("/login");
    }

    return (
        <>
            <Button
                variant="primary"
                onClick={handleShow}
                className="sidebar-toggle rounded-circle shadow"
                aria-label="Open navigation menu"
            >
                <List size={20} />
            </Button>

            <Offcanvas show={show} onHide={handleClose} placement="start">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Work Scheduler</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <Nav
                        variant="pills"
                        className="sidebar-nav flex-column gap-2"
                    >
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="/availability">Availability</Nav.Link>
                        {/* Manager Only options */}
                        {
                            user?.position === "Manager" && (
                                <>
                                    <Nav.Link href="/generateSchedule">Generate Schedule</Nav.Link>
                                    <Nav.Link href="/manageRequests">Manage Requests</Nav.Link>
                                    <Nav.Link href="/analytics">Analytics Tool</Nav.Link>
                                    <Nav.Link href="/addEmployee">Add Employee</Nav.Link>
                                </>
                            )
                        }

                    </Nav>

                    <Button variant="danger" className="mt-auto" onClick={handleLogout}>
                        Logout
                    </Button>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}
