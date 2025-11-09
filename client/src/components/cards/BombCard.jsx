import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Tooltip, Stack, Link, useTheme, useMediaQuery, Chip, Grid, CircularProgress, Avatar, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/StarBorder";
import StarFilledIcon from "@mui/icons-material/Star";
import { formatTime } from "../../utility";
import { truncate } from "../../utility";
import ModuleIcon from "../small/ModuleIcon";
import useBombCard from "../../hooks/useBombCard";
import { Link as RouterLink } from "react-router-dom";
import { ReactComponent as BombIcon } from '../../assets/Bomb.svg';

function BombCard({
    mission,
    users,
    sort,
    onFavouriteChanged,
    authUser,
}) {
    const {
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
                        flex: { xs: "1 1 100%", md: "1 1 45%" },
                        minWidth: 0,
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

                            <Link component={RouterLink} to={missionPageUrl} underline="hover">
                                <Typography variant="bebas" fontSize="1.5rem" noWrap sx={{ cursor: "pointer" }}>
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
                        flex: { xs: "1 1 100%", md: "1 1 35%" },
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        mt: { xs: 2, md: 0 },
                    }}
                >
                    {authUser && (
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                alignItems: "flex-start",
                                gap: 2,
                                mt: 2,
                                width: "100%",
                            }}
                        >
                            {userModuleStats.map((u) => (
                                <Box key={u.id} textAlign="center">
                                    <Box
                                        sx={{
                                            position: "relative",
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Tooltip title={u.name}>
                                            <Avatar
                                                src={u.avatar}
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                }}
                                            />
                                        </Tooltip>

                                        {u.isDefuser && (
                                            <Tooltip title="Defuser">
                                                <Box
                                                    cursor="pointer"
                                                    component={BombIcon}
                                                    sx={{
                                                        position: "absolute",
                                                        width: 24,
                                                        height: 24,
                                                        transform: "translate(-90%, -30%)",
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Typography variant="body2">{truncate(u.name, 10)}</Typography>
                                    <Typography variant="caption" fontSize="1.2rem">
                                        {u.knownCount}/{u.totalModules}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
                <Box
                    sx={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        mx: 2,
                        minWidth: "fit-content",
                    }}
                >
                    <Stack direction="row" spacing={-2}>
                        {isLoading ? (
                            <CircularProgress size={20} />
                        ) : (
                            (() => {
                                let visibleIndex = 0;
                                return sortedModuleIds
                                    .slice()
                                    .reverse()
                                    .map((moduleId, idx) => {
                                        if (!moduleId) {
                                            return (
                                                <Box
                                                    key={`empty-${idx}`}
                                                    sx={{
                                                        width: 64,
                                                        height: 64,
                                                        opacity: 0.05,
                                                    }}
                                                />
                                            );
                                        }

                                        const moduleData = modulesData[moduleId];
                                        if (!moduleData?.icon_file_name) return null;

                                        const brightness = 1 - visibleIndex * 0.15;
                                        visibleIndex += 1;

                                        const encodedModuleName = encodeURIComponent(moduleData.icon_file_name);
                                        return (
                                            <ModuleIcon
                                                key={moduleId}
                                                iconFileName={encodedModuleName}
                                                size={64}
                                                style={{
                                                    filter: `brightness(${brightness})`,
                                                    zIndex: 5 - visibleIndex,
                                                    imageRendering: "pixelated",
                                                }}
                                            />
                                        );
                                    });
                            })()
                        )}
                    </Stack>
                </Box>
            </CardContent >
        </Card >
    );
}

export default React.memo(BombCard);