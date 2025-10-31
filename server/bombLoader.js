import pool from "./db.js";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "difficulty_log.txt");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

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

async function insertMissions() {
    try {
        const packs = await loadJson();

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
                        difficulty
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (mission_name, pack_name)
                    DO UPDATE SET
                        in_game_name = EXCLUDED.in_game_name,
                        authors = EXCLUDED.authors,
                        date_added = EXCLUDED.date_added,
                        bombs = EXCLUDED.bombs,
                        factory = EXCLUDED.factory,
                        difficulty = EXCLUDED.difficulty
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
                    missionDifficulty
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