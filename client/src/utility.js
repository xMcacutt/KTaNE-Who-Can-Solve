export function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
}

export const bossToColor = (type) => {
    if (type === "FullBoss")
        return "#e74c3c";
    else if (type === "SemiBoss")
        return "#a1740f";
}

export const getHeatmapColor = (module) => {
    const expert_difficulty = difficultyMap[module.expert_difficulty];
    const defuser_difficulty = difficultyMap[module.defuser_difficulty];
    const difficulty = (expert_difficulty + defuser_difficulty) / 2;
    const hue = (1 - difficulty / 6) * 120;
    return `hsl(${hue}, 70%, 20%)`;
};

export const confidenceOptions = [
    "Unknown",
    "Attempted",
    "Confident",
    "Avoid",
];

export const confidenceIcons = {
    Unknown: "/icons/unknown.png",
    Attempted: "/icons/attempted.png",
    Confident: "/icons/confident.png",
    Avoid: "/icons/avoid.png",
};

export const difficultyMap = {
    Trivial: 1,
    VeryEasy: 2,
    Easy: 3,
    Medium: 4,
    Hard: 5,
    VeryHard: 6,
    Extreme: 7,
};

export const truncate = (str, n) => {
    if (str == null)
        return str;
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
};