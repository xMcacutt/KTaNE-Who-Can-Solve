import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/generate", async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const distributions = {
        1: { Trivial: 1.0, Easy: 0.75, Medium: 0.25, Hard: 0, VeryHard: 0, Extreme: 0 },
        2: { Trivial: 0.20, Easy: 0.55, Medium: 0.25, Hard: 0, VeryHard: 0, Extreme: 0 },
        3: { Trivial: 0.05, Easy: 0.55, Medium: 0.35, Hard: 0, VeryHard: 0, Extreme: 0 },
        4: { Trivial: 0, Easy: 0.40, Medium: 0.55, Hard: 0.05, VeryHard: 0, Extreme: 0 },
        5: { Trivial: 0, Easy: 0.20, Medium: 0.60, Hard: 0.20, VeryHard: 0, Extreme: 0 },
        6: { Trivial: 0, Easy: 0.05, Medium: 0.45, Hard: 0.45, VeryHard: 0.05, Extreme: 0 },
        7: { Trivial: 0, Easy: 0, Medium: 0.20, Hard: 0.60, VeryHard: 0.20, Extreme: 0 },
        8: { Trivial: 0, Easy: 0, Medium: 0.05, Hard: 0.55, VeryHard: 0.40, Extreme: 0 },
        9: { Trivial: 0, Easy: 0, Medium: 0, Hard: 0.25, VeryHard: 0.55, Extreme: 0.20 },
        10: { Trivial: 0, Easy: 0, Medium: 0, Hard: 0.25, VeryHard: 0.75, Extreme: 1.0 },
    };
    const difficultyRank = {
        Trivial: 1,
        Easy: 2,
        Medium: 3,
        Hard: 4,
        VeryHard: 5,
        Extreme: 6,
    };
    const moduleRank = (m) =>
        Math.max(difficultyRank[m.defuser_difficulty] || 0, difficultyRank[m.expert_difficulty] || 0);
    function pickRandom(arr, n) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, n);
    }

    function pickWeighted(arr, n, weightFn) {
        if (n >= arr.length) return [...arr];
        const keyed = arr.map(item => {
            const w = Math.max(0.001, Math.min(1, Number(weightFn(item)) || 0));
            const u = Math.random();
            const key = Math.pow(u, 1 / w);
            return { key, item, weight: w };
        });
        keyed.sort((a, b) => b.key - a.key);
        const chosen = keyed.slice(0, n).map(k => k.item);
        console.log("Chosen modules weights:", chosen.map((m, i) => ({ id: m.module_id, weight: keyed[i].weight })));
        return chosen;
    }

    function ageWeight(mod) {
        const d = mod.published ? new Date(mod.published) : null;
        if (!d || isNaN(d)) return 0;
        const t = d.getTime();
        const t_newest = Date.now();
        const t_cutoff = t_newest - 7 * 365 * 24 * 60 * 60 * 1000;
        if (t <= t_cutoff) return 1;
        const linearWeight = (t_newest - t) / (t_newest - t_cutoff);
        const weight = linearWeight ** 3;
        return weight;
    }

    try {
        let { bombSize, difficulty, prioritizeOlder, needys, bosses } = req.body;
        const userId = req.user.discord_id;
        const d = Math.max(1, Math.min(10, Number(difficulty) || 1));
        const modulesRes = await pool.query("SELECT * FROM modules");
        const scoresRes = await pool.query(
            "SELECT module_id, defuser_confidence, expert_confidence FROM user_module_scores WHERE user_id = $1",
            [userId]
        );
        let modules = modulesRes.rows;
        const scores = scoresRes.rows;
        if (!needys) {
            modules = modules.filter(m => m.type !== "Needy");
        }
        if (!bosses) {
            modules = modules.filter(m => m.boss_status !== "FullBoss");
        }
        const avoidSet = new Set(
            scores
                .filter(s => s.defuser_confidence === "Avoid" || s.expert_confidence === "Avoid")
                .map(s => s.module_id)
        );
        const usableModules = modules.filter(m => !avoidSet.has(m.module_id));
        const dist = distributions[d];
        let counts = {};
        let total = 0;
        for (const [band, weight] of Object.entries(dist)) {
            counts[band] = Math.round(weight * bombSize);
            total += counts[band];
        }
        while (total < bombSize) {
            const maxBand = Object.keys(dist).reduce((a, b) =>
                dist[a] > dist[b] ? a : b
            );
            counts[maxBand]++;
            total++;
        }
        while (total > bombSize) {
            const minBand = Object.keys(dist).reduce((a, b) =>
                dist[a] < dist[b] && counts[b] > 0 ? b : a
            );
            counts[minBand]--;
            total--;
        }
        if (d === 1) {
            counts.Trivial = Math.max(1, Math.min(3, counts.Trivial));
        }
        if (d === 9) {
            counts.Extreme = Math.min(1, counts.Extreme);
        }
        if (d === 10) {
            counts.Extreme = 1;
        }
        const pick = prioritizeOlder
            ? (arr, n) => pickWeighted(arr, n, ageWeight)
            : (arr, n) => pickRandom(arr, n);
        let chosen = [];
        for (const [band, n] of Object.entries(counts)) {
            if (n <= 0) continue;

            const chosenIds = new Set(chosen.map(m => m.module_id));

            const pool = usableModules.filter(
                m =>
                    !chosenIds.has(m.module_id) &&
                    (m.defuser_difficulty === band || m.expert_difficulty === band)
            );

            let selected = pick(pool, n);

            if (selected.length < n) {
                let deficit = n - selected.length;
                const chosenIdsAfter = new Set([...chosen, ...selected].map(m => m.module_id));
                const fallbackPool = usableModules.filter(m => !chosenIdsAfter.has(m.module_id));
                const fallback = pickRandom(fallbackPool, deficit);
                selected = [...selected, ...fallback];
            }

            chosen = [...chosen, ...selected];
        }
        chosen.sort((a, b) => moduleRank(a) - moduleRank(b));
        res.json(chosen);
    } catch (err) {
        console.error("Error generating modules:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;