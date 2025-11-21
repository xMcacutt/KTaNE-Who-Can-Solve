import express from "express";
import pool from "../db.js";

const router = express.Router();

const confidenceOptions = ["Unknown", "Attempted", "Confident", "Avoid"];
const difficultyOptions = ["Trivial", "VeryEasy", "Easy", "Medium", "Hard", "VeryHard", "Extreme"];

const SORT_FIELDS = {
    name: "name",
    date: "published",
    popularity: "popularity",
    difficulty: "difficulty_score"
};

router.get("/", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;

        const search = req.query.search?.trim().toLowerCase() || "";
        const searchFields = req.query.searchFields?.split(",") || ["name", "description"];

        const moduleTypes =
            req.query.moduleTypes && req.query.moduleTypes !== "All"
                ? req.query.moduleTypes.split(",").map(s => s.trim())
                : [];

        const difficultyFilterRaw = req.query.difficultyFilter || null;

        const confidenceFilter =
            req.query.confidenceFilter && req.query.confidenceFilter !== "All"
                ? req.query.confidenceFilter.split(",").map(s => s.trim())
                : [];

        const userId = req.query.userId || null;

        const sortBy = SORT_FIELDS[req.query.sortBy] || "name";
        const sortOrder = req.query.sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";

        const conditions = [];
        const params = [];
        let idx = 1;

        if (moduleTypes.length > 0) {
            params.push(moduleTypes);
            conditions.push(`m.type = ANY($${idx}::text[])`);
            idx++;
        }

        if (search !== "") {
            const terms = search
                .trim()
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean);

            if (terms.length > 0) {
                const termGroups = [];

                for (const term of terms) {
                    const perTermConds = [];

                    if (searchFields.includes("name")) {
                        perTermConds.push(`LOWER(m.name) LIKE '%' || $${idx} || '%'`);
                        params.push(term);
                        idx++;

                        perTermConds.push(`LOWER(m.periodic_table_element) LIKE '%' || $${idx} || '%'`);
                        params.push(term);
                        idx++;
                    }
                    if (searchFields.includes("description")) {
                        perTermConds.push(`LOWER(m.description) LIKE '%' || $${idx} || '%'`);
                        params.push(term);
                        idx++;
                    }
                    if (searchFields.includes("author")) {
                        perTermConds.push(`
                        EXISTS(
                                SELECT 1 FROM unnest(m.developers) dev
                            WHERE LOWER(dev) LIKE '%' || $${idx} || '%'
                            )
                                    `);
                        params.push(term);
                        idx++;
                    }
                    if (searchFields.includes("tags")) {
                        perTermConds.push(`
                        EXISTS(
                                        SELECT 1 FROM unnest(m.tags) tag
                            WHERE LOWER(tag) LIKE '%' || $${idx} || '%'
                                    )
                                    `);
                        params.push(term);
                        idx++;
                    }

                    if (perTermConds.length > 0) {
                        termGroups.push(`(${perTermConds.join(" OR ")})`);
                    }
                }

                if (termGroups.length > 0) {
                    conditions.push(`(${termGroups.join(" AND ")})`);
                }
            }
        }

        if (difficultyFilterRaw && difficultyFilterRaw !== "All") {
            const diffFilters = difficultyFilterRaw
                .split(",")
                .map(f => f.trim())
                .filter(Boolean);

            const defuserDiffs = diffFilters
                .filter(f => f.startsWith("Defuser:"))
                .map(f => f.slice("Defuser:".length));

            const expertDiffs = diffFilters
                .filter(f => f.startsWith("Expert:"))
                .map(f => f.slice("Expert:".length));

            const diffConditions = [];

            if (defuserDiffs.length > 0 && defuserDiffs.length < difficultyOptions.length) {
                const placeholders = defuserDiffs
                    .map((_, i) => `$${idx + i} `)
                    .join(",");
                diffConditions.push(`m.defuser_difficulty IN(${placeholders})`);
                defuserDiffs.forEach(d => params.push(d));
                idx += defuserDiffs.length;
            }

            if (expertDiffs.length > 0 && expertDiffs.length < difficultyOptions.length) {
                const placeholders = expertDiffs
                    .map((_, i) => `$${idx + i} `)
                    .join(",");
                diffConditions.push(`m.expert_difficulty IN(${placeholders})`);
                expertDiffs.forEach(d => params.push(d));
                idx += expertDiffs.length;
            }

            if (diffConditions.length > 0) {
                conditions.push(`(${diffConditions.join(" AND ")})`);
            }
        }

        if (userId && confidenceFilter.length > 0) {
            params.push(userId);
            params.push(confidenceFilter);

            conditions.push(`
                    EXISTS(
                        SELECT 1 FROM user_module_scores us
                    WHERE us.user_id = $${idx - 1}
                    AND us.module_id = m.module_id
                AND(
                    us.defuser_confidence = ANY($${idx}:: text[])
                        OR us.expert_confidence = ANY($${idx}:: text[])
                )
                )
            `);

            idx++;
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")} ` : "";

        const query = `
            WITH popularity AS(
                    SELECT
                    module_id,
                    COUNT(*) FILTER(
                        WHERE defuser_confidence = 'Confident'
                           OR expert_confidence = 'Confident'
                    ) AS popularity
                FROM user_module_scores
                GROUP BY module_id
                ),

    difficulty_calc AS(
        SELECT
                    module_id,
        (
            COALESCE(
                array_position(
                    ARRAY['Trivial', 'VeryEasy', 'Easy', 'Medium', 'Hard', 'VeryHard', 'Extreme'],
                    defuser_difficulty
                ),
                999
            ) +
            COALESCE(
                array_position(
                    ARRAY['Trivial', 'VeryEasy', 'Easy', 'Medium', 'Hard', 'VeryHard', 'Extreme'],
                    expert_difficulty
                ),
                999
            )
        ) AS difficulty_score
                FROM modules
    )

SELECT
m.*,
    COALESCE(p.popularity, 0) AS popularity,
        d.difficulty_score
            FROM modules m
            LEFT JOIN popularity p ON p.module_id = m.module_id
            LEFT JOIN difficulty_calc d ON d.module_id = m.module_id
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}, m.name ASC
            LIMIT ${limit}
            OFFSET ${offset}
`;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

router.get("/:module_name", async (req, res) => {
    try {
        const { module_name } = req.params;
        const result = await pool.query("SELECT * FROM modules WHERE name = $1", [module_name]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Module not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
});

router.post("/bulk", async (req, res) => {
    try {
        const ids = req.body?.ids;
        if (!Array.isArray(ids) || ids.length === 0)
            return res.json([]);
        const query = `SELECT * FROM modules WHERE module_id = ANY($1:: text[])`;
        const result = await pool.query(query, [ids]); res.json(result.rows);
    } catch (err) {
        console.error("Error fetching bulk modules:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
