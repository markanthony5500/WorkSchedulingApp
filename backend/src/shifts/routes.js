import { Router } from "express";
import { requireAuth, requireManager } from "../auth/middleware.js";
import {
    requestOff,
    setAvailability,
    getUnavailableDates,
    addShiftType,
    removeShiftType,
    addWeeklyShiftRequirement,
    removeWeeklyShiftRequirement,
    addDateShiftRequirement,
    removeDateShiftRequirement,
    getShiftTypes,
    getWeeklyShiftRequirements,
    getSpecificShiftRequirements,
    getEmployeeAvailabilitySummary,
    adminRequestOff,
} from "./controller.js";

const router = Router();

router.post("/requestOff", requireAuth, requestOff);
router.post("/adminRequestOff", requireAuth, requireManager, adminRequestOff);
router.post("/setAvailability", requireAuth, requireManager, setAvailability);
router.get("/getUnavailableDates", requireAuth, getUnavailableDates);
router.post("/createShiftType", requireAuth, requireManager, addShiftType);
router.delete(
    "/deleteShiftType/:id",
    requireAuth,
    requireManager,
    removeShiftType,
);
router.post(
    "/createWeeklyShiftRequirement",
    requireAuth,
    requireManager,
    addWeeklyShiftRequirement,
);
router.delete(
    "/deleteWeeklyShiftRequirement/:id",
    requireAuth,
    requireManager,
    removeWeeklyShiftRequirement,
);
router.post(
    "/createDateShiftRequirement",
    requireAuth,
    requireManager,
    addDateShiftRequirement,
);
router.delete(
    "/deleteDateShiftRequirement/:id",
    requireAuth,
    requireManager,
    removeDateShiftRequirement,
);
router.get("/getShiftTypes", requireAuth, getShiftTypes);
router.get(
    "/getWeeklyShiftRequirements",
    requireAuth,
    requireManager,
    getWeeklyShiftRequirements,
);
router.get(
    "/getSpecificShiftRequirements",
    requireAuth,
    requireManager,
    getSpecificShiftRequirements,
);
router.get(
    "/getEmployeeAvailabilitySummary",
    requireAuth,
    requireManager,
    getEmployeeAvailabilitySummary,
);

export default router;
