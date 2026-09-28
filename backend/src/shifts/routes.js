import { Router } from "express";
import { requireAuth, requireManager } from "../auth/middleware.js";
import {
    addShiftType,
    removeShiftType,
    addWeeklyShiftRequirement,
    removeWeeklyShiftRequirement,
    addDateShiftRequirement,
    removeDateShiftRequirement,
    getShiftTypes,
    getWeeklyShiftRequirements,
    getSpecificShiftRequirements,
} from "./controller.js";

const router = Router();

router.post("/createShiftType", requireAuth, requireManager, addShiftType);
router.delete("/deleteShiftType/:id", requireAuth, requireManager, removeShiftType);
router.post("/createWeeklyShiftRequirement", requireAuth, requireManager, addWeeklyShiftRequirement);
router.delete("/deleteWeeklyShiftRequirement/:id", requireAuth, requireManager, removeWeeklyShiftRequirement);
router.post("/createDateShiftRequirement", requireAuth, requireManager, addDateShiftRequirement);
router.delete("/deleteDateShiftRequirement/:id", requireAuth, requireManager, removeDateShiftRequirement);
router.get("/getShiftTypes", requireAuth, getShiftTypes);
router.get("/getWeeklyShiftRequirements", requireAuth, requireManager, getWeeklyShiftRequirements);
router.get("/getSpecificShiftRequirements", requireAuth, requireManager, getSpecificShiftRequirements);

export default router;
