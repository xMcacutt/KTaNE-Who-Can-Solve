import express from "express";
import pool from "../db.js";
import useragent from "express-useragent";

const router = express.Router();

router.use(useragent.express());

const ICONS = {
  confident: `${process.env.FRONTEND_URL}/icons/confident.png`,
  attempted: `${process.env.FRONTEND_URL}/icons/attempted.png`,
};

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

    const {
      defuser_confident = 0,
      expert_confident = 0,
      defuser_attempted = 0,
      expert_attempted = 0,
      solo_count = 0,
    } = scores.rows[0];

    if (isDiscord) {
      const description = `
        <b>Defuser</b>:
          <img src="${ICONS.confident}" width="16" height="16"/> ${defuser_confident} 
          <img src="${ICONS.attempted}" width="16" height="16"/> ${defuser_attempted}

        <b>Expert</b>:
          <img src="${ICONS.confident}" width="16" height="16"/> ${expert_confident} 
          <img src="${ICONS.attempted}" width="16" height="16"/> ${expert_attempted}
        <b>Can Solo:</b> ${solo_count}
      `.trim();
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta property="og:title" content="${user.name}" />
            <meta property="og:description" content="Module Stats" />
            <meta property="og:image" content="${avatarUrl}" />
            <meta property="og:url" content="${process.env.FRONTEND_URL}/profile/${user.id}" />
            <meta name="theme-color" content="#a03500ff" />
            <meta property="og:type" content="profile" />
            <meta property="og:rich_attachment" content="true" />
          </head>
          <body style="background:#2b2d31;color:white;font-family:Arial;padding:20px;">
            <div style="display:flex;align-items:center;gap:16px;">
              <img src="${avatarUrl}" width="80" height="80" style="border-radius:50%;" />
              <div>
                <h2 style="margin:0;">${user.name}</h2>
                <div style="margin-top:8px;line-height:1.6;font-size:15px;">
                  ${description}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }  

    return res.redirect(`${ process.env.FRONTEND_URL } /profile/${ user.id } `);
  } catch (err) {
    console.error("Error generating OG meta:", err.message);
    res.status(500).send("Server error");
  }
});

export default router;
