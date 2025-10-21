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
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;

    const scores = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE defuser_confidence = 'Confident') AS defuser_confident,
         COUNT(*) FILTER (WHERE expert_confidence = 'Confident') AS expert_confident
       FROM user_module_scores
       WHERE user_id = $1`,
      [id]
    );

    const defuserConfident = scores.rows[0].defuser_confident || 0;
    const expertConfident = scores.rows[0].expert_confident || 0;

    if (isDiscord) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta property="og:title" content="${user.name}'s stats" />
            <meta property="og:description" content="Defuser: ${defuserConfident} confident • Expert: ${expertConfident} confident" />
            <meta property="og:image" content="${avatarUrl}" />
            <meta property="og:url" content="${process.env.FRONTEND_URL}/profile/${user.id}" />
            <meta name="theme-color" content="#5865F2" />
          </head>
          <body></body>
        </html>
      `;
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/profile/${user.id}`);
  } catch (err) {
    console.error("Error generating OG meta:", err.message);
    res.status(500).send("Server error");
  }
});

export default router;
