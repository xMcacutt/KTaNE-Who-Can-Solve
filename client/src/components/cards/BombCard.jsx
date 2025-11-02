import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Stack, Link, useTheme, useMediaQuery, Chip, Grid, CircularProgress, Avatar, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/StarBorder";
import StarFilledIcon from "@mui/icons-material/Star";
import { formatTime } from "../../utility";
import { truncate } from "../../utility";
import ModuleIcon from "../small/ModuleIcon";
import useBombCard from "../../hooks/useBombCard";
import { useNavigate } from "react-router-dom";


function BombCard({
    mission,
    users,
    sort,
    onFavouriteChanged,
    authUser,
}) {
    const navigate = useNavigate();
    const {
        bombs,
        missionPageUrl,
        isFavourite,
        handleFavouriteSet,
        isLoading,
        modulesData,
        formattedDate,
        totalModules,
        totalTime,
        sortedModuleIds,
        userModuleStats
    } = useBombCard(mission, users, onFavouriteChanged, authUser);

    return (
        <Card
            onClick={() => navigate(missionPageUrl)}
            sx={{
                '&:hover': {
                    backgroundColor: 'action.hover',
                    boxShadow: 6,
                },
                transition: 'background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
            }}
        >
            <CardContent>
                <Grid container spacing={3} alignItems="center">
                    {
                        authUser &&
                        <Grid xs={12}>
                            <IconButton onClick={handleFavouriteSet}>
                                {isFavourite ? <StarFilledIcon /> : <StarIcon />}
                            </IconButton>
                        </Grid>
                    }
                    <Grid xs={12}>
                        <Box display="flex" alignItems="center" gap={4}>
                            <Box ml={2}>
                                <Typography variant="h6">{mission.mission_name}</Typography>
                                <Typography variant="body2">By: {mission.authors?.join(", ") || "Unknown"} {formattedDate}</Typography>
                                <Typography variant="body2">{mission.pack_name}</Typography>
                                <Box
                                    id="chips"
                                    display="flex"
                                    flexWrap="wrap"
                                    maxWidth="50vh"
                                    gap={1}
                                    mt={1}
                                >
                                    <Chip label={`Modules: ${totalModules}${mission.bombs.length > 1 ? ` in ${mission.bombs.length}` : ""}`} size="small" sx={{ pt: 0.35 }} />
                                    <Chip label={`Time: ${formatTime(totalTime)}`} size="small" sx={{ pt: 0.35 }} />
                                    {sort === "difficulty" && mission.difficulty != null && (
                                        <Chip label={`Difficulty: ${mission.difficulty.toFixed(2)}`} size="small" sx={{ pt: 0.35 }} />
                                    )}
                                    {
                                        mission.factory &&
                                        <Chip label={`Factory: ${mission.factory}`} size="small" sx={{ pt: 0.35, backgroundColor: "#4444aa" }} />
                                    }
                                    {
                                        mission.time_mode &&
                                        <Chip label={`Time Mode: ${mission.time_mode}`} size="small" sx={{ pt: 0.35, backgroundColor: "#4444aa" }} />
                                    }
                                    {
                                        mission.strike_mode &&
                                        <Chip label={`Strike Mode: ${mission.strike_mode}`} size="small" sx={{ pt: 0.35, backgroundColor: "#4444aa" }} />
                                    }
                                    {
                                        !mission.verified &&
                                        <Chip label={`Unverified`} size="small" sx={{ pt: 0.35, backgroundColor: "#e74c3c" }} />
                                    }

                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid xs={12} flexGrow={1}>
                        <Box display="flex" justifyContent="flex-start">
                            {
                                authUser &&
                                <Grid container spacing={1} sx={{ mt: 2 }}>
                                    {userModuleStats.map((u) => (
                                        <Grid key={u.id} xs={3}>
                                            <Box textAlign="center">
                                                <Avatar src={u.avatar} sx={{ mx: "auto", mb: 1 }} />
                                                <Typography variant="body2">{truncate(u.name, 10)}</Typography>
                                                <Typography variant="caption" fontSize="1.2rem">
                                                    {u.knownCount}/{u.totalModules}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            }
                        </Box>
                    </Grid>
                    <Grid xs={12}>
                        <Stack direction="row" spacing={-2}>
                            {isLoading ? (
                                <CircularProgress size={20} />
                            ) : (
                                sortedModuleIds.reverse().map((moduleId, idx) => {
                                    const moduleData = modulesData[moduleId];
                                    if (!moduleData || !moduleData.icon_file_name) {
                                        return null;
                                    }
                                    const encodedModuleName = encodeURIComponent(moduleData.icon_file_name);
                                    return (
                                        <ModuleIcon key={moduleId} iconFileName={encodedModuleName} size={64} style={
                                            {
                                                filter: `brightness(${0.2 * (5 - idx)})`,
                                                zIndex: 5 - idx,
                                                imageRendering: 'pixelated'
                                            }
                                        } />
                                    );
                                })
                            )
                            }
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent >
        </Card >
    );
}

export default React.memo(BombCard);