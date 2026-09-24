import Sidebar from "../../GlobalComponents/Sidebar.js";
import { useState } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { apiRequest } from "../../api/apiHelper.js";
import Table from "react-bootstrap/Table";
import { useEffect } from "react";
import { XLg, Gear } from "react-bootstrap-icons";
import EmployeeSettingsModal from "./components/EmployeeSettingsModal";

export default function AddEmployee() {
    // States for adding new employee
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [position, setPosition] = useState("Manager");
    const [salary, setSalary] = useState("");

    const [employees, setEmployees] = useState([]);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState();

    // Keep global so we can use in onSubmit
    async function getEmployees() {
        try {
            const data = await apiRequest("/employees/getEmployees");
            setEmployees(data);
        } catch (e) {
            console.log("Issue getting employees: ", e.message);
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        try {
            await apiRequest("/employees/createEmployee", "POST", {
                firstName,
                lastName,
                email,
                position,
                salary,
            });
            await getEmployees(); // Update employees
        } catch (e) {
            console.log("Issue submitting form: ", e.message);
        }
    }

    useEffect(() => {
        getEmployees();
    }, []);

    async function onDeleteEmployee(emp) {
        try {
            await apiRequest(`/employees/deleteEmployee/${emp.id}`, "DELETE");
            await getEmployees(); // Update employees
        } catch (e) {
            console.log("Issue deleting employee: ", e.message);
        }
    }

    function onEditEmployee(emp) {
        setCurrentEmployee(emp);
        setSettingsModalOpen(true);
    }

    async function onSaveEmployeeSettings(
        editPosition,
        editSalary,
        editMaxHoursPerWeek,
    ) {
        try {
            await apiRequest(
                `/employees/updateEmployee/${currentEmployee.id}`,
                "PUT",
                {
                    firstName: currentEmployee.firstName,
                    lastName: currentEmployee.lastName,
                    email: currentEmployee.email,
                    position: editPosition,
                    salary: editSalary,
                    maxHoursPerWeek: editMaxHoursPerWeek,
                },
            );
            getEmployees(); // update employees
            setSettingsModalOpen(false);
        } catch (e) {
            console.log("Issue updating employee: ", e.message);
        }
    }

    return (
        <>
            <Sidebar></Sidebar>

            <Container className="page-container">
                <div className="d-flex flex-wrap gap-3 align-items-start">
                    <Card style={{ maxWidth: "32rem" }}>
                        <Card.Body className="p-4">
                            <Card.Title as="h1" className="h3 mb-4">
                                Add Employee
                            </Card.Title>

                            <Form onSubmit={onSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Position</Form.Label>
                                    <Form.Select
                                        value={position}
                                        onChange={(e) =>
                                            setPosition(e.target.value)
                                        }
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Shift Leader">
                                            Shift Leader
                                        </option>
                                        <option value="Employee">
                                            Employee
                                        </option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label>Salary</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={salary}
                                        onChange={(e) =>
                                            setSalary(e.target.value)
                                        }
                                    />
                                </Form.Group>
                                <Button type="submit" variant="primary">
                                    Submit
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <Card style={{ maxWidth: "32rem" }}>
                        <Card.Body className="p-4">
                            <Card.Title as="h1" className="h3 mb-4">
                                Current Employees
                            </Card.Title>
                            <Table striped hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Wage</th>
                                        <th>Position</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => {
                                        return (
                                            <tr key={emp.id}>
                                                <td>
                                                    {emp.firstName}{" "}
                                                    {emp.lastName}
                                                </td>
                                                <td>${emp.salary}</td>
                                                <td>{emp.position}</td>
                                                <td>
                                                    <Gear
                                                        role="button"
                                                        className="me-3"
                                                        onClick={() =>
                                                            onEditEmployee(emp)
                                                        }
                                                    />
                                                    <XLg
                                                        role="button"
                                                        color="red"
                                                        onClick={() =>
                                                            onDeleteEmployee(
                                                                emp,
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </div>

                <EmployeeSettingsModal
                    show={settingsModalOpen}
                    onHide={() => setSettingsModalOpen(false)}
                    employee={currentEmployee}
                    onSave={onSaveEmployeeSettings}
                />
            </Container>
        </>
    );
}
