import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import {
    generateSchedule,
    getScheduleEvents,
    validateSchedule,
    finalizeSchedule,
    eligibleEmployees,
    eligibleShiftTypes,
} from "./controller.js";

const router = Router();

router.post("/generateSchedule", requireAuth, generateSchedule);
router.get("/getScheduleEvents", requireAuth, getScheduleEvents);
router.post("/validateSchedule", requireAuth, validateSchedule);
router.post("/finalizeSchedule", requireAuth, finalizeSchedule);
router.post("/eligibleEmployees", requireAuth, eligibleEmployees);
router.post("/eligibleShiftTypes", requireAuth, eligibleShiftTypes);

export default router;
