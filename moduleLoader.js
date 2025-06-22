import fs from "fs";
import path from "path";
import { join } from "path";
import pool from "./db.js";
import { fileURLToPath } from "url";
import { updateGitSubmodule } from "./gitUpdater.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDir = join(__dirname, "KtaneContent", "JSON");
const iconDir = join(__dirname, "KtaneContent", "Icons");

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

async function insertNewModules() {
  try {
    const files = getJsonFiles();
    const iconMap = buildIconMap();

    for (const file of files) {
      const moduleData = readJsonFile(file);
      if (!moduleData) continue;

      const moduleId = moduleData.ModuleID;
      if (!moduleId) {
        console.warn(`Skipping file ${file}: No module_id or name found.`);
        continue;
      }

      const existing = await pool.query("SELECT 1 FROM modules WHERE sort_key = $1", [moduleData.SortKey]);
      if (existing.rows.length > 0) {
        continue;
      }

      if (existing.rows.length === 0) {
        const query = `
          INSERT INTO modules 
            (module_id, name, description, published, developers, defuser_difficulty, expert_difficulty, tags, icon_file_name, sort_key)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        var description = Array.isArray(moduleData.Descriptions) && moduleData.Descriptions.length > 0
        ? moduleData.Descriptions[0].Description
        : null;

        var tags = Array.isArray(moduleData.Descriptions) && moduleData.Descriptions.length > 0 && Array.isArray(moduleData.Descriptions[0].Tags)
        ? moduleData.Descriptions[0].Tags
        : null;

        if (!description && moduleData.Description) {
            var parts = moduleData.Description.split('Tags:');
            description = parts[0].trim();
            if (!tags && parts.length > 1) {
                tags = parts[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }
        
        var developer;
        const contributors = moduleData.Contributors || null;
        if (!contributors)
        {
            developer = null
        }
        else {
            developer = Array.isArray(moduleData.Contributors.Developer) && moduleData.Contributors.Developer.length > 0
            ? moduleData.Contributors.Developer
            : null;
        }

        if (!developer)
            developer = [moduleData.Author] || null;
        

        const jsonBaseName = file.replace(/\.json$/, '');
        const iconFileMatch = iconMap.get(jsonBaseName.toLowerCase());

        if (!iconFileMatch) {
            console.warn(`No matching icon for module ${moduleData.Name} (${jsonBaseName})`);
            continue;
        }

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
            moduleData.SortKey
        ];

        await pool.query(query, values);
        console.log(`Inserted new module: ${moduleData.Name || moduleId}`);
      }
    }
  } catch (err) {
    console.error("Error inserting modules:", err);
  }
}

export async function refreshModules() {
  try {
    console.log("Starting module refresh...");
    await updateGitSubmodule();
    await insertNewModules();
    console.log("Module refresh complete.");
  } catch (err) {
    console.error("Failed to refresh modules:", err);
  }
}
