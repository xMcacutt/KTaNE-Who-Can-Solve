import pool from "./db.js";

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

    const difficultyMap = {
      Trivial: 1,
      VeryEasy: 3,
      Easy: 5,
      Medium: 15,
      Hard: 30,
      VeryHard: 50,
      Extreme: 75,
    };

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

        let difficulty = null;

        if (allModuleIds.length > 0) {
          const { rows: moduleRows } = await pool.query(
            `SELECT module_id, expert_difficulty, defuser_difficulty
              FROM modules
              WHERE module_id = ANY($1)`,
            [allModuleIds]
          );

          const baseScores = moduleRows.map((m) => {
            const expertScore = difficultyMap[m.expert_difficulty] ?? 0;
            const defuserScore = difficultyMap[m.defuser_difficulty] ?? 0;
            return (expertScore + defuserScore) / 2;
          });

          if (baseScores.length > 0) {
            const avgModuleDifficulty =
              baseScores.reduce((a, b) => a + b, 0) / baseScores.length;

            const bombDifficulties = mission.bombs.map((bomb) => {
              const totalModules = bomb.pools.reduce(
                (sum, pool) => sum + (pool.count || 1),
                0
              );

              const minutes = bomb.time / 60;
              const minutesPerModule = minutes / Math.max(totalModules, 1);

              const baseTime = 1;
              const ratio = baseTime / minutesPerModule;
              const timeFactor = 1 + 0.5 * Math.log2(ratio);
              return avgModuleDifficulty * (0.5 + 0.5 * Math.min(Math.max(timeFactor, 0.5), 2));

            });

            difficulty =
              bombDifficulties.reduce((a, b) => a + b, 0) /
              bombDifficulties.length;
          }
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
          difficulty
        ];

        const { rows } = await pool.query(query, values);
        //console.log(`Upserted mission: ${mission.name} (Pack: ${packName}), ID: ${rows[0].id}`);
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