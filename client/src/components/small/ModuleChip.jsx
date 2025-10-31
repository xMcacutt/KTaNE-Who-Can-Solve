import { useState, useEffect } from 'react';
import { Card, Box, Typography, Link, Chip, Avatar, useTheme, useMediaQuery } from '@mui/material';
import { getHeatmapColor, bossToColor, confidenceIcons, truncate } from "../../utility";
import ModuleIcon from './ModuleIcon';

function ModuleChip({ module, probability, viewStyle, users, authUser }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const encodedModuleName = encodeURIComponent(module.icon_file_name);
    const [bgImageUrl, setBgImageUrl] = useState('');
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

    const avatarSize = isMobile ? (userCount === 1 ? 64 : userCount === 2 ? 56 : userCount === 3 ? 48 : 40)
        : (userCount === 1 ? 72 : userCount === 2 ? 64 : userCount === 3 ? 56 : 48);
    const borderWidth = userCount <= 2 ? 4 : 3;

    return (
        <Card
            sx={{
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                width: isMobile ? 180 : 300,
                backgroundColor: viewStyle === 'Difficulty Heatmap' ? getHeatmapColor(module) : 'rgba(0, 0, 0, 0.0)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            {
                viewStyle === 'Large Icons' &&
                <ModuleIcon iconFileName={encodedModuleName} size="100%" style={{
                    position: 'absolute',
                    filter: 'blur(6px) brightness(0.3) saturate(0.8)',
                    imageRendering: 'pixelated',
                }} />
            }


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
                        <ModuleIcon iconFileName={encodedModuleName} size={isMobile ? 32 : 40} />
                    )}
                    <Link href={manualUrl}>
                        <Typography variant="h6" fontSize={isMobile ? "0.6rem" : "1.4rem"}>{truncate(module.name, 21)}</Typography>
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
                            textAlign: 'center',
                            height: isMobile ? 15 : 25,
                            padding: 0.5,
                            fontSize: isMobile ? "0.7rem" : "1rem"
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
                            textAlign: 'center',
                            height: isMobile ? 15 : 25,
                            padding: 0.5,
                            fontSize: isMobile ? "0.7rem" : "1rem"
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
                    width: isMobile ? 24 : 32,
                    height: isMobile ? 24 : 32,
                    borderRadius: 1,
                    padding: 0.5,
                }}
            />
        </Card>
    );
}

export default ModuleChip;