import express from "express";
import pool from "../db.js";
import multer from "multer";
import fs from "fs";
import axios from "axios";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.put("/:moduleId", async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        const userId = req.user.discord_id;
        const { moduleId } = req.params;
        const { defuserConfidence, expertConfidence, canSolo } = req.body;
        const query = `
            INSERT INTO user_module_scores (user_id, module_id, defuser_confidence, expert_confidence, can_solo)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, module_id)
            DO UPDATE SET
                defuser_confidence = EXCLUDED.defuser_confidence,
                expert_confidence = EXCLUDED.expert_confidence,
                can_solo = EXCLUDED.can_solo
            RETURNING *;
        `;
        const result = await pool.query(query, [
            userId,
            moduleId,
            defuserConfidence,
            expertConfidence,
            canSolo
        ]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating score:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/", async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        const userId = req.user.discord_id;
        const scores = await pool.query(
            "SELECT module_id, defuser_confidence, expert_confidence, can_solo FROM user_module_scores WHERE user_id = $1",
            [userId]
        );
        res.json(scores.rows);
    } catch (error) {
        console.error("Error fetching scores:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const { type, role, logUrl } = req.body;
        if (!type || !["profile", "log"].includes(type)) {
            return res.status(400).json({ error: "Invalid upload type." });
        }
        if (!role || !["defuser", "expert", "both", "solo"].includes(role)) {
            return res.status(400).json({ error: "Invalid role." });
        }

        if (type === "log" && !req.file && !logUrl) {
            return res.status(400).json({ error: "No log provided (file or link)." });
        }

        let fileContent;
        if (req.file) {
            fileContent = fs.readFileSync(req.file.path, "utf8");
            fs.unlinkSync(req.file.path);
        } else if (logUrl) {
            const match = logUrl.match(/file=([a-f0-9]+)/);
            if (!match) {
                return res.status(400).json({ error: "Invalid log URL format." });
            }
            const logFileId = match[1];
            const logTxtUrl = `https://ktane.timwi.de/Logfiles/${logFileId}.txt`;

            const response = await axios.get(logTxtUrl);
            fileContent = response.data;
        }

        const userId = req.user.discord_id;

        if (type === "profile") {
            let parsed;
            try {
                parsed = JSON.parse(fileContent);
            } catch (e) {
                return res.status(400).json({ error: "Invalid JSON file uploaded." });
            }

            if (!Array.isArray(parsed.EnabledList)) {
                return res.status(400).json({ error: "Profile JSON must contain an 'EnabledList' array." });
            }

            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                for (const moduleId of parsed.EnabledList) {
                    if (role === "defuser" || role === "both") {
                        await client.query(`
                            INSERT INTO user_module_scores (user_id, module_id, defuser_confidence)
                            SELECT $1, $2, $3
                            WHERE EXISTS (SELECT 1 FROM modules WHERE module_id = $2)
                            ON CONFLICT (user_id, module_id)
                            DO UPDATE SET
                                defuser_confidence = EXCLUDED.defuser_confidence;
                        `, [userId, moduleId, "Confident"]);
                    }

                    if (role === "expert" || role === "both") {
                        await client.query(`
                            INSERT INTO user_module_scores (user_id, module_id, expert_confidence)
                            SELECT $1, $2, $3
                            WHERE EXISTS (SELECT 1 FROM modules WHERE module_id = $2)
                            ON CONFLICT (user_id, module_id)
                            DO UPDATE SET
                                expert_confidence = EXCLUDED.expert_confidence;
                        `, [userId, moduleId, "Confident"]);
                    }
                    if (role === "solo") {
                        await client.query(`
                            INSERT INTO user_module_scores (user_id, module_id, defuser_confidence, expert_confidence, can_solo)
                            SELECT $1, $2, $3, $4, $5
                            WHERE EXISTS (SELECT 1 FROM modules WHERE module_id = $2)
                            ON CONFLICT (user_id, module_id)
                            DO UPDATE SET
                                defuser_confidence = EXCLUDED.defuser_confidence,
                                expert_confidence = EXCLUDED.expert_confidence,
                                can_solo = EXCLUDED.can_solo
                        `, [userId, moduleId, "Confident", "Confident", true]);
                    }
                }

                await client.query("COMMIT");
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
        }

        if (type === "log") {
            const lines = fileContent.split("\n");
            const entries = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line === "[Tweaks] LFAEvent 1" && lines[i + 1]) {
                    const jsonLine = lines[i + 1].trim();
                    if (jsonLine.startsWith("{") && jsonLine.endsWith("}")) {
                        try {
                            const event = JSON.parse(jsonLine);
                            if (event.type === "PASS" || event.type === "STRIKE") {
                                entries.push(event);
                            }
                        } catch (err) {
                            console.warn("Invalid JSON event:", jsonLine);
                        }
                    }
                }
            }

            const moduleStatus = {};
            for (const entry of entries) {
                const moduleId = entry.moduleID;
                if (!moduleStatus[moduleId]) {
                    moduleStatus[moduleId] = entry.type === "STRIKE" ? "Attempted" : "Confident";
                } else {
                    if (entry.type === "STRIKE") {
                        moduleStatus[moduleId] = "Attempted";
                    }
                }
            }

            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                for (const [moduleId, confidence] of Object.entries(moduleStatus)) {
                    if (role === "defuser" || role === "both") {
                        await client.query(
                            `
                                INSERT INTO user_module_scores (user_id, module_id, defuser_confidence)
                                SELECT $1, $2, $3
                                WHERE EXISTS (SELECT 1 FROM modules WHERE module_id = $2)
                                ON CONFLICT (user_id, module_id)
                                DO UPDATE SET
                                    defuser_confidence = CASE
                                        WHEN user_module_scores.defuser_confidence = 'Confident' AND EXCLUDED.defuser_confidence = 'Attempted'
                                            THEN 'Confident'
                                        ELSE EXCLUDED.defuser_confidence
                                    END;
                            `,
                            [userId, moduleId, confidence]
                        );
                    }
                    if (role === "expert" || role === "both") {
                        await client.query(
                            `
                                INSERT INTO user_module_scores (user_id, module_id, expert_confidence)
                                SELECT $1, $2, $3
                                WHERE EXISTS (SELECT 1 FROM modules WHERE module_id = $2)
                                ON CONFLICT (user_id, module_id)
                                DO UPDATE SET
                                    expert_confidence = CASE
                                        WHEN user_module_scores.expert_confidence = 'Confident' AND EXCLUDED.expert_confidence = 'Attempted'
                                            THEN 'Confident'
                                        ELSE EXCLUDED.expert_confidence
                                    END;
                            `,
                            [userId, moduleId, confidence]
                        );
                    }
                }

                await client.query("COMMIT");
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
        }

        res.json({ message: `${type} uploaded successfully.` });
    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(500).json({ error: "Server failed to process upload." });
    }
});

export default router;