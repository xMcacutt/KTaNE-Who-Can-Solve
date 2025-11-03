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
    filters
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
        userModuleStats,
    } = useBombCard(mission, users, onFavouriteChanged, authUser);

    return (
        <Card
            sx={{
                '&:hover': {
                    backgroundColor: 'action.hover',
                    boxShadow: 6,
                },
                transition: 'background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
            }}
        >
            <CardContent
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexGrow: 1,
                    zIndex: 1,
                    width: "100%",
                    px: "4px !important",
                    py: "8px !important",
                    mt: 0.5,
                    mb: 1
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flex: "1 1 50%",
                        overflow: "hidden",
                    }}
                >
                    {
                        authUser &&
                        <Box
                            sx={{
                                flex: "0 0 auto",
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                            }}
                            mx={2}
                        >
                            <IconButton onClick={handleFavouriteSet}>
                                {isFavourite ? <StarFilledIcon /> : <StarIcon />}
                            </IconButton>
                        </Box>
                    }
                    <Box
                        sx={{
                            flex: "1 1 auto",
                            display: "flex",
                            overflow: "hidden",
                        }}
                    >
                        <Box ml={2}>

                            <Link underline="hover">

                                <Typography
                                    variant="h6"
                                    noWrap
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => navigate(missionPageUrl)}
                                >
                                    {mission.mission_name}
                                </Typography>
                            </Link>
                            <Typography variant="body2">
                                by {mission.authors?.join(", ") || "Unknown"} {formattedDate}
                            </Typography>
                            <Typography variant="body2">{mission.pack_name}</Typography>

                            <Box
                                id="chips"
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    maxWidth: "50vh",
                                    gap: 1,
                                    mt: 1,
                                }}
                            >
                                <Chip
                                    label={`Modules: ${totalModules}${mission.bombs.length > 1 ? ` in ${mission.bombs.length}` : ""
                                        }`}
                                    size="small"
                                    sx={{ pt: 0.35 }}
                                />
                                <Chip
                                    label={`Time: ${formatTime(totalTime)}`}
                                    size="small"
                                    sx={{ pt: 0.35 }}
                                />
                                {sort === "difficulty" && mission.difficulty != null && (
                                    <Chip
                                        label={`Difficulty: ${mission.difficulty.toFixed(2)}`}
                                        size="small"
                                        sx={{ pt: 0.35 }}
                                    />
                                )}
                                {mission.factory && (
                                    <Chip
                                        label={`Factory: ${mission.factory}`}
                                        size="small"
                                        sx={{ pt: 0.35, backgroundColor: "#4444aa" }}
                                    />
                                )}
                                {mission.time_mode && (
                                    <Chip
                                        label={`Time Mode: ${mission.time_mode}`}
                                        size="small"
                                        sx={{ pt: 0.35, backgroundColor: "#4444aa" }}
                                    />
                                )}
                                {mission.strike_mode && (
                                    <Chip
                                        label={`Strike Mode: ${mission.strike_mode}`}
                                        size="small"
                                        sx={{ pt: 0.35, backgroundColor: "#4444aa" }}
                                    />
                                )}
                                {!mission.verified && (
                                    <Chip
                                        label="Unverified"
                                        size="small"
                                        sx={{ pt: 0.35, backgroundColor: "#e74c3c" }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box
                    sx={{
                        flex: "1 1 auto",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                    }}
                >
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
                </Box>
                <Box
                    sx={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        mx: 2,
                    }}
                >
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
                </Box>
            </CardContent >
        </Card >
    );
}

export default React.memo(BombCard);