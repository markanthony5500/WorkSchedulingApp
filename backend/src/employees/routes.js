import { Router } from "express";
import { requireAuth, requireManager } from "../auth/middleware.js";
import {
    getEmployees,
    createEmployee,
    deleteEmployee,
    updateEmployee,
} from "./controller.js";

const router = Router();

// Every employee route is manager only 
router.use(requireAuth, requireManager);

router.get("/getEmployees", getEmployees);
router.post("/createEmployee", createEmployee);
router.delete("/deleteEmployee/:id", deleteEmployee);
router.put("/updateEmployee/:id", updateEmployee);

export default router;
