import express from "express";
import pool from "../db.js";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT discord_id AS id, username AS name, avatar FROM users WHERE discord_id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = result.rows[0];
        let avatarUrl;
        if (user.avatar) {
            avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        } else {
            const defaultAvatar = parseInt(user.id) % 5;
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
        }
        res.json({ ...user, avatar: avatarUrl });
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/:id/scores", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT module_id, defuser_confidence, expert_confidence, can_solo FROM user_module_scores WHERE user_id = $1",
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user scores:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:id/delete", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM users WHERE discord_id = $1", [id]);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/:id/download", async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query(
            `
            SELECT module_id, defuser_confidence, expert_confidence
            FROM user_module_scores
            WHERE user_id = $1
            `,
            [userId]
        );

        const enabled = new Set();
        const disabled = new Set();

        for (const row of result.rows) {
            if (row.expert_confidence === "Avoid") {
                disabled.add(row.module_id);
            } else if (row.expert_confidence === "Attempted" || row.expert_confidence === "Confident") {
                enabled.add(row.module_id);
            }
        }

        const profileObj = {
            EnabledList: Array.from(enabled),
            DisabledList: Array.from(disabled),
            Operation: 0,
        };

        const filename = `profile_${userId}.json`;

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(profileObj, null, 2));
    } catch (err) {
        console.error("Download profile error:", err);
        res.status(500).json({ error: "Failed to generate profile download." });
    }
});

router.get("/:auth_id/favourites", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const discordId = req.params.auth_id;

    var userResult = await pool.query(
        `
        SELECT id FROM users WHERE discord_id = $1
        `,
        [discordId]
    )

    if (userResult.rowCount === 0) {
        return res.status(400).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;
    try {
        const result = await pool.query(
            `
            SELECT b.*
            FROM bombs b
            JOIN user_favourites uf ON b.bomb_id = uf.bomb_id
            WHERE uf.user_id = $1
            `,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error getting favourite bombs:", err);
        res.status(500).json({ error: "Error getting favourite bombs." });
    }
});

router.put("/:auth_id/:mission_id/favourites", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const discordId = req.params.auth_id;
    const missionId = req.params.mission_id;
    const { isFavourite } = req.body;

    var userResult = await pool.query(
        `
        SELECT id FROM users WHERE discord_id = $1
        `,
        [discordId]
    )

    if (userResult.rowCount === 0) {
        return res.status(400).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    try {
        if (isFavourite) {
            await pool.query(
                `
                INSERT INTO user_favourites (user_id, bomb_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id, bomb_id)
                DO NOTHING;
                `,
                [userId, missionId]
            );
        }
        else {
            await pool.query(
                `
                DELETE FROM user_favourites WHERE user_id = $1 AND bomb_id = $2
                `,
                [userId, missionId]
            )
        }
        res.json({ message: "Favourite updated successfully" });
    } catch (err) {
        console.error("Error updating favourites:", err);
        res.status(500).json({ error: "Error updating favourites." });
    }
});

export default router;