import express from "express";
import pool from "../db.js";

const router = express.Router();

const fetchMissions = async (req) => {

    const { search, sort = "date_added", order = "descending", pack, author, discordId: queryDiscordId } = req.query;
    const { team, discordId: bodyDiscordId } = req.body || {};
    const discordId = bodyDiscordId || queryDiscordId;
    const orderQuery = order.toLowerCase() === "ascending" ? "ASC" : "DESC";

    let conditions = [];
    let values = [];
    let idx = 1;

    if (search) {
        conditions.push(`(
      LOWER(mission_name) LIKE $${idx} OR
      LOWER(in_game_name) LIKE $${idx} OR
      EXISTS (SELECT 1 FROM unnest(authors) a WHERE LOWER(a) LIKE $${idx})
    )`);
        values.push(`%${search.toLowerCase()}%`);
        idx++;
    }

    if (pack) {
        conditions.push(`LOWER(pack_name) = $${idx}`);
        values.push(pack.toLowerCase());
        idx++;
    }

    if (author) {
        conditions.push(`EXISTS (SELECT 1 FROM unnest(authors) a WHERE LOWER(a) LIKE $${idx})`);
        values.push(author.toLowerCase());
        idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let missionsQuery = `
    SELECT id, pack_name, mission_name, in_game_name, authors, date_added, bombs, factory, difficulty
    FROM missions
    ${whereClause}
  `;
    let result = await pool.query(missionsQuery, values);
    let missions = result.rows;

    if (sort === "known_modules") {
        if (!team || !Array.isArray(team) || team.length === 0) {
            throw new Error("Missing or invalid team data for known_modules sort");
        }

        const userIds = team.map((u) => u.id);
        const userScoresRes = await pool.query(
            `
        SELECT user_id, module_id, defuser_confidence, expert_confidence
        FROM user_module_scores
        WHERE user_id = ANY($1);
      `,
            [userIds]
        );
        const userScores = userScoresRes.rows;

        const scoresByUser = userScores.reduce((acc, s) => {
            if (!acc[s.user_id]) acc[s.user_id] = [];
            acc[s.user_id].push(s);
            return acc;
        }, {});

        missions = missions.map((mission) => {
            let bombs;
            try {
                bombs = Array.isArray(mission.bombs)
                    ? mission.bombs
                    : JSON.parse(mission.bombs || "[]");
            } catch {
                bombs = [];
            }

            const uniqueModuleIds = [
                ...new Set(
                    bombs.flatMap((b) => b.pools?.flatMap((p) => p.modules.map((m) =>
                        typeof m === "string" ? m : m.module_id || m.id
                    )) || [])
                ),
            ];

            if (uniqueModuleIds.length === 0) {
                return { ...mission, known_percentage: 0 };
            }

            let defuserScore = 0;
            let expertTotal = 0;
            let expertCount = 0;

            for (const user of team) {
                const userModuleScores = scoresByUser[user.id] || [];
                const knownModules = uniqueModuleIds.filter((modId) => {
                    const s = userModuleScores.find((sc) => sc.module_id === modId);
                    if (!s) return false;
                    const conf = user.isDefuser ? s.defuser_confidence : s.expert_confidence;
                    return conf === "Confident" || conf === "Attempted";
                }).length;

                const percentKnown = knownModules / uniqueModuleIds.length;

                if (user.isDefuser) {
                    defuserScore = percentKnown;
                } else {
                    expertTotal += percentKnown;
                    expertCount++;
                }
            }

            const avgExpert = expertCount > 0 ? expertTotal / expertCount : 0;
            const weightedAverage = defuserScore * 0.6 + avgExpert * 0.4;

            return { ...mission, known_percentage: weightedAverage };
        });

        missions.sort((a, b) =>
            orderQuery === "ASC"
                ? a.known_percentage - b.known_percentage
                : b.known_percentage - a.known_percentage
        );
    } else {
        let orderByClause = "";
        switch (sort) {
            case "difficulty":
                orderByClause = `ORDER BY difficulty ${orderQuery}`;
                break;
            case "mission_name":
                orderByClause = `ORDER BY mission_name ${orderQuery}`;
                break;
            case "date_added":
            default:
                orderByClause = `ORDER BY date_added ${orderQuery}`;
                break;
        }

        const query = `${missionsQuery} ${orderByClause};`;
        const result2 = await pool.query(query, values);
        missions = result2.rows;
    }

    if (discordId) {
        const userResult = await pool.query(
            `SELECT id FROM users WHERE discord_id = $1`,
            [discordId]
        );

        if (userResult.rowCount === 0) {
            throw new Error("User not found");
        }

        const userId = userResult.rows[0].id;
        const favouritesRes = await pool.query(
            'SELECT bomb_id FROM user_favourites WHERE user_id = $1',
            [userId]
        );
        const favouriteBombIds = favouritesRes.rows.map((f) => f.bomb_id);
        const favSet = new Set(favouriteBombIds.map(Number));
        missions = missions.map(m => ({ ...m, is_favourite: favSet.has(m.id) }));
    }

    return missions;
};

router.get("/", async (req, res) => {
    try {
        const missions = await fetchMissions(req);
        res.json(missions);
    } catch (err) {
        console.error("Error fetching missions:", err);
        res.status(err.message.includes("team") ? 400 : 500).json({ message: err.message || "Server error" });
    }
});

router.post("/", async (req, res) => {
    try {
        const missions = await fetchMissions(req);
        res.json(missions);
    } catch (err) {
        console.error("Error fetching missions:", err);
        res.status(err.message.includes("team") ? 400 : 500).json({ message: err.message || "Server error" });
    }
});

router.get("/:name", async (req, res) => {
    try {
        const missionName = decodeURIComponent(req.params.name);
        const query = `
      SELECT id, pack_name, mission_name, in_game_name, authors, date_added, bombs, factory
      FROM missions
      WHERE LOWER(mission_name) = LOWER($1)
      LIMIT 1;
    `;
        const result = await pool.query(query, [missionName]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Mission not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching mission:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;