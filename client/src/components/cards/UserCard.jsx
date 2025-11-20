import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Box, Typography, Avatar, Stack, Grid } from "@mui/material";
import ConfidenceInfo from "../small/ConfidenceInfo";
import ConfidenceBlock from "../small/ConfidenceBlock";

function UserCard({ user, sortType, confidenceView }) {
    const navigate = useNavigate();

    const reg = {
        defuser_unknown: user.regular_defuser_unknown,
        defuser_confident: user.regular_defuser_confident,
        defuser_attempted: user.regular_defuser_attempted,
        defuser_avoid: user.regular_defuser_avoid,

        expert_unknown: user.regular_expert_unknown,
        expert_confident: user.regular_expert_confident,
        expert_attempted: user.regular_expert_attempted,
        expert_avoid: user.regular_expert_avoid,

        solo: user.regular_solo_count,
    };

    const needy = {
        defuser_unknown: user.needy_defuser_unknown,
        defuser_confident: user.needy_defuser_confident,
        defuser_attempted: user.needy_defuser_attempted,
        defuser_avoid: user.needy_defuser_avoid,

        expert_unknown: user.needy_expert_unknown,
        expert_confident: user.needy_expert_confident,
        expert_attempted: user.needy_expert_attempted,
        expert_avoid: user.needy_expert_avoid,

        solo: user.needy_solo_count,
    };

    const combined = {
        defuser_unknown: reg.defuser_unknown + needy.defuser_unknown,
        defuser_confident: reg.defuser_confident + needy.defuser_confident,
        defuser_attempted: reg.defuser_attempted + needy.defuser_attempted,
        defuser_avoid: reg.defuser_avoid + needy.defuser_avoid,

        expert_unknown: reg.expert_unknown + needy.expert_unknown,
        expert_confident: reg.expert_confident + needy.expert_confident,
        expert_attempted: reg.expert_attempted + needy.expert_attempted,
        expert_avoid: reg.expert_avoid + needy.expert_avoid,

        solo: reg.solo + needy.solo,
    };

    const renderConfidences = () => {
        switch (confidenceView) {
            case "regular":
                return <ConfidenceBlock title="Regular" data={reg} />;
            case "needy":
                return <ConfidenceBlock title="Needy" data={needy} />;
            case "combined":
                return <ConfidenceBlock title="Regular & Needy" data={combined} />;
            case "split":
            default:
                return (
                    <Stack direction="row" spacing={8}>
                        <ConfidenceBlock title="Regular" data={reg} />
                        <ConfidenceBlock title="Needy" data={needy} />
                    </Stack>
                );
        }
    };

    const renderScore = () => {
        switch (sortType) {
            case "defuser": return `Defuser Score: ${user.defuser_score}`;
            case "expert": return `Expert Score: ${user.expert_score}`;
            case "solo": return `Solo Score: ${user.solo_score}`;
            default: return `Combined Score: ${user.combined_score}`;
        }
    };

    return (
        <Card
            onClick={() => navigate(`/profile/${user.id}`)}
            sx={{
                "&:hover": {
                    backgroundColor: "action.hover",
                    boxShadow: 6,
                },
                transition: "all 0.15s ease-in-out",
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
                    mb: 1,
                    mx: 2
                }}
            >
                <Box
                    sx={{
                        flex: "1 1 auto",
                        display: "flex",
                        overflow: "hidden",
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={user.avatar} alt={user.name} sx={{ width: 48, height: 48 }} />

                        <Box sx={{ minWidth: "22vw" }}>
                            <Typography variant="bebas" fontSize="1.4rem" noWrap>
                                {user.name}
                            </Typography>
                        </Box>

                        <Box sx={{ flexGrow: 1 }}>
                            {renderConfidences()}
                        </Box>
                    </Stack>

                </Box>
                <Box
                    sx={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        mx: 4,
                        minWidth: "fit-content",
                    }}
                >
                    <Stack alignItems="flex-end">
                        <Typography fontWeight="bold">Rank #{user.rank}</Typography>
                        <Typography color="text.secondary">{renderScore()}</Typography>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
}

export default React.memo(UserCard);
