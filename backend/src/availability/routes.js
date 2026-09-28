// All endpoints regarding viewing / changing availability
import { Router } from "express";
import { requireAuth, requireManager } from "../auth/middleware.js";
import {
    requestOff,
    adminRequestOff,
    setAvailability,
    getUnavailableDates,
    getEmployeeAvailabilitySummary,
} from "./controller.js";

const router = Router();

router.post("/requestOff", requireAuth, requestOff);
router.post("/adminRequestOff", requireAuth, requireManager, adminRequestOff);
router.post("/setAvailability", requireAuth, requireManager, setAvailability);
router.get("/getUnavailableDates", requireAuth, getUnavailableDates);
router.get("/getEmployeeAvailabilitySummary", requireAuth, requireManager, getEmployeeAvailabilitySummary);

export default router;
