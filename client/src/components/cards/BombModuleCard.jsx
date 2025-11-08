import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Link,
    Chip,
    Avatar,
    Grid,
    useTheme,
    useMediaQuery,
    Tooltip,
} from "@mui/material";
import ModuleIcon from "../small/ModuleIcon";
import { getHeatmapColor, bossToColor, confidenceIcons, truncate } from "../../utility";
import { useState } from "react";
import { useEffect } from "react";
import { ReactComponent as BossIcon } from '../../assets/Boss.svg';
import { ReactComponent as NeedyIcon } from '../../assets/Needy.svg';
import { ReactComponent as QuirkIcon } from '../../assets/Quirk.svg';
import { ReactComponent as BombIcon } from '../../assets/Bomb.svg';

function BombModuleCard({ module, probability, viewStyle, users, authUser }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const encodedModuleName = encodeURI(module.icon_file_name);
    const manualUrl = `https://ktane.timwi.de/redirect/#${encodedModuleName}`;

    const [largeIconUrl, setBackgroundUrl] = useState("");
    useEffect(() => {
        const img = new Image();
        const remoteUrl = `https://raw.githubusercontent.com/Timwi/KtaneContent/refs/heads/master/Icons/${encodedModuleName}.png`;
        const localUrl = `/icons/${module.icon_file_name}.png`;

        img.src = remoteUrl;
        img.onload = () => setBackgroundUrl(remoteUrl);
        img.onerror = () => {
            const localImg = new Image();
            localImg.src = localUrl;
            localImg.onload = () => setBackgroundUrl(localUrl);
            localImg.onerror = () => setBackgroundUrl("/icons/Unknown Module.png");
        };
    }, [encodedModuleName]);

    let effectiveUsers = [...users];
    if (users.length === 1) {
        const single = users[0];
        effectiveUsers = [
            { ...single, isDefuser: true },
            { ...single, isDefuser: false },
        ];
    }

    const defuser = effectiveUsers.find(u => u.isDefuser) || null;
    const experts = effectiveUsers.filter(u => !u.isDefuser);

    const defuserScores = Array.isArray(defuser?.scores)
        ? defuser.scores.find(s => s.module_id === module.module_id)
        : undefined;
    const defuserConf = defuserScores?.defuser_confidence || "Unknown";
    const expertConfs = experts.map(e => {
        const scores = Array.isArray(e.scores) ? e.scores : [];
        return scores.find(s => s.module_id === module.module_id)?.expert_confidence || "Unknown";
    });

    let summaryIcon = confidenceIcons.Avoid;
    const anyExpertConfident = expertConfs.includes("Confident");
    if (defuserScores?.can_solo)
        summaryIcon = confidenceIcons.Solo
    else if
        (defuserConf === "Confident" && anyExpertConfident) summaryIcon = confidenceIcons.Confident;
    else if
        (defuserConf === "Confident" || anyExpertConfident) summaryIcon = confidenceIcons.Attempted;


    const cardBg =
        viewStyle === "Difficulty Heatmap"
            ? getHeatmapColor(module)
            : "rgba(30, 30, 30, 0.5)";

    const cardStyle =
        viewStyle === "Large Icons"
            ? {
                position: "relative",
                overflow: "hidden",
                backgroundColor: cardBg,
                color: "white",
            }
            : {
                backgroundColor: cardBg,
                color: "white",
            };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
            }}
        >
            <Card
                sx={{
                    ...cardStyle,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: isMobile ? "100%" : "100%",
                    minHeight: isMobile ? 64 : 80,
                    overflow: "hidden",
                    px: 2,
                    py: 1,
                    position: "relative",
                    "&:hover": {
                        filter: "brightness(1.15)",
                        boxShadow: 4,
                    },
                }}
            >

                {viewStyle === "Large Icons" && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url("${largeIconUrl}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(15px) brightness(0.3)",
                            zIndex: 0,
                        }}
                    />
                )}

                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexGrow: 1,
                        zIndex: 1,
                        width: "100%",
                        p: "4px !important",
                    }}
                >

                    <Box
                        sx={{
                            width: "40%",
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden",
                            gap: isMobile ? 2 : 3,
                            mr: isMobile ? 2 : 3
                        }}
                    >
                        {(viewStyle === "Small Icons" || viewStyle === "Difficulty Heatmap") && (
                            <ModuleIcon iconFileName={encodedModuleName} size={isMobile ? 36 : 48} />
                        )}
                        <Link
                            href={manualUrl}
                            target="_blank"
                            underline="hover"
                            sx={{ color: "white", fontWeight: 600, width: "100%" }}
                        >
                            <Typography
                                variant="ostrich"
                                noWrap
                                sx={{ fontSize: isMobile ? "1rem" : "1.3vw", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                                {truncate(module.name, 24)}
                            </Typography>
                        </Link>
                    </Box>
                    {
                        authUser && users.length > 0 && (
                            <Box
                                sx={{
                                    width: "40%",
                                    display: "flex",
                                    mr: 2,
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                }}
                            >
                                {effectiveUsers.map((user, i) => {
                                    const userScores = Array.isArray(user.scores) ? user.scores : [];
                                    const score = userScores.find(s => s.module_id === module.module_id) || {};
                                    const conf = user.isDefuser ? score.defuser_confidence : score.expert_confidence;
                                    var iconSrc =
                                        conf === "Confident"
                                            ? confidenceIcons.Confident
                                            : conf === "Attempted"
                                                ? confidenceIcons.Attempted
                                                : conf === "Avoid"
                                                    ? confidenceIcons.Avoid
                                                    : confidenceIcons.Unknown;
                                    var brightness =
                                        conf === "Confident"
                                            ? 1.0
                                            : conf === "Attempted"
                                                ? 0.8
                                                : conf === "Avoid"
                                                    ? 0.1
                                                    : 0.4;

                                    if (user.isDefuser && score.can_solo) {
                                        iconSrc = confidenceIcons.Solo;
                                        brightness = 1.0;
                                    }

                                    return (
                                        <Box
                                            key={i}
                                            sx={{
                                                position: "relative",
                                                flex: 1,
                                                display: "flex",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Tooltip title={user.name}>
                                                <Avatar
                                                    src={user.avatar}
                                                    sx={{
                                                        filter: `brightness(${brightness})`,
                                                        width: isMobile ? 28 : 48,
                                                        height: isMobile ? 28 : 48,
                                                    }}
                                                />
                                            </Tooltip>
                                            <Box
                                                component="img"
                                                src={iconSrc}
                                                sx={{
                                                    position: "absolute",
                                                    width: isMobile ? 18 : 24,
                                                    height: isMobile ? 18 : 24,
                                                    transform: "translate(90%, 90%)",
                                                }}
                                            />
                                            {
                                                user.isDefuser && (
                                                    <Tooltip title="Defuser">
                                                        <Box cursor="pointer"
                                                            component={BombIcon}
                                                            sx={{
                                                                position: "absolute",
                                                                width: isMobile ? 18 : 24,
                                                                height: isMobile ? 18 : 24,
                                                                transform: "translate(-90%, -30%)",
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )
                                            }
                                        </Box>
                                    );
                                })}
                            </Box>
                        )
                    }

                    <Box
                        sx={{
                            width: "15%",
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
                        sx={{
                            width: "10%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            fontWeight: "bold",
                            fontSize: isMobile ? "0.8rem" : "1.5vw",
                            textAlign: "right",
                            mr: 10,
                        }}
                    >
                        {probability != null ? `${probability}%` : ""}
                    </Box>

                    <Box
                        component="img"
                        src={summaryIcon}
                        alt="summary confidence"
                        sx={{
                            width: "15%",
                            width: isMobile ? 24 : 32,
                            height: isMobile ? 24 : 32,
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    );
}

export default React.memo(BombModuleCard);
