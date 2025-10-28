import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Tabs, Tab, Link, Chip, Grid, Card, FormControl, Avatar, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useActiveUsers } from "../context/ActiveUsersContext";
import UserPanel from "../components/UserPanel";
import { formatTime, bossToColor, confidenceIcons, difficultyMap, truncate } from "../utility";
import { useAuth } from "../context/AuthContext";


const getHeatmapColor = (module) => {
    const expert_difficulty = difficultyMap[module.expert_difficulty];
    const defuser_difficulty = difficultyMap[module.defuser_difficulty];
    const difficulty = (expert_difficulty + defuser_difficulty) / 2;
    const hue = (1 - difficulty / 6) * 120;
    return `hsl(${hue}, 70%, 50%)`;
};

function ModuleChip({ module, probability, viewStyle, users, authUser }) {
    const encodedModuleName = encodeURIComponent(module.icon_file_name || module.name).replace(/'/g, "\\'");
    const imageUrl = `https://raw.githubusercontent.com/Timwi/KtaneContent/refs/heads/master/Icons/${encodedModuleName}.png`;
    const manualUrl = `https://ktane.timwi.de/redirect/#${encodedModuleName}`;

    let effectiveUsers = [...users];
    if (users.length === 1) {
        const single = users[0];
        effectiveUsers = [
            { ...single, isDefuser: true },
            { ...single, isDefuser: false },
        ];
    }

    const defuser = effectiveUsers.find(u => u.isDefuser);
    const experts = effectiveUsers.filter(u => !u.isDefuser);

    const defuserConf = defuser
        ? (defuser.scores?.find(s => s.module_id === module.module_id)?.defuser_confidence || "Unknown")
        : "Unknown";
    const expertConfs = experts.map(e => e.scores?.find(s => s.module_id === module.module_id)?.expert_confidence || "Unknown");

    console.log({
        module: module.name,
        defuserConf,
        expertConfs,
        defuserScores: defuser?.scores?.slice(0, 3)
    });

    let summaryIcon = confidenceIcons.Avoid;
    const anyExpertConfident = expertConfs.includes("Confident");
    if (defuserConf === "Confident" && anyExpertConfident) summaryIcon = confidenceIcons.Confident;
    else if (defuserConf === "Confident" || anyExpertConfident) summaryIcon = confidenceIcons.Attempted;

    const userCount = Math.min(effectiveUsers.length, 4);
    const displayedUsers = effectiveUsers.slice(0, 4);

    let layoutProps = {};
    if (userCount === 1) {
        layoutProps = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 };
    } else if (userCount === 2) {
        layoutProps = { display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', gap: 1 };
    } else if (userCount === 3) {
        layoutProps = {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, auto)',
            justifyItems: 'center',
            alignItems: 'center',
            '& > :nth-of-type(3)': { gridColumn: '1 / span 2', justifySelf: 'center' },
        };
    } else {
        layoutProps = {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, auto)',
            justifyItems: 'center',
            alignItems: 'center',
        };
    }

    const avatarSize = userCount === 1 ? 72 : userCount === 2 ? 64 : userCount === 3 ? 56 : 48;
    const borderWidth = userCount <= 2 ? 4 : 3;

    return (
        <Card
            sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                width: 300,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: viewStyle === 'Difficulty Heatmap' ? getHeatmapColor(module) : 'transparent',
                    backgroundImage: `${viewStyle !== 'Large Icons' ? 'none' : `url(${imageUrl})`}`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(6px) brightness(0.3) saturate(0.8)',
                    imageRendering: 'pixelated',
                }}
            />

            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    p: 1,
                    height: '45%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: viewStyle === 'Small Icons' ? 'row' : 'column',
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {viewStyle === 'Small Icons' && (
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                            }}
                        />
                    )}
                    <Link href={manualUrl}>
                        <Typography variant="h6" fontSize="1.4rem">{truncate(module.name, 21)}</Typography>
                    </Link>
                </Box>

                <Box sx={{ ...layoutProps, width: '100%', mt: 1 }}>
                    {
                        authUser &&
                        displayedUsers.map((user, i) => {
                            const score = user.scores?.find((s) => s.module_id === module.module_id) || {};
                            const conf = user.isDefuser ? score.defuser_confidence : score.expert_confidence;
                            if (conf === "Avoid") return null;

                            const borderColor =
                                conf === "Confident" ? "limegreen" :
                                    conf === "Attempted" ? "gold" :
                                        "transparent";

                            const brightness = !conf || conf === "Unknown" ? "brightness(0.3)" : "brightness(1)";

                            return (
                                <Avatar
                                    key={`${user.id}-${i}`}
                                    src={user.avatar}
                                    sx={{
                                        width: avatarSize,
                                        height: avatarSize,
                                        border: `${borderWidth}px solid ${borderColor}`,
                                        filter: brightness,
                                        transition: '0.2s ease all',
                                    }}
                                />
                            );
                        })
                    }
                </Box>

                {probability != null && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'white',
                            position: 'absolute',
                            top: 210,
                            left: 20,
                            borderRadius: 1,
                            fontSize: 30,
                            alignSelf: 'flex-start',
                        }}
                    >
                        {probability}%
                    </Typography>
                )}
            </Box>

            {
                module.type !== "Regular" && (
                    <Chip label={`${module.type}`} size="small"
                        sx={{
                            backgroundColor: "#4444aa",
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            borderRadius: 1,
                            padding: 0.5,
                        }} />
                )
            }
            {
                module.boss_status && (
                    <Chip label={`${module.boss_status}`} size="small"
                        sx={{
                            backgroundColor: bossToColor(module.boss_status),
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            borderRadius: 1,
                            padding: 0.5,
                        }} />
                )
            }

            <Box
                component="img"
                src={summaryIcon}
                alt="summary confidence"
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    padding: 0.5,
                }}
            />
        </Card>
    );
}


