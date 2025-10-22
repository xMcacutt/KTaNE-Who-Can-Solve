import { ImageResponse } from "@vercel/og";
import express from "express";
import pool from "../../db.js";

const router = express.Router();

const ICONS = {
  confident: "https://ktanewhocansolve.com/icons/confident.png",
  attempted: "https://ktanewhocansolve.com/icons/attempted.png"
};

router.get("/:id.png", async (req, res) => {
  const { id } = req.params;

  try {
    const userProfileRes = await pool.query(
      "SELECT discord_id AS id, username AS name, avatar FROM users WHERE discord_id = $1",
      [id]
    );
    if (!userProfileRes.rows.length) return res.status(404).send("User not found");

    const userProfile = userProfileRes.rows[0];
    const avatarUrl = row.avatar
      ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(row.discord_id) % 5}.png`;

    const scoresRes = await pool.query(
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

    const userScores = scoresRes.rows[0] || {};
    const defuserConfidentCount = userScores.defuser_confident || 0;
    const expertConfidentCount = userScores.expert_confident || 0;
    const defuserAttemptedCount = userScores.defuser_attempted || 0;
    const expertAttemptedCount = userScores.expert_attempted || 0;
    const soloCount = userScores.solo_count || 0;

    const image = new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            background: "#2b2d31",
            color: "white",
            fontFamily: "Arial, sans-serif",
            display: "flex",
            padding: 50,
            boxSizing: "border-box",
          }}
        >
          <img
            src={avatarUrl}
            width={120}
            height={120}
            style={{ borderRadius: "50%" }}
          />
          <div style={{ marginLeft: 50, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ margin: 0, fontSize: 60 }}>{userProfile.name}</h1>
            <div style={{ marginTop: 20, fontSize: 36, lineHeight: 1.5 }}>
              <div>
                <img src={ICONS.confident} width={32} height={32} /> {defuserConfidentCount} &nbsp;
                <img src={ICONS.attempted} width={32} height={32} /> {defuserAttemptedCount} Defuser
              </div>
              <div>
                <img src={ICONS.confident} width={32} height={32} /> {expertConfidentCount} &nbsp;
                <img src={ICONS.attempted} width={32} height={32} /> {expertAttemptedCount} Expert
              </div>
              <div>
                Can Solo {soloCount}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    res.setHeader("Content-Type", "image/png");
    return image.pipe(res);
  } catch (err) {
    console.error("Discord embed generation error:", err);
    res.status(500).send("Failed to generate Discord embed");
  }
});

export default router;
