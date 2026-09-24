import Sidebar from "../../GlobalComponents/Sidebar.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { apiRequest } from "../../api/apiHelper.js";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function handleDevLogin(e) {
        e.preventDefault();
        try {
            const data = await apiRequest("/auth/devlogin", "POST", {
                username: "dev",
            });
            console.log("Dev login successful:", data);
            // Navigate to home page
            navigate("/");
        } catch (e) {
            console.error("Error during dev login:", e);
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        try {
            const data = await apiRequest("/auth/login", "POST", {
                username,
                password,
            });
            console.log("Login successful:", data);
            // Navigate to home page
            navigate("/");
        } catch (e) {
            console.error("Error during login:", e);
        }
    }

    return (
        <>
            <Sidebar />
            <Container
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ minHeight: "100vh" }}
            >
                <h1 className="h3 mb-4 text-center">Work Scheduler</h1>
                <Card style={{ width: "24rem" }} className="shadow-sm">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h4 mb-4 text-center">
                            Login
                        </Card.Title>

                        <Form onSubmit={handleLogin}>
                            <Form.Group className="mb-3">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </Form.Group>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-100"
                            >
                                Login
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
                <Button
                    onClick={handleDevLogin}
                    variant="link"
                    size="sm"
                    className="text-muted mt-3"
                >
                    Dev Login
                </Button>
            </Container>
        </>
    );
}
