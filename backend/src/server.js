import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { initDB } from "./db/init.js";
import { addMockData, clearExistingMockData } from "./db/mockData.js";

import authRoutes from "./auth/routes.js";
import shiftRoutes from "./shifts/routes.js";
import availabilityRoutes from "./availability/routes.js";
import scheduleRoutes from "./schedule/routes.js";
import employeeRoutes from "./employees/routes.js";

const app = express();
const PORT = 5000;

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/shifts", shiftRoutes);
app.use("/availability", availabilityRoutes);
app.use("/scheduleGeneration", scheduleRoutes);
app.use("/employees", employeeRoutes);

app.get("/api/test", (req, res) => {
    res.json({ message: "API is working" });
});

app.listen(PORT, async () => {
    console.log("Server is running on port: " + PORT);

    try {
        await initDB();

        // Determines if we should seed the mock data on server start, mostly for testing purposes
        if (process.env.SEED_MOCK_DATA !== "false") {
            await clearExistingMockData();
            await addMockData();
        }
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
});
