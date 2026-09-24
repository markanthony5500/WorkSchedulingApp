import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/custom-bootstrap.scss";
import "./styles/app.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import Home from "./screens/Home/Home";
import Availability from "./screens/Availability/Availability";
import AddEmployee from "./screens/AddEmployee/AddEmployee";
import Login from "./screens/Login/Login";
import GenerateSchedule from "./screens/GenerateSchedule/GenerateSchedule";
import Analytics from "./screens/Analytics/Analytics";
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/availability" element={<Availability />} />
                <Route path="/requestOff" element={<Availability />} />
                <Route path="/switchShift" element={<Availability />} />
                <Route path="/addEmployee" element={<AddEmployee />} />
                <Route path="/login" element={<Login />} />
                <Route
                    path="/generateSchedule"
                    element={<GenerateSchedule />}
                />
                <Route path="/analytics" element={<Analytics />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
);
