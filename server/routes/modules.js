import express from "express";
import pool from "../db.js";

const router = express.Router();

const confidenceOptions = ["Unknown", "Attempted", "Confident", "Avoid"];
const difficultyOptions = ["Trivial", "VeryEasy", "Easy", "Medium", "Hard", "VeryHard", "Extreme"];

router.get("/", async (req, res) => {
    try {
        const search = req.query.search?.toLowerCase() || "";
        const searchFields = req.query.searchFields?.split(",") || ["name", "description"];
        const sortBy = req.query.sortBy || "name";
        const sortOrder = req.query.sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        const userId = req.query.userId || null;
        const confidenceFilter = userId ? req.query.confidenceFilter : null;
        const difficultyFilter = req.query.difficultyFilter || null;
        const moduleTypeFilter = req.query.moduleTypes || null;
        let conditions = [];
        let params = [];
        let paramIndex = 1;
        params.push(userId);
        paramIndex++;
        if (moduleTypeFilter && moduleTypeFilter !== "All") {
            const typeFilters = moduleTypeFilter.split(",").map(t => t.trim()).filter(Boolean);

            const placeholders = typeFilters.map((_, i) => `$${paramIndex + i}`).join(",");
            conditions.push(`modules.type IN (${placeholders})`);

            typeFilters.forEach(t => params.push(t));
            paramIndex += typeFilters.length;
        }
        if (search) {
            let searchConditions = [];
            if (searchFields.includes("name")) {
                searchConditions.push(`LOWER(name) LIKE $${paramIndex}`);
                searchConditions.push(`LOWER(periodic_table_element) LIKE $${paramIndex}`);
                params.push(`%${search}%`);
                paramIndex++;
            }
            if (searchFields.includes("description")) {
                searchConditions.push(`LOWER(description) LIKE $${paramIndex}`);
                params.push(`%${search}%`);
                paramIndex++;
            }
            if (searchFields.includes("author")) {
                searchConditions.push(`
                    EXISTS (
                        SELECT 1 FROM unnest(developers) dev WHERE LOWER(dev) LIKE $${paramIndex}
                    )`
                );
                params.push(`%${search}%`);
                paramIndex++;
            }
            if (searchFields.includes("tags")) {
                searchConditions.push(`
                    EXISTS (
                        SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $${paramIndex}
                    )`
                );
                params.push(`%${search}%`);
                paramIndex++;
            }
            conditions.push(`(${searchConditions.join(" OR ")})`);
        }
        if (userId && confidenceFilter && confidenceFilter !== 'All') {
            const confFilters = confidenceFilter.split(',').map(f => f.trim()).filter(f => f);
            const defuserConfs = confFilters.filter(f => f.startsWith('Defuser:')).map(f => f.slice(8));
            const expertConfs = confFilters.filter(f => f.startsWith('Expert:')).map(f => f.slice(7));
            let confConditions = [];
            if (defuserConfs.length > 0 && defuserConfs.length < confidenceOptions.length) {
                const placeholders = defuserConfs.map((_, i) => `$${paramIndex + i}`).join(',');
                confConditions.push(`COALESCE(s.defuser_confidence, 'Unknown') IN (${placeholders})`);
                defuserConfs.forEach(conf => params.push(conf));
                paramIndex += defuserConfs.length;
            }
            if (expertConfs.length > 0 && expertConfs.length < confidenceOptions.length) {
                const placeholders = expertConfs.map((_, i) => `$${paramIndex + i}`).join(',');
                confConditions.push(`COALESCE(s.expert_confidence, 'Unknown') IN (${placeholders})`);
                expertConfs.forEach(conf => params.push(conf));
                paramIndex += expertConfs.length;
            }
            if (confConditions.length > 0) {
                conditions.push(`(${confConditions.join(' AND ')})`);
            }
        }
        if (difficultyFilter && difficultyFilter !== 'All') {
            const diffFilters = difficultyFilter.split(',').map(f => f.trim()).filter(f => f);
            const defuserDiffs = diffFilters.filter(f => f.startsWith('Defuser:')).map(f => f.slice(8));
            const expertDiffs = diffFilters.filter(f => f.startsWith('Expert:')).map(f => f.slice(7));
            let diffConditions = [];
            if (defuserDiffs.length > 0 && defuserDiffs.length < difficultyOptions.length) {
                const placeholders = defuserDiffs.map((_, i) => `$${paramIndex + i}`).join(',');
                diffConditions.push(`modules.defuser_difficulty IN (${placeholders})`);
                defuserDiffs.forEach(d => params.push(d));
                paramIndex += defuserDiffs.length;
            }
            if (expertDiffs.length > 0 && expertDiffs.length < difficultyOptions.length) {
                const placeholders = expertDiffs.map((_, i) => `$${paramIndex + i}`).join(',');
                diffConditions.push(`modules.expert_difficulty IN (${placeholders})`);
                expertDiffs.forEach(d => params.push(d));
                paramIndex += expertDiffs.length;
            }
            if (diffConditions.length > 0) {
                conditions.push(`(${diffConditions.join(' AND ')})`);
            }
        }
        let whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        let orderClause = "";
        switch (sortBy) {
            case "date":
                orderClause = `
                    ORDER BY
                        modules.published ${sortOrder},
                        LOWER(modules.name) ASC
                `;
                break;

            case "difficulty":
                orderClause = `
                    ORDER BY
                        CASE
                            WHEN modules.defuser_difficulty IS NULL OR modules.expert_difficulty IS NULL THEN 999
                            ELSE
                                COALESCE(
                                    array_position(
                                        ARRAY['Trivial','VeryEasy','Easy','Medium','Hard','VeryHard','Extreme'],
                                        modules.defuser_difficulty
                                    ), 999
                                ) +
                                COALESCE(
                                    array_position(
                                        ARRAY['Trivial','VeryEasy','Easy','Medium','Hard','VeryHard','Extreme'],
                                        modules.expert_difficulty
                                    ), 999
                                )
                        END ${sortOrder},
                        LOWER(modules.name) ASC
                `;
                break;

            case "popularity":
                orderClause = `
                    ORDER BY
                        pop.count ${sortOrder},
                        LOWER(modules.name) ASC
                `;
                break;

            case "name":
            default:
                orderClause = `
                    ORDER BY
                        CASE WHEN LOWER(modules.name) = $${paramIndex} THEN 0 ELSE 1 END,
                        LOWER(modules.name) ${sortOrder}
                `;
                params.push(search);
                paramIndex++;
                break;
        }
        const query = `
            SELECT modules.*,
                (pop.count::float / NULLIF(u.total, 0)) * 100 AS popularity,
                COALESCE(s.defuser_confidence, 'Unknown') AS user_defuser_confidence,
                COALESCE(s.expert_confidence, 'Unknown') AS user_expert_confidence
            FROM modules
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS count
                FROM user_module_scores ps
                WHERE ps.module_id = modules.module_id
                AND (ps.defuser_confidence = 'Confident' OR ps.expert_confidence = 'Confident')
            ) pop ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM users
            ) u ON TRUE
            LEFT JOIN user_module_scores s
                ON s.module_id = modules.module_id
                AND s.user_id = $${1}
            ${whereClause}
            ${orderClause}
        `;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
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