function BombView({ bomb, viewStyle, filter, users }) {
    const { authUser } = useAuth();

    const allModuleIds = [...new Set(bomb.pools?.flatMap((pool) => pool.modules) || [])];

    const {
        data: modulesData = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ['modules', bomb?.id || JSON.stringify(bomb)],
        queryFn: async () => {
            if (!allModuleIds.length) {
                console.warn('No module names to fetch');
                return {};
            }
            console.log('Fetching modules for names:', allModuleIds);
            const res = await fetch('/api/modules/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: allModuleIds }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Fetch error:', res.status, errorData.message || 'Unknown error');
                throw new Error(`Failed to fetch modules: ${res.status} ${errorData.message || 'Unknown error'}`);
            }
            const data = await res.json();
            const dict = {};
            data.forEach((m) => {
                if (m.module_id) {
                    dict[m.module_id] = m;
                } else {
                    console.warn('Module missing ID:', m);
                }
            });
            return dict;
        },
        enabled: !!bomb && bomb.pools?.length > 0 && allModuleIds.length > 0,
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    if (isLoading) return <Typography>Loading modules...</Typography>;
    if (error) return <Typography>Error: {error.message}</Typography>;

    return (
        <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
                Modules: {bomb.modules} | Time: {formatTime(bomb.time)} | Strikes: {bomb.strikes}
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-evenly',
                    gap: 2,
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

                            console.log("authUser.id", authUser.id);
                            console.log("activeUsers", users.map(u => u.id || u._id));
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
                                    module={moduleData || { name: moduleId }}
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
                            }}
                        >
                            {(optionsCount > 1 || pulledCount > 1) && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: -27.5,
                                        left: 20,
                                        fontWeight: 'bold',
                                        fontSize: 30,
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


function MissionPageContent({ mission, activeUsers, addUser, removeUser, setDefuser }) {
    const [tabIndex, setTabIndex] = useState(0);
    const [viewStyle, setViewStyle] = useState('Large Icons');
    const [filter, setFilter] = useState('Show All');
    const [panelOpen, setPanelOpen] = useState(false);
    const { authUser } = useAuth();


    const handleViewStyleChange = (event) => {
        setViewStyle(event.target.value);
    };

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    return (
        <Box sx={{ mb: 10 }}>
            <Box sx={{ mb: 2 }}>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>View Style</InputLabel>
                    <Select
                        value={viewStyle}
                        onChange={handleViewStyleChange}
                        label="View Style"
                    >
                        <MenuItem value="Large Icons">Large Icons</MenuItem>
                        <MenuItem value="Small Icons">Small Icons</MenuItem>
                        <MenuItem value="Difficulty Heatmap">Difficulty Heatmap</MenuItem>
                    </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                        value={filter}
                        onChange={handleFilterChange}
                        label="Filter"
                    >
                        <MenuItem value="Show All">Show All</MenuItem>
                        <MenuItem value="Only My Confident">Only My Confident</MenuItem>
                        <MenuItem value="Only Unknown">Only Unknown</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" gutterBottom>
                    {mission.mission_name}
                </Typography>
                {
                    authUser &&
                    <IconButton onClick={() => setPanelOpen(true)}>
                        <GroupAddIcon />
                    </IconButton>
                }
            </Box>
            <Typography variant="subtitle1" gutterBottom>
                By {mission.authors?.join(', ') || 'Unknown'} | Pack: {mission.pack_name}
            </Typography>
            <Tabs
                value={tabIndex}
                onChange={(_, newValue) => setTabIndex(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
            >
                {mission.bombs.map((_, i) => (
                    <Tab key={i} label={`Bomb ${i + 1}`} />
                ))}
            </Tabs>
            {mission.bombs.map((bomb, i) =>
                i === tabIndex ? (
                    <BombView key={i} bomb={bomb} viewStyle={viewStyle} filter={filter} users={activeUsers} />
                ) : null
            )}
            <UserPanel
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
                currentUsers={activeUsers}
                onAddUser={addUser}
                onRemoveUser={removeUser}
                onSetDefuser={setDefuser}
            />
        </Box>
    );
}
export default function MissionPage() {
    const { activeUsers, setActiveUsers, addUser, removeUser, setDefuser } = useActiveUsers();
    const { missionName, users: usersParam } = useParams();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (loaded || activeUsers.length > 0 || !usersParam) return;
        setLoaded(true);
        const ids = usersParam.split(',');
        Promise.all(ids.map(async (id) => {
            const resUser = await fetch(`/api/users/${id}`);
            if (!resUser.ok) throw new Error(`Failed to fetch user ${id}`);
            const userData = await resUser.json();
            const resScores = await fetch(`/api/users/${id}/scores`);
            if (!resScores.ok) throw new Error(`Failed to fetch scores for ${id}`);
            const scores = await resScores.json();
            return { ...userData, scores: Array.isArray(scores) ? scores : [], isDefuser: false };
        })).then((newUsers) => {
            if (newUsers.length > 0) {
                newUsers[0].isDefuser = true;
            }
            setActiveUsers(newUsers);
        }).catch((err) => {
            console.error('Error loading users from params:', err);
        });
    }, [usersParam, activeUsers, setActiveUsers, loaded]);

    const { data: mission, isLoading, error } = useQuery({
        queryKey: ['mission', missionName],
        queryFn: async () => {
            const res = await fetch(`/api/missions/${encodeURIComponent(missionName)}`);
            if (!res.ok) throw new Error('Failed to fetch mission');
            return res.json();
        },
    });
    if (isLoading) return <p>Loading mission...</p>;
    if (error) return <p>Error: {error.message}</p>;
    if (!mission) return <p>No mission found.</p>;
    return <MissionPageContent mission={mission} activeUsers={activeUsers} addUser={addUser} removeUser={removeUser} setDefuser={setDefuser} />;
}