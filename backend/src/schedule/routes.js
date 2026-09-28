import { Router } from "express";
import { requireAuth, requireManager } from "../auth/middleware.js";
import {
    generateSchedule,
    getScheduleEvents,
    validateSchedule,
    finalizeSchedule,
    eligibleEmployees,
    eligibleShiftTypes,
} from "./controller.js";

const router = Router();

router.post("/generateSchedule", requireAuth, requireManager, generateSchedule);
router.get("/getScheduleEvents", requireAuth, getScheduleEvents);
router.post("/validateSchedule", requireAuth, requireManager, validateSchedule);
router.post("/finalizeSchedule", requireAuth, requireManager, finalizeSchedule);
router.post(
    "/eligibleEmployees",
    requireAuth,
    requireManager,
    eligibleEmployees,
);
router.post(
    "/eligibleShiftTypes",
    requireAuth,
    requireManager,
    eligibleShiftTypes,
);

export default router;
