import React from "react";
import axios from "axios";
import { bossToColor, confidenceIcons, confidenceOptions } from "../../utility";
import { Card, CardContent, Typography, Box, Tooltip, Select, MenuItem, FormControl, InputLabel, Link, Chip, Grid, Checkbox, FormControlLabel } from "@mui/material";
import useModuleCard from "../../hooks/useModuleCard";
import ModuleIcon from "../small/ModuleIcon";
import { ReactComponent as BossIcon } from '../../assets/Boss.svg';
import { ReactComponent as NeedyIcon } from '../../assets/Needy.svg';
import { ReactComponent as QuirkIcon } from '../../assets/Quirk.svg';

function ModuleCard({
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
    const formattedDate = module.published
        ? new Date(module.published).toISOString().split("T")[0]
        : "N/A";

    return (
        <Card
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                '&:hover': {
                    backgroundColor: 'action.hover',
                    boxShadow: 6,
                },
                transition: 'background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
            }}
        >
            <CardContent sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexGrow: 1,
                gap: 3,
                flexWrap: "wrap",
                width: "100%",
            }}>
                <Box sx={{
                    ml: 2,
                    display: "flex",
                    flex: "1 1 50%",
                    flexDirection: "row",
                    alignItems: "center",
                    height: "100%",
                }}>
                    <ModuleIcon iconFileName={encodedModuleName} size={72} />
                    <Box ml={5}>
                        <Link href={manualUrl}>
                            <Typography variant="bebas" fontSize="1.5rem">{module.name}</Typography>
                        </Link>
                        <Typography variant="body2">{module.description}</Typography>
                        <Box
                            id="chips"
                            display="flex"
                            flexWrap="wrap"
                            gap={1}
                            mt={1}
                        >
                            <Chip label={`Authors: ${module.developers?.join(", ") || "Unknown"}`} size="small" />
                            <Chip label={`Published: ${formattedDate}`} size="small" />
                            <Chip label={`Defuser: ${module.defuser_difficulty || "N/A"}`} size="small" />
                            <Chip label={`Expert: ${module.expert_difficulty || "N/A"}`} size="small" />
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                    }}
                >
                    {module.type === "Needy" && (
                        <Tooltip title={module.type}>
                            <Box backgroundColor="#4343eaff" sx={{ cursor: 'pointer', borderRadius: "50%", p: 0.5 }}>
                                <Box
                                    component={NeedyIcon}
                                    sx={{
                                        height: 32,
                                        width: 32,
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    )}
                    {module.boss_status && (
                        <Tooltip title={module.boss_status}>
                            <Box backgroundColor={bossToColor(module.boss_status)} sx={{ alignItems: 'center', cursor: 'pointer', borderRadius: 5, p: 0.5 }}>
                                <Box
                                    component={BossIcon}
                                    sx={{
                                        height: 32,
                                        width: 32,
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    )}
                    {module.quirks?.length > 0 && (
                        <Tooltip title={module.quirks.join(', ')}>
                            <Box backgroundColor="#28a835ff" sx={{ alignItems: 'center', cursor: 'pointer', borderRadius: 5, p: 0.5 }}>
                                <Box
                                    component={QuirkIcon}
                                    sx={{
                                        height: 32,
                                        width: 32,
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    )}
                </Box>

                <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    gap={2}
                    flex="1 1 20%"
                >
                    {user ? (
                        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} alignItems="center" gap={2}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={score?.canSolo || false}
                                        onChange={(e) => handleScoreChange("solo", e.target.checked)}
                                        disabled={!authUser || authUser.id !== user.id}
                                    />
                                }
                                label="Can Solo"
                                labelPlacement="top"
                                sx={{ m: 0, whiteSpace: "nowrap" }}
                            />
                            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                                <Box display="flex" alignItems="center">
                                    <Box
                                        component="img"
                                        width={25}
                                        height={25}
                                        src={confidenceIcons[score?.defuserConfidence || "Unknown"]}
                                        alt={score?.defuserConfidence || "Unknown"}
                                    />
                                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel id="defuser-conf-label">Defuser</InputLabel>
                                        <Select
                                            labelId="defuser-conf-label"
                                            label="Defuser"
                                            value={score?.defuserConfidence || "Unknown"}
                                            disabled={!authUser || authUser.id !== user.id}
                                            onChange={(e) => handleScoreChange("defuser", e.target.value)}
                                        >
                                            {confidenceOptions.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box display="flex" alignItems="center">
                                    <Box
                                        component="img"
                                        width={25}
                                        height={25}
                                        src={confidenceIcons[score?.expertConfidence || "Unknown"]}
                                        alt={score?.expertConfidence || "Unknown"}
                                    />
                                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel id="expert-conf-label">Expert</InputLabel>
                                        <Select
                                            labelId="expert-conf-label"
                                            label="Expert"
                                            value={score?.expertConfidence || "Unknown"}
                                            disabled={!authUser || authUser.id !== user.id}
                                            onChange={(e) => handleScoreChange("expert", e.target.value)}
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
                        </Box>
                    ) : (
                        <Typography variant="body2" align="center" fontStyle="italic" flexWrap="wrap">
                            Log in to edit scores
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card >
    );
}

export default React.memo(ModuleCard);