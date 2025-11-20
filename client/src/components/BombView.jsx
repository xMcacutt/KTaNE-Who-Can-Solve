import { Box, Typography, Avatar, useMediaQuery, useTheme } from '@mui/material';
import BombModuleCard from './cards/BombModuleCard.jsx';
import { formatTime, truncate } from "../utility";

function BombView({ bomb, viewStyle, filter, users, modulesData, authUser }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    if (!bomb.pools || bomb.pools.length === 0) return null;

    return (
        <Box mt={1} sx={{ width: "100%" }}>
            <Typography variant="subtitle1" gutterBottom>
                Modules: {bomb.modules} | Time: {formatTime(bomb.time)} | Strikes:{" "}
                {bomb.strikes}
            </Typography>


            {bomb.pools.map((pool, idx) => {
                const hasDuplicates = new Set(pool.modules).size < pool.modules.length;
                let renderedModules = [];

                if (hasDuplicates) {
                    const moduleCounts = new Map();
                    pool.modules.forEach((id) => {
                        moduleCounts.set(id, (moduleCounts.get(id) || 0) + 1);
                    });
                    renderedModules = Array.from(moduleCounts).map(([moduleId, count]) => ({
                        moduleId,
                        probability: Math.round((count / pool.modules.length) * 100),
                    }));
                } else {
                    renderedModules = pool.modules.map((moduleId) => ({
                        moduleId,
                        probability: null,
                    }));
                }

                const optionsCount = pool.modules.length;
                const pulledCount = pool.count || 1;

                const content = renderedModules
                    .filter(({ moduleId }) => {
                        if (filter === "Show All") return true;

                        const moduleData = modulesData[moduleId] || { module_id: moduleId };

                        const defuser = users.find((u) => u.isDefuser);
                        const experts = users.filter((u) => !u.isDefuser);

                        const defuserConf =
                            defuser?.scores?.find((s) => s.module_id === moduleData.module_id)
                                ?.defuser_confidence || "Unknown";

                        const expertConfs = experts.map(
                            (e) =>
                                e.scores?.find((s) => s.module_id === moduleData.module_id)
                                    ?.expert_confidence || "Unknown"
                        );

                        if (filter === "Only My Confident") {
                            if (!authUser) return false;
                            const currentUser = users.find(
                                (u) =>
                                    u.id === authUser.id ||
                                    u._id === authUser.id ||
                                    u.user_id === authUser.id
                            );
                            if (!currentUser || !Array.isArray(currentUser.scores)) return false;

                            const score = currentUser.scores.find(
                                (s) => s.module_id === moduleData.module_id
                            );

                            if (!score) return false;

                            return (
                                score.defuser_confidence === "Confident" ||
                                score.expert_confidence === "Confident"
                            );
                        }
                        if (filter === "Only My Unknown") {
                            if (!authUser) return false;
                            const currentUser = users.find(
                                (u) =>
                                    u.id === authUser.id ||
                                    u._id === authUser.id ||
                                    u.user_id === authUser.id
                            );
                            if (!currentUser || !Array.isArray(currentUser.scores)) return false;

                            const score = currentUser.scores.find(
                                (s) => s.module_id === moduleData.module_id
                            );

                            if (!score) return false;

                            if (users.isDefuser) return score.defuser_confidence !== "Confident";
                            else return score.expert_confidence !== "Confident";
                        }
                        return true;
                    })
                    .map(({ moduleId, probability }, subIdx) => {
                        const moduleData = modulesData[moduleId];
                        return (
                            <BombModuleCard
                                key={`${moduleId}-${subIdx}`}
                                module={moduleData || { name: moduleId, module_id: moduleId }}
                                probability={probability}
                                viewStyle={viewStyle}
                                users={users}
                                authUser={authUser}
                            />
                        );
                    });

                if (content.length === 0) return null;

                return (

                    <Box
                        key={idx}
                        sx={{
                            position: "relative",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            boxSizing: "border-box",
                            border: (optionsCount > 1 || pulledCount > 1)
                                ? "0.5vh dotted gray"
                                : "0.5vh dotted transparent",
                            borderRadius: 3,
                            px: 1,
                            py: (optionsCount > 1 || pulledCount > 1) ? 1 : 0,
                            my: (optionsCount > 1 || pulledCount > 1) ? 3 : 0.5,
                            "::before": (optionsCount > 1 || pulledCount > 1)
                                ? {
                                    content: '""',
                                    position: "absolute",
                                    top: isMobile ? -14 : -24,
                                    left: isMobile ? 0 : 0,
                                    width: isMobile ? 35 : 55,
                                    height: isMobile ? 24 : 38,
                                    backgroundColor: (theme) => theme.palette.background.default,
                                    zIndex: 2,
                                }
                                : {},
                        }}
                    >
                        {(optionsCount > 1 || pulledCount > 1) && (
                            <Typography
                                sx={{
                                    position: "absolute",
                                    top: isMobile ? -14 : -24,
                                    left: isMobile ? 10 : 10,
                                    fontWeight: "bold",
                                    fontSize: isMobile ? 20 : 35,
                                    color: "text.primary",
                                    zIndex: 3,
                                    pointerEvents: "none",
                                }}
                            >
                                ×{pulledCount}
                            </Typography>
                        )}

                        <Box sx={{
                            position: "relative",
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                        }} >
                            {content}
                        </Box>
                    </Box>

                );
            })}
        </Box >
    );
}

export default BombView;