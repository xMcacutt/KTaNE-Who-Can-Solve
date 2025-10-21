import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Typography, Box, Link, Chip, Grid, CircularProgress, Avatar, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/StarBorder";
import StarFilledIcon from "@mui/icons-material/Star";
import { formatTime } from "../utility";
import { difficultyMap } from "../utility";
import { truncate } from "../utility";
import axios from "axios";

function BombCard({
    mission,
    users,
    onFavouriteChanged,
    authUser,
}) {
    const missionPageUrl = {
        pathname: `/missions/${encodeURIComponent(mission.mission_name)}`,
        state: { mission, users },
    };
    const [isFavourite, setIsFavourite] = useState(mission.is_favourite);

    useEffect(() => {
        setIsFavourite(mission.is_favourite);
    }, [mission.is_favourite]);

    const handleFavouriteSet = async () => {
        if (!authUser) return;

        const newFavourite = !isFavourite;
        setIsFavourite(newFavourite);

        try {
            await axios.put(
                `/api/users/${authUser.id}/${mission.id}/favourites`,
                { isFavourite: newFavourite },
                { withCredentials: true }
            );
            console.log("Update successful");
            await onFavouriteChanged?.();
        } catch (error) {
            console.error("Failed to update favourite or refetch:", error);
            setIsFavourite(!newFavourite);
        }
    };

    const bombs = Array.isArray(mission.bombs)
        ? mission.bombs
        : JSON.parse(mission.bombs || "[]");

    const allModuleIds = [...new Set(bombs?.flatMap((bomb) => bomb.pools?.flatMap((pool) => pool.modules)) || [])];

    const {
        data: modulesData = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ['modules', mission?.mission_name || JSON.stringify(bombs)],
        queryFn: async () => {
            if (!allModuleIds.length) {
                console.warn('No module names to fetch');
                return {};
            }
            const res = await fetch('/modules/bulk', {
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
                    console.warn('Module missing name:', m);
                }
            });
            return dict;
        },
        enabled: !!bombs && bombs.length > 0 && allModuleIds.length > 0,
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    const formattedDate = mission.date_added
        ? new Date(mission.date_added).toISOString().split("T")[0]
        : "N/A";

    const totalModules = bombs.reduce((sum, bomb) => sum + (bomb.modules || 0), 0);
    const totalTime = bombs.reduce((sum, bomb) => sum + (bomb.time || 0), 0);

    const sortedModuleIds = [...new Set(allModuleIds)]
        .filter((moduleId) => modulesData[moduleId]?.icon_file_name)
        .sort((a, b) => {
            const moduleA = modulesData[a];
            const moduleB = modulesData[b];
            const defuserDiffA = (difficultyMap[moduleA?.defuser_difficulty] || 0);
            const defuserDiffB = (difficultyMap[moduleB?.defuser_difficulty] || 0);
            const expertDiffA = (difficultyMap[moduleA?.expert_difficulty] || 0);
            const expertDiffB = (difficultyMap[moduleB?.expert_difficulty] || 0);
            const valueA = defuserDiffA + expertDiffA;
            const valueB = defuserDiffB + expertDiffB;
            return valueB - valueA;
        })
        .slice(0, 5).reverse();

    return (
        <Card
            sx={{ '&:hover': {
                    backgroundColor: 'action.hover', 
                    boxShadow: 6,
                },
                transition: 'background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',}}
        >
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    {
                        authUser &&
                        <Grid item size={0.3}>
                            <IconButton onClick={handleFavouriteSet}>
                                {isFavourite ? <StarFilledIcon /> : <StarIcon />}
                            </IconButton>
                        </Grid>
                    }
                    <Grid item size={8.6} xs={12} md={9}>
                        <Box display="flex" alignItems="center" gap={4}>
                            <Box ml={2}>
                                <Link component={RouterLink} to={missionPageUrl}>
                                    <Typography variant="h6">{mission.mission_name}</Typography>
                                </Link>
                                <Typography variant="body2">{mission.pack_name}</Typography>
                                <Box
                                    id="chips"
                                    display="flex"
                                    flexWrap="wrap"
                                    gap={1}
                                    mt={1}
                                >
                                    <Chip label={`Authors: ${mission.authors?.join(", ") || "Unknown"}`} size="small" />
                                    <Chip label={`Published: ${formattedDate}`} size="small" />
                                    <Chip label={`Total Modules: ${totalModules}`} size="small" />
                                    <Chip label={`Total Time: ${formatTime(totalTime)}`} size="small" />
                                </Box>
                            </Box>
                            <Grid container spacing={1} sx={{ mt: 2 }}>
                                {users.map((u) => {
                                    const uniqueModuleIds = [
                                        ...new Set(
                                            bombs.flatMap((bomb) =>
                                                bomb.pools?.flatMap((p) =>
                                                    p.modules.map((mod) =>
                                                        typeof mod === "string" ? mod : mod.module_id || mod.id
                                                    )
                                                ) || []
                                            )
                                        ),
                                    ];

                                    const known = uniqueModuleIds.filter((moduleId) => {
                                        const userScores = Array.isArray(u.scores) ? u.scores : [];
                                        const s = userScores.find((sc) => sc.module_id === moduleId);

                                        if (users.length === 1) {
                                            const defConf =
                                                s?.defuser_confidence === "Confident" ||
                                                s?.defuser_confidence === "Attempted";
                                            const expConf =
                                                s?.expert_confidence === "Confident" ||
                                                s?.expert_confidence === "Attempted";
                                            return defConf && expConf;
                                        }

                                        const conf = u.isDefuser
                                            ? s?.defuser_confidence
                                            : s?.expert_confidence;
                                        return conf === "Confident" || conf === "Attempted";
                                    }).length;

                                    return (
                                        <Grid item key={u.id} xs={3}>
                                            <Box textAlign="center">
                                                <Avatar src={u.avatar} sx={{ mx: "auto", mb: 1 }} />
                                                <Typography variant="body2">{truncate(u.name, 10)}</Typography>
                                                <Typography variant="caption" fontSize="1.2rem">
                                                    {known}/{uniqueModuleIds.length}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    </Grid>
                    <Grid item size={3} xs={12} md={3}>
                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            alignItems="center"
                            sx={{ height: '100%' }}
                        >
                            <Box sx={{ position: 'relative', width: 60, height: 40 }}>
                                {isLoading ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    sortedModuleIds.map((moduleId, idx) => {
                                        const moduleData = modulesData[moduleId];
                                        if (!moduleData || !moduleData.icon_file_name) {
                                            return null;
                                        }
                                        const encodedModuleName = encodeURIComponent(moduleData.icon_file_name);
                                        const imageUrl = `https://raw.githubusercontent.com/Timwi/KtaneContent/refs/heads/master/Icons/${encodedModuleName}.png`;
                                        return (
                                            <Box
                                                key={moduleId}
                                                component="img"
                                                src={imageUrl}
                                                alt={moduleData?.name || moduleId}
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    position: 'absolute',
                                                    right: idx * 45,
                                                    filter: `brightness(${0.2 * (idx + 1)})`,
                                                    zIndex: idx,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        );
                                    })
                                )
                                }
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default React.memo(BombCard);