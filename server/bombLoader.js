import pool from "./db.js";
import fs from "fs";
import path from "path";

//const logFile = path.join(process.cwd(), "difficulty_log.txt");
//const logStream = fs.createWriteStream(logFile, { flags: "a" });

function log(message) {
    logStream.write(message + "\n"); 
}

const url = "https://raw.githubusercontent.com/samfundev/KTANE-Bombs/refs/heads/main/importer/bombs.json";

async function loadJson() {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading JSON:", error);
    }
}

function parseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

async function removeMissing(packs) {
    const keys = [];

    for (const pack of packs) {
        for (const mission of pack.missions || []) {
            keys.push([mission.name, pack.name]);
        }
    }

    if (keys.length === 0)
        return;

    const values = [];
    const placeholders = keys.map(([mission, pack], i) => {
        const index = i * 2;
        values.push(mission, pack);
        return `($${index + 1}, $${index + 2})`;
    }).join(", ");

    const query = `
        DELETE FROM missions m
        WHERE NOT EXISTS (
            SELECT 1
            FROM (VALUES ${placeholders}) AS v(mission_name, pack_name)
            WHERE v.mission_name = m.mission_name
            AND v.pack_name = m.pack_name            
        );
    `;

    await pool.query(query, values);
}

async function ensureUnique() {
    await pool.query(`
        DELETE FROM missions a
        USING missions b
        WHERE a.id > b.id
        AND a.mission_name = b.mission_name
        AND a.pack_name = b.pack_name
    `)

    try {
        await pool.query(`
            ALTER TABLE missions
            ADD CONSTRAINT unique_mission_pack
            UNIQUE (mission_name, pack_name)
        `);
    } catch (err) {
        if (err.code !== "42P07")
            throw err;
    }
}

async function insertMissions() {
    try {
        const packs = await loadJson();
        const alterQueries = [
            `ALTER TABLE missions ADD COLUMN IF NOT EXISTS strike_mode TEXT;`,
            `ALTER TABLE missions ADD COLUMN IF NOT EXISTS time_mode TEXT;`,
            `ALTER TABLE missions ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;`
        ];
        for (const query of alterQueries) {
            await pool.query(query);
        }

        await ensureUnique();
        await removeMissing(packs);

        const DIFFICULTY_MAP = {
            Trivial: 1,
            VeryEasy: 3,
            Easy: 5,
            Medium: 15,
            Hard: 25,
            VeryHard: 40,
            Extreme: 85,
        };

        const TIME_FACTOR_WEIGHT = 0.5;
        const MIN_TIME_FACTOR = 0.5;
        const MAX_TIME_FACTOR = 2;
        const MIN_RATIO = 0.1;

        for (const pack of packs) {
            const packName = pack.name;
            const missions = pack.missions || [];

            for (const mission of missions) {
                const allModuleIds = [
                    ...new Set(
                        mission.bombs.flatMap((bomb) =>
                            bomb.pools.flatMap((pool) => pool.modules)
                        )
                    ),
                ];

                let missionDifficulty = null;

                if (allModuleIds.length > 0) {
                    const { rows: moduleRows } = await pool.query(
                        `SELECT module_id, expert_difficulty, defuser_difficulty
                        FROM modules
                        WHERE module_id = ANY($1)`,
                        [allModuleIds]
                    );

                    const bombDifficulties = mission.bombs.map((bomb) => {
                        let selectedModuleScores = [];
                        for (const poolObject of bomb.pools) {
                            const poolModules = poolObject.modules || [];
                            if (poolModules.length === 0) continue;

                            const scoredModules = poolModules.map(moduleId => {
                                const moduleData = moduleRows.find(row => row.module_id === moduleId);
                                if (!moduleData) return 0;

                                const expertScore = DIFFICULTY_MAP[moduleData.expert_difficulty] ?? 0;
                                const defuserScore = DIFFICULTY_MAP[moduleData.defuser_difficulty] ?? 0;
                                return (expertScore + defuserScore) / 2;
                            });

                            const avgPoolDifficulty =
                                scoredModules.reduce((sum, s) => sum + s, 0) / scoredModules.length;

                            for (let i = 0; i < poolObject.count; i++) {
                                selectedModuleScores.push({ baseScore: avgPoolDifficulty });
                            }
                        }

                        const moduleScores = selectedModuleScores.map(({ baseScore }) => {
                            const safeBaseScore = Number.isFinite(baseScore) ? baseScore : 0;
                            return safeBaseScore;
                        });

                        const averageModuleDifficulty =
                            moduleScores.reduce((sum, score) => sum + score, 0) / Math.max(moduleScores.length, 1);

                        const minutes = bomb.time / 60;
                        const minutesPerModule = minutes / Math.max(bomb.modules, 1);
                        const timeRatio = 1 / minutesPerModule;
                        const timeFactor = 1 + TIME_FACTOR_WEIGHT * Math.log2(Math.max(timeRatio, MIN_RATIO));
                        const clampedTimeFactor = Math.min(Math.max(timeFactor, MIN_TIME_FACTOR), MAX_TIME_FACTOR);

                        const bombDifficulty =
                            averageModuleDifficulty *
                            (0.5 + TIME_FACTOR_WEIGHT * clampedTimeFactor);

                        return bombDifficulty;
                    });

                    missionDifficulty = bombDifficulties.reduce((sum, diff) => sum + diff, 0) / bombDifficulties.length;
                }

                const query = `
                    INSERT INTO missions (
                        pack_name,
                        mission_name,
                        in_game_name,
                        authors,
                        date_added,
                        bombs,
                        factory,
                        difficulty,
                        strike_mode,
                        time_mode,
                        verified
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (mission_name, pack_name)
                    DO UPDATE SET
                        in_game_name = EXCLUDED.in_game_name,
                        authors = EXCLUDED.authors,
                        date_added = EXCLUDED.date_added,
                        bombs = EXCLUDED.bombs,
                        factory = EXCLUDED.factory,
                        difficulty = EXCLUDED.difficulty,
                        strike_mode = EXCLUDED.strike_mode,
                        time_mode = EXCLUDED.time_mode,
                        verified = EXCLUDED.verified
                        RETURNING id;
                    `;

                const values = [
                    packName,
                    mission.name,
                    mission.inGameName || null,
                    mission.authors || [],
                    parseDate(mission.dateAdded),
                    JSON.stringify(mission.bombs || []),
                    mission.factory,
                    missionDifficulty,
                    mission.strikeMode,
                    mission.timeMode,
                    mission.verified
                ];

                await pool.query(query, values);
            }
        }
    } catch (err) {
        console.error("Error inserting missions:", err);
    }
}

export async function refreshBombs() {
    console.log("Starting mission refresh...");
    await insertMissions();
    console.log("Mission refresh complete.");
}