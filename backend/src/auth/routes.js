import { Router } from "express";
import requireAuth from "./requireAuth.js";
import { loginUser, logoutUser, loginDev } from "./controller.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
    res.json({ authenticated: true, userId: req.user.id });
});

router.post("/login", loginUser);

router.post("/logout", logoutUser);

if (process.env.NODE_ENV !== "production") {
    router.post("/devlogin", loginDev);
}

export default router;
