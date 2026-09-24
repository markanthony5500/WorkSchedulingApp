import { Router } from "express";
import requireAuth from "../auth/requireAuth.js";
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
router.post("/adminRequestOff", requireAuth, adminRequestOff);
router.post("/setAvailability", requireAuth, setAvailability);
router.get("/getUnavailableDates", requireAuth, getUnavailableDates);
router.post("/createShiftType", requireAuth, addShiftType);
router.delete("/deleteShiftType/:id", requireAuth, removeShiftType);
router.post(
    "/createWeeklyShiftRequirement",
    requireAuth,
    addWeeklyShiftRequirement,
);
router.delete(
    "/deleteWeeklyShiftRequirement/:id",
    requireAuth,
    removeWeeklyShiftRequirement,
);
router.post(
    "/createDateShiftRequirement",
    requireAuth,
    addDateShiftRequirement,
);
router.delete(
    "/deleteDateShiftRequirement/:id",
    requireAuth,
    removeDateShiftRequirement,
);
router.get("/getShiftTypes", requireAuth, getShiftTypes);
router.get(
    "/getWeeklyShiftRequirements",
    requireAuth,
    getWeeklyShiftRequirements,
);
router.get(
    "/getSpecificShiftRequirements",
    requireAuth,
    getSpecificShiftRequirements,
);
router.get(
    "/getEmployeeAvailabilitySummary",
    requireAuth,
    getEmployeeAvailabilitySummary,
);

export default router;
