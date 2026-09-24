// Middleware to protect routes that require authentication
import pool from "../db/db.js";

/** Going to use this on any route that requires a logged in user
Ex:
   router.get("/protected-route", requireAuth, (req, res) => {
       // If we reach here, user is authenticated
  });
*/

export default async function requireAuth(req, res, next) {
    try {
        // Does token exist?
        const token = req.cookies.session;

        if (!token) {
            return res
                .status(401)
                .json({ error: "Authentication Token Not Found" });
        }

        // Does session data exist for this token?
        const currentSession = await getSessionByToken(token);

        if (!currentSession) {
            return res.status(401).json({ error: "Invalid Session Token" });
        }

        // Is session expired?
        if (new Date(currentSession.expiresAt) < new Date()) {
            await pool.query("DELETE FROM Sessions WHERE id = ?", [
                currentSession.sessionId,
            ]);
            res.clearCookie("session");
            return res.status(401).json({ error: "Session Expired" });
        }

        // Store user info in request object for use in route handler
        req.user = {
            id: currentSession.userId,
        };

        // next() changes controll to the next function in the request chain
        next();
    } catch (e) {
        console.error("requireAuth error:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getSessionByToken(token) {
    const [rows] = await pool.query(
        `
		SELECT
			s.id as sessionId,
			s.expiresAt,
			u.id AS userId
		FROM Sessions s
		JOIN Users u ON u.id = s.userId
		WHERE s.token = ?
		LIMIT 1
		`,
        [token],
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}
