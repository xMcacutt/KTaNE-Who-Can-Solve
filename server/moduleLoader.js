import fs from "fs";
import path from "path";
import { join } from "path";
import pool from "./db.js";
import { fileURLToPath } from "url";
import { updateGitSubmodule } from "./gitUpdater.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDir = join(__dirname, "..", "KtaneContent", "JSON");
const iconDir = join(__dirname, "..", "KtaneContent", "Icons");

function getJsonFiles() {
    if (!fs.existsSync(jsonDir)) {
        console.warn(`Directory not found: ${jsonDir}`);
        return [];
    }
    return fs.readdirSync(jsonDir).filter((file) => file.endsWith(".json"));
}

function readJsonFile(file) {
    const filePath = join(jsonDir, file);
    try {
        let content = fs.readFileSync(filePath, "utf8");
        if (content.charCodeAt(0) === 0xFEFF)
            content = content.slice(1);
        return JSON.parse(content);
    } catch (err) {
        console.error(`Failed to read/parse JSON file ${file}:`, err);
        return null;
    }
}

function parseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

function buildIconMap() {
    if (!fs.existsSync(iconDir)) {
        console.warn(`Icon directory not found: ${iconDir}`);
        return new Map();
    }

    const files = fs.readdirSync(iconDir).filter(f => f.endsWith(".png"));
    const map = new Map();
    for (const file of files) {
        const nameWithoutExt = file.slice(0, -4); // remove ".png"
        map.set(nameWithoutExt.toLowerCase(), nameWithoutExt);
    }
    return map;
}

async function processModules(modules, iconMap, isTranslation = false, seenModuleIds) {
    for (const { file, moduleData } of modules) {
        const moduleId = moduleData.ModuleID;
        if (!moduleId) {
            console.warn(`Skipping file ${file}: No module_id or name found.`);
            continue;
        }

        seenModuleIds.add(moduleId);

        let description = null;
        let tags = null;

        if (Array.isArray(moduleData.Descriptions) && moduleData.Descriptions.length > 0) {
            description = moduleData.Descriptions[0].Description || null;
            tags = Array.isArray(moduleData.Descriptions[0].Tags)
                ? moduleData.Descriptions[0].Tags
                : null;
        }

        if (!description && moduleData.Description) {
            const parts = moduleData.Description.split("Tags:");
            description = parts[0].trim();
            if (!tags && parts.length > 1) {
                tags = parts[1].split(",").map(tag => tag.trim()).filter(Boolean);
            }
        }

        const quirks = moduleData.Quirks
            ? moduleData.Quirks.split(", ")
            : [];

        let developer = null;
        if (moduleData.Contributors?.Developer?.length > 0) {
            developer = moduleData.Contributors.Developer;
        } else if (moduleData.Author) {
            developer = [moduleData.Author];
        }

        let iconFileMatch = iconMap.get(file.replace(/\.json$/, "").toLowerCase());

        if (!iconFileMatch && isTranslation && moduleData.TranslationOf) {
            const res = await pool.query(
                "SELECT icon_file_name FROM modules WHERE module_id = $1",
                [moduleData.TranslationOf]
            );
            if (res.rows.length > 0) {
                iconFileMatch = res.rows[0].icon_file_name;
            } else {
                const originalIcon = iconMap.get(moduleData.TranslationOf.toLowerCase());
                if (originalIcon) iconFileMatch = originalIcon;
            }
        }

        if (!iconFileMatch) {
            console.warn(`No matching icon for module ${moduleData.Name})`);
            continue;
        }

        const query = `
            INSERT INTO modules (module_id, name, description, published, developers, defuser_difficulty,
                                 expert_difficulty, tags, icon_file_name, sort_key, type, boss_status, quirks, periodic_table_element)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT (module_id) DO UPDATE
              SET name=$2, description=$3, published=$4, developers=$5,
                  defuser_difficulty=$6, expert_difficulty=$7, tags=$8,
                  icon_file_name=$9, sort_key=$10, type=$11,
                  boss_status=$12, quirks=$13, periodic_table_element=$14
        `;

        const values = [
            moduleId,
            moduleData.Name,
            description,
            parseDate(moduleData.Published),
            developer,
            moduleData.DefuserDifficulty || null,
            moduleData.ExpertDifficulty || null,
            tags,
            iconFileMatch,
            moduleData.SortKey,
            moduleData.Type,
            moduleData.BossStatus,
            quirks,
            moduleData.Symbol
        ];

        await pool.query(query, values);
    }
}


export async function refreshModules() {
    try {
        console.log("Starting module refresh...");
        await updateGitSubmodule();

        const files = getJsonFiles();
        const iconMap = buildIconMap();

        const seenModuleIds = new Set();

        const originals = [];
        const translations = [];

        for (const file of files) {
            if (file.includes("Appendix")) continue;

            const moduleData = readJsonFile(file);
            if (!moduleData) continue;

            if (moduleData.TranslationOf) {
                translations.push({ file, moduleData });
            } else {
                originals.push({ file, moduleData });
            }
        }

        await processModules(originals, iconMap, false, seenModuleIds);

        await processModules(translations, iconMap, true, seenModuleIds);

        
        await pool.query(
            "DELETE FROM modules WHERE module_id <> ALL($1::text[])",
            [Array.from(seenModuleIds)]
        );

        console.log("Module refresh complete.");
    } catch (err) {
        console.error("Failed to refresh modules:", err);
    }
}
