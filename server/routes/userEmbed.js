import express from "express";
import pool from "../db.js";
import useragent from "express-useragent";

const router = express.Router();

router.use(useragent.express());

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const isDiscord = req.useragent.source.includes("Discordbot");

    try {
        const userResult = await pool.query(
            "SELECT discord_id AS id, username AS name, avatar FROM users WHERE discord_id = $1",
            [id]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = userResult.rows[0];

        const avatarUrl = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discord_id) % 5}.png`;

        const scores = await pool.query(
            `SELECT 
        COUNT(*) FILTER (WHERE defuser_confidence = 'Confident') AS defuser_confident,
        COUNT(*) FILTER (WHERE expert_confidence = 'Confident') AS expert_confident,
        COUNT(*) FILTER (WHERE defuser_confidence = 'Attempted') AS defuser_attempted,
        COUNT(*) FILTER (WHERE expert_confidence = 'Attempted') AS expert_attempted,
        COUNT(*) FILTER (WHERE can_solo) AS solo_count
       FROM user_module_scores
       WHERE user_id = $1`,
            [id]
        );

        const GREEN_CIRCLE = "\u{1F7E2}";
        const YELLOW_CIRCLE = "\u{1F7E1}";

        const {
            defuser_confident = 0,
            expert_confident = 0,
            defuser_attempted = 0,
            expert_attempted = 0,
            solo_count = 0,
        } = scores.rows[0] || {};

        if (isDiscord) {
            const description = `
            Defuser: ${GREEN_CIRCLE} ${defuser_confident} ${YELLOW_CIRCLE} ${defuser_attempted}
            Expert: ${GREEN_CIRCLE} ${expert_confident} ${YELLOW_CIRCLE} ${expert_attempted}
            Can solo: ${solo_count}
            `.trim();

            const html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                <meta property="og:title" content="KTWCS - ${user.name}'s Module Stats" />
                <meta property="og:description" content="${description}" />
                <meta property="og:image" content="${avatarUrl}" />
                <meta property="og:url" content="${process.env.FRONTEND_URL}/profile/${user.id}" />
                <meta name="theme-color" content="#a03500ff" />
                <meta property="og:type" content="profile" />
                <meta property="og:rich_attachment" content="true" />
                </head>
                <body></body>
            </html>
      `;

            res.setHeader("Content-Type", "text/html");
            return res.send(html);
        }

        return res.redirect(`${process.env.FRONTEND_URL}/profile/${user.id}`);
    } catch (err) {
        console.error("Error generating Discord embed:", err.message);
        res.status(500).send("Server error");
    }
});

export default router;