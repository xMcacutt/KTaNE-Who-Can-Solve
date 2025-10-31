import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import ModuleChip from './small/ModuleChip';
import { formatTime } from "../utility";

function BombView({ bomb, viewStyle, filter, users, modulesData, authUser }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    if (!bomb.pools || bomb.pools.length === 0) return null;

    return (
        <Box mt={1}>
            <Typography variant="subtitle1" gutterBottom>
                Modules: {bomb.modules} | Time: {formatTime(bomb.time)} | Strikes: {bomb.strikes}
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-evenly',
                    gap: 2,
                    mt: 2
                }}
            >
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

                            let effectiveUsers = [...users];
                            if (users.length === 1) {
                                const single = users[0];
                                effectiveUsers = [
                                    { ...single, isDefuser: true },
                                    { ...single, isDefuser: false },
                                ];
                            }

                            const defuser = effectiveUsers.find((u) => u.isDefuser);
                            const experts = effectiveUsers.filter((u) => !u.isDefuser);

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
                                    (u) => u.id === authUser.id || u._id === authUser.id || u.user_id === authUser.id
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

                            if (filter === "Only Unknown") {
                                const anyExpertConfident = expertConfs.includes("Confident");
                                return !anyExpertConfident && defuserConf !== "Confident";
                            }

                            return true;
                        })
                        .map(({ moduleId, probability }, subIdx) => {
                            const moduleData = modulesData[moduleId];
                            return (
                                <ModuleChip
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
                                position: 'relative',
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'space-evenly',
                                gap: 2,
                                border: '5px dotted gray',
                                borderRadius: 5,
                                p: 1,
                                m: 1
                            }}
                        >
                            {(optionsCount > 1 || pulledCount > 1) && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: isMobile ? -20 : -27.5,
                                        left: 20,
                                        fontWeight: 'bold',
                                        fontSize: isMobile ? 20 : 30,
                                        boxShadow: 1,
                                    }}
                                >
                                    ×{pulledCount}
                                </Typography>
                            )}
                            {content}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

export default BombView;