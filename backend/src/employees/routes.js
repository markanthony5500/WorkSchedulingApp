import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import {
    getEmployees,
    createEmployee,
    deleteEmployee,
    updateEmployee,
} from "./controller.js";

const router = Router();

router.get("/getEmployees", requireAuth, getEmployees);
router.post("/createEmployee", requireAuth, createEmployee);
router.delete("/deleteEmployee/:id", requireAuth, deleteEmployee);
router.put("/updateEmployee/:id", requireAuth, updateEmployee);

export default router;
