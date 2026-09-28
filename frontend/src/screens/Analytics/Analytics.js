// Just shows all employee availability for now, plan to add much more here later
import Sidebar from "../../GlobalComponents/Sidebar";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import { useState } from "react";
import { apiRequest } from "../../api/apiHelper";
import EmployeeAvailabilityModal from "./components/EmployeeAvailabilityModal";

export default function Analytics() {
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    async function handleOpen() {
        setShowModal(true);
        setLoading(true);
        try {
            const [employeeData, shiftTypeData] = await Promise.all([
                apiRequest("/availability/getEmployeeAvailabilitySummary"),
                apiRequest("/shifts/getShiftTypes"),
            ]);
            setEmployees(employeeData);
            setShiftTypes(shiftTypeData);
        } catch (e) {
            console.error("Error fetching employee availability:", e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Sidebar />
            <Container className="page-container">
                <h1 className="mb-1">Analytics</h1>
                <p className="text-muted mb-4">
                    Reporting on employee availability and scheduling coverage.
                </p>

                <Button variant="primary" onClick={handleOpen}>
                    View Employee Availability
                </Button>

                <EmployeeAvailabilityModal
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    employees={employees}
                    shiftTypes={shiftTypes}
                    loading={loading}
                />
            </Container>
        </div>
    );
}
