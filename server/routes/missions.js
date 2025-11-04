import express from "express";
import pool from "../db.js";

const router = express.Router();

const fetchMissions = async (req) => {
    const { search, sort = "date_added", order = "descending", pack, author, discordId: queryDiscordId } = req.query;
    const { team, discordId: bodyDiscordId, filters = {} } = req.body || {};
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

    if (filters.difficultyRange) {
        const [minDiff, maxDiff] = filters.difficultyRange;
        if (minDiff > 0 && maxDiff < 30) {
            conditions.push(`difficulty BETWEEN $${idx} AND $${idx + 1}`);
            values.push(minDiff, maxDiff);
            idx += 2;
        } else if (minDiff > 0) {
            conditions.push(`difficulty >= $${idx}`);
            values.push(minDiff);
            idx += 1;
        } else if (maxDiff < 30) {
            conditions.push(`difficulty <= $${idx}`);
            values.push(maxDiff);
            idx += 1;
        }
    }

    const currentYear = new Date().getFullYear();
    if (filters.dateRange) {
        const [startYear, endYear] = filters.dateRange;
        if (startYear > 2015 && endYear < currentYear) {
            conditions.push(`EXTRACT(YEAR FROM date_added) BETWEEN $${idx} AND $${idx + 1}`);
            values.push(startYear, endYear);
            idx += 2;
        } else if (startYear > 2015) {
            conditions.push(`EXTRACT(YEAR FROM date_added) >= $${idx}`);
            values.push(startYear);
            idx += 1;
        } else if (endYear < currentYear) {
            conditions.push(`EXTRACT(YEAR FROM date_added) <= $${idx}`);
            values.push(endYear);
            idx += 1;
        }
    }

    const factoryConditions = [];
    if (filters.showFactorySequence) factoryConditions.push(`factory = 'Sequence'`);
    if (filters.showFactoryStatic) factoryConditions.push(`factory = 'Static'`);
    if (filters.showFactoryNone) factoryConditions.push(`factory IS NULL`);
    if (factoryConditions.length > 0) {
        conditions.push(`(${factoryConditions.join(' OR ')})`);
    } else {
        conditions.push(`FALSE`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let missionsQuery = `
    SELECT id, pack_name, mission_name, in_game_name, authors, date_added, bombs, factory, difficulty, strike_mode, time_mode, verified
    FROM missions
    ${whereClause}
  `;
    let result = await pool.query(missionsQuery, values);
    let missions = result.rows;

    const needsKnown = sort === "known_modules" || Array.isArray(filters.knownPercentRange);

    if (needsKnown && Array.isArray(team) && team.length > 0) {
        const userIds = team.map((u) => u.id);
        const userScoresRes = await pool.query(
            `
            SELECT user_id, module_id, defuser_confidence, expert_confidence
            FROM user_module_scores
            WHERE user_id = ANY($1);
        `, [userIds]);
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
    }

    if (sort === "known_modules") {
        missions.sort((a, b) =>
            orderQuery === "ASC"
                ? (a.known_percentage || 0) - (b.known_percentage || 0)
                : (b.known_percentage || 0) - (a.known_percentage || 0)
        );
    } else {
        const sortKey = sort === "difficulty" ? "difficulty" :
            sort === "mission_name" ? "mission_name" :
                "date_added";

        missions.sort((a, b) => {
            const aVal = a[sortKey] ?? (sortKey === "date_added" ? new Date(a.date_added) : 0);
            const bVal = b[sortKey] ?? (sortKey === "date_added" ? new Date(b.date_added) : 0);
            return orderQuery === "ASC" ? aVal > bVal ? 1 : -1 : aVal < bVal ? 1 : -1;
        });
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

    missions = missions.filter((mission) => {
        let passes = true;

        let bombs = [];
        try {
            bombs = Array.isArray(mission.bombs)
                ? mission.bombs
                : JSON.parse(mission.bombs || "[]");
        } catch {
            bombs = [];
        }

        const uniqueModules = [
            ...new Set(
                bombs.flatMap((b) =>
                    b.pools?.flatMap((p) =>
                        p.modules.map((m) =>
                            typeof m === "string" ? m : m.module_id || m.id
                        )
                    ) || []
                )
            ),
        ];

        const possibleModuleCount = uniqueModules.length;
        const moduleCount = bombs.reduce((total, bomb) => total + bomb.modules, 0);

        if (filters.moduleCountRange) {
            const [minModules, maxModules] = filters.moduleCountRange;
            const minBound = 47;
            const maxBound = 200;

            if (minModules > minBound && maxModules < maxBound) {
                passes &&= moduleCount >= minModules && moduleCount <= maxModules;
            } else if (minModules > minBound) {
                passes &&= moduleCount >= minModules;
            } else if (maxModules < maxBound) {
                passes &&= moduleCount <= maxModules;
            }
        }

        if (filters.possibleModuleCountRange) {
            const [minModules, maxModules] = filters.possibleModuleCountRange;
            const minBound = 47;
            const maxBound = 300;

            if (minModules > minBound && maxModules < maxBound) {
                passes &&= possibleModuleCount >= minModules && possibleModuleCount <= maxModules;
            } else if (minModules > minBound) {
                passes &&= possibleModuleCount >= minModules;
            } else if (maxModules < maxBound) {
                passes &&= possibleModuleCount <= maxModules;
            }
        }

        if (filters.moduleSearch && filters.moduleSearch.trim() !== "") {
            const terms = filters.moduleSearch.toLowerCase().split(",").map(t => t.trim()).filter(Boolean);
            const joined = uniqueModules.join(" ").toLowerCase();
            passes &&= terms.every(term => joined.includes(term));
        }

        if (filters.favesFilter === "only_faves") {
            passes &&= mission.is_favourite === true;
        } else if (filters.favesFilter === "no_faves") {
            passes &&= mission.is_favourite === false;
        }

        if (filters.knownPercentRange) {
            const [min, max] = filters.knownPercentRange;
            const p = (mission.known_percentage || 0) * 100;
            passes &&= p >= min && p <= max;
        }

        return passes;
    });

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
        SELECT id, pack_name, mission_name, in_game_name, authors, date_added, bombs, factory, difficulty, strike_mode, time_mode, verified
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