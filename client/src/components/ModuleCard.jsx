import React from "react";
import axios from "axios";
import { bossToColor, confidenceIcons, confidenceOptions } from "../utility";
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel, Link, Chip, Grid, Checkbox, FormControlLabel } from "@mui/material";

function ModuleCard({
    module,
    index,
    user,
    authUser,
    score,
    setScores,
    refetchScores,
}) {
    const handleScoreChange = async (type, value) => {
        if (!user) return;
        const prevScore = score || { defuserConfidence: "Unknown", expertConfidence: "Unknown", canSolo: false };
        let newScore = { ...prevScore };
        if (type === "defuser") {
            newScore.defuserConfidence = value;
        } else if (type === "expert") {
            newScore.expertConfidence = value;
        } else if (type === "solo") {
            newScore.canSolo = value;
        }
        setScores((prev) => ({
            ...prev,
            [module.module_id]: newScore,
        }));
        try {
            await axios.put(
                `/api/scores/${module.module_id}`,
                {
                    defuserConfidence: newScore.defuserConfidence,
                    expertConfidence: newScore.expertConfidence,
                    canSolo: newScore.canSolo,
                },
                { withCredentials: true }
            ).then(response => console.log('Update successful:', response.data));
            if (refetchScores) refetchScores();
        } catch (error) {
            console.error("Failed to update score:", error);
            setScores((prev) => ({
                ...prev,
                [module.module_id]: prevScore,
            }));
        }
    };

    const encodedModuleName = encodeURIComponent(module.icon_file_name);
    const imageUrl = `https://raw.githubusercontent.com/Timwi/KtaneContent/refs/heads/master/Icons/${encodedModuleName}.png`;
    const manualUrl = `https://ktane.timwi.de/redirect/#${encodedModuleName}`;
    const formattedDate = module.published
        ? new Date(module.published).toISOString().split("T")[0]
        : "N/A";

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
                <Grid container alignItems="stretch">
                    <Grid item xs={12} sx={{ pl: 1 }} md={9} width="75%" >
                        <Box display="flex" alignItems="center" height="100%">
                            <Box
                                component="img"
                                src={imageUrl}
                                alt={module.name}
                                width={64}
                                height={64}
                                sx={{
                                    imageRendering: 'pixelated',
                                }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/fallback-img.png";
                                }}
                            />
                            <Box ml={2}>
                                <Link href={manualUrl}>
                                    <Typography variant="h6">{module.name}</Typography>
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
                                    {module.type !== "Regular" && (
                                        <Chip label={`${module.type}`} size="small" style={{ backgroundColor: "#4444aa" }} />
                                    )}
                                    {module.boss_status && (
                                        <Chip label={`${module.boss_status}`} size="small" style={{ backgroundColor: bossToColor(module.boss_status) }} />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={3} width="25%" sx={{
                        display: "flex",
                        pr: 1,
                        justifyContent: "flex-end",
                        alignItems: "center",
                    }}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="flex-end"
                            gap={2}
                            width="100%"
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
                                        sx={{ m: 0 }}
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
                                <Typography variant="body2" align="center" fontStyle="italic">
                                    Log in to view and edit confidence scores
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card >
    );
}

export default React.memo(ModuleCard);