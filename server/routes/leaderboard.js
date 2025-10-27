import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const search = req.query.search?.toLowerCase() || "";
        const sort = req.query.sort?.toLowerCase() || "combined";

        const validSorts = ["defuser", "expert", "solo", "combined"];
        const sortBy = validSorts.includes(sort) ? sort : "combined";

        const query = `
      WITH user_scores AS (
        SELECT
          u.discord_id AS id,
          u.username AS name,
          u.avatar AS avatar,
          COUNT(*) FILTER (WHERE s.defuser_confidence = 'Unknown') AS defuser_unknown,
          COUNT(*) FILTER (WHERE s.defuser_confidence = 'Confident') AS defuser_confident,
          COUNT(*) FILTER (WHERE s.defuser_confidence = 'Attempted') AS defuser_attempted,
          COUNT(*) FILTER (WHERE s.defuser_confidence = 'Avoid') AS defuser_avoid,
          COUNT(*) FILTER (WHERE s.expert_confidence = 'Unknown') AS expert_unknown,
          COUNT(*) FILTER (WHERE s.expert_confidence = 'Confident') AS expert_confident,
          COUNT(*) FILTER (WHERE s.expert_confidence = 'Attempted') AS expert_attempted,
          COUNT(*) FILTER (WHERE s.expert_confidence = 'Avoid') AS expert_avoid,
          COUNT(*) FILTER (WHERE s.can_solo) AS solo_count,

          -- Defuser Score
          COALESCE(SUM(
            CASE s.defuser_confidence WHEN 'Confident' THEN
              CASE m.defuser_difficulty
                WHEN 'Trivial' THEN 1 WHEN 'Easy' THEN 5
                WHEN 'Medium' THEN 15 WHEN 'Hard' THEN 30
                WHEN 'Very Hard' THEN 50 WHEN 'Extreme' THEN 75
                ELSE 0 END
            ELSE 0 END
          ), 0) AS defuser_score,

          -- Expert Score
          COALESCE(SUM(
            CASE s.expert_confidence WHEN 'Confident' THEN
              CASE m.expert_difficulty
                WHEN 'Trivial' THEN 1 WHEN 'Easy' THEN 5
                WHEN 'Medium' THEN 15 WHEN 'Hard' THEN 30
                WHEN 'Very Hard' THEN 50 WHEN 'Extreme' THEN 75
                ELSE 0 END
            ELSE 0 END
          ), 0) AS expert_score,

          -- Solo Score
          COALESCE(SUM(CASE WHEN s.can_solo THEN 40 ELSE 0 END), 0) AS solo_score

        FROM users u
        LEFT JOIN user_module_scores s ON u.discord_id = s.user_id
        LEFT JOIN modules m ON s.module_id = m.module_id
        WHERE LOWER(u.username) LIKE $1 OR LOWER(u.discord_id) LIKE $1
        GROUP BY u.discord_id, u.username, u.avatar
      )
      SELECT *,
        (defuser_score + expert_score + solo_score) AS combined_score
      FROM user_scores
      ORDER BY
        CASE WHEN $2 = 'defuser' THEN defuser_score END DESC,
        CASE WHEN $2 = 'expert' THEN expert_score END DESC,
        CASE WHEN $2 = 'solo' THEN solo_score END DESC,
        CASE WHEN $2 = 'combined' THEN (defuser_score + expert_score + solo_score) END DESC
      LIMIT 100;
    `;

        const result = await pool.query(query, [`%${search}%`, sortBy]);

        const users = result.rows.map((row, index) => {
            const avatarUrl = row.avatar
                ? `https://cdn.discordapp.com/avatars/${row.id}/${row.avatar}.png?size=256`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(row.id) % 5}.png`;

            return {
                id: row.id,
                name: row.name,
                defuser_unknown: row.defuser_unknown,
                defuser_confident: row.defuser_confident,
                defuser_attempted: row.defuser_attempted,
                defuser_avoid: row.defuser_avoid,
                expert_unknown: row.expert_unknown,
                expert_confident: row.expert_confident,
                expert_attempted: row.expert_attempted,
                expert_avoid: row.expert_avoid,
                defuser_score: row.defuser_score,
                expert_score: row.expert_score,
                solo_score: row.solo_score,
                solo_count: row.solo_count,
                combined_score: row.combined_score,
                rank: index + 1,
                avatar: avatarUrl,
            };
        });

        res.json(users);
    } catch (error) {
        console.error("Error fetching leaderboard:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;