import { exec } from "child_process";

export function updateGitSubmodule() {
    return new Promise((resolve, reject) => {
        exec("git submodule update --remote --init --recursive --force", (err, stdout, stderr) => {
            if (err) {
                console.error("Git submodule update error:", err);
                reject(err);
                return;
            }
            console.log("Git submodule updated:", stdout.trim());
            resolve(stdout.trim());
        });
    });
}

export default { updateGitSubmodule };
