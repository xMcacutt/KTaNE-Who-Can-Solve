import React from "react";
import axios from "axios";
import { bossToColor, confidenceIcons, confidenceOptions, truncate } from "../../utility";
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel, Link, Chip, Grid, Checkbox, FormControlLabel } from "@mui/material";
import useModuleCard from "../../hooks/useModuleCard";
import ModuleIcon from "../small/ModuleIcon";

function ModuleCardMobile({
    module,
    index,
    user,
    authUser,
    score,
    setScores,
    refetchScores,
}) {
    const encodedModuleName = encodeURIComponent(module.icon_file_name);
    const { handleScoreChange } = useModuleCard({ module, user, authUser, score, setScores, refetchScores });
    const manualUrl = `https://ktane.timwi.de/redirect/#${encodedModuleName}`;

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
            <CardContent>
                <Grid container spacing={2} alignItems="stretch" direction="row">
                    <Grid item xs={12} md={9} size={6} flexGrow={1}>
                        <Box display="flex" flexDirection="column" gap={1} height="100%">
                            <Box display="flex" alignItems="center" gap={2}>
                                <ModuleIcon iconFileName={encodedModuleName} size={64} />
                                <Link href={manualUrl} underline="hover">
                                    <Typography variant="h6">{module.name}</Typography>
                                </Link>
                            </Box>

                            <Typography variant="body2">{truncate(module.description, 100)}</Typography>

                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                <Chip label={`Defuser: ${module.defuser_difficulty || "N/A"}`} size="small" />
                                <Chip label={`Expert: ${module.expert_difficulty || "N/A"}`} size="small" />
                                {module.type !== "Regular" && (
                                    <Chip label={`${module.type}`} size="small" sx={{ backgroundColor: "#4444aa" }} />
                                )}
                                {module.boss_status && (
                                    <Chip label={`${module.boss_status}`} size="small" sx={{ backgroundColor: bossToColor(module.boss_status) }} />
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        md={3}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {user ? (
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box
                                        component="img"
                                        width={15}
                                        height={15}
                                        src={confidenceIcons[score?.defuserConfidence || "Unknown"]}
                                        alt={score?.defuserConfidence || "Unknown"}
                                    />
                                    <FormControl sx={{ minWidth: 90 }} size="small">
                                        <InputLabel id="defuser-conf-label">Defuser</InputLabel>
                                        <Select
                                            labelId="defuser-conf-label"
                                            label="Defuser"
                                            value={score?.defuserConfidence || "Unknown"}
                                            disabled={!authUser || authUser.id !== user.id}
                                            onChange={(e) => handleScoreChange("defuser", e.target.value)}
                                            sx={{
                                                fontSize: 14,
                                            }}
                                        >
                                            {confidenceOptions.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={score?.canSolo || false}
                                            onChange={(e) => handleScoreChange("solo", e.target.checked)}
                                            disabled={!authUser || authUser.id !== user.id}
                                        />
                                    }
                                    label="Can Solo"
                                    labelPlacement="end"
                                    sx={{ m: 0, fontSize: 12 }}
                                />
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box
                                        component="img"
                                        width={15}
                                        height={15}
                                        src={confidenceIcons[score?.expertConfidence || "Unknown"]}
                                        alt={score?.expertConfidence || "Unknown"}
                                    />
                                    <FormControl sx={{ minWidth: 90 }} size="small">
                                        <InputLabel id="expert-conf-label">Expert</InputLabel>
                                        <Select
                                            labelId="expert-conf-label"
                                            label="Expert"
                                            value={score?.expertConfidence || "Unknown"}
                                            disabled={!authUser || authUser.id !== user.id}
                                            onChange={(e) => handleScoreChange("expert", e.target.value)}
                                            sx={{
                                                fontSize: 14,
                                            }}
                                        >
                                            {confidenceOptions.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        ) : (
                            <Typography variant="body2" align="center" fontStyle="italic">
                                Log in to edit scores
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>

    );
}

export default React.memo(ModuleCardMobile);