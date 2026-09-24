// All functions for auth purposes
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
    getUserByUsername,
    createUser,
    createSession,
    deleteSessionByToken,
} from "./repository.js";

export async function loginUser(req, res) {
    try {
        const { username, password } = req.body;

        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        if (!user.isActive) {
            return res
                .status(403)
                .json({ error: "This account is no longer active" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid password" });
        }

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Session expires in 1 hour

        await createSession(user.id, token, expiresAt);

        res.cookie("session", token, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "lax",
            expires: expiresAt,
        });
        return res.status(200).json({ message: "Login successful" });
    } catch (e) {
        console.error("Error in loginUser:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function logoutUser(req, res) {
    try {
        const token = req.cookies.session;

        if (token) {
            await deleteSessionByToken(token);
            res.clearCookie("session");
        }

        return res.status(200).json({ message: "Logout successful" });
    } catch (e) {
        console.error("Error in logoutUser:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// For testing purposes
export async function loginDev(req, res) {
    try {
        const { username } = req.body;

        let user = await getUserByUsername(username);

        if (!user) {
            const passwordHash = await bcrypt.hash("devpassword", 10);
            await createUser({
                firstName: "Dev",
                lastName: "User",
                email: `dev@example.com`,
                passwordHash,
                position: "Developer",
                salary: 0,
                username,
            });
            user = await getUserByUsername(username);
        }

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Session expires in 1 hour

        await createSession(user.id, token, expiresAt);

        res.cookie("session", token, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "lax",
            expires: expiresAt,
        });
        return res.status(200).json({ message: "Dev login successful" });
    } catch (e) {
        console.error("Error in loginDev:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
