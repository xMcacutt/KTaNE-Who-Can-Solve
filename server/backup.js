import cron from "node-cron";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env") });

const PG_URI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}` +
               `@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || "./backups");
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS || 14);
const CRON_SCHEDULE = process.env.BACKUP_CRON || "0 2 * * *";

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function runBackup() {
    const timestamp = new Date().toISOString().split("T")[0];
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

    const cmd = `pg_dump "${PG_URI}" > "${backupFile}"`;

    exec(cmd, (error) => {
        if (error) {
            console.error("Backup failed:", error);
            return;
        }
        console.log(`Backup created: ${backupFile}`);
        pruneOldBackups();
    });
}

function pruneOldBackups() {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return console.error(err);

        files.forEach((file) => {
            const filePath = path.join(BACKUP_DIR, file);

            fs.stat(filePath, (err, stats) => {
                if (err) return console.error(err);

                if (stats.mtime.getTime() < cutoff) {
                    fs.unlink(filePath, (err) => {
                        if (!err)
                            console.log(`Deleted old backup: ${filePath}`);
                    });
                }
            });
        });
    });
}

cron.schedule(CRON_SCHEDULE, () => {
    console.log("Running daily database backup...");
    runBackup();
});
