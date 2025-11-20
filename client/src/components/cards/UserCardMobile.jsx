import React from "react";
import { useNavigate } from "react-router-dom";
import { truncate } from "../../utility"
import { Card, CardContent, Box, Typography, Avatar, Stack, Grid } from "@mui/material";
import ConfidenceInfo from "../small/ConfidenceInfo";
import ConfidenceBlock from "../small/ConfidenceBlock";

function UserCard({
    user,
    index,
    sortType,
    confidenceView
}) {
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
                return <ConfidenceBlock title="Regular" data={reg} isMobile={true} />;
            case "needy":
                return <ConfidenceBlock title="Needy" data={needy} isMobile={true} />;
            case "combined":
                return <ConfidenceBlock title="Regular & Needy" data={combined} isMobile={true} />;
            case "split":
            default:
                return (
                    <Stack direction="column" spacing={1}>
                        <ConfidenceBlock title="Regular" data={reg} isMobile={true} />
                        <ConfidenceBlock title="Needy" data={needy} isMobile={true} />
                    </Stack>
                );
        }
    };

    const renderScore = () => {
        switch (sortType) {
            case "defuser": return `Score: ${user.defuser_score}`;
            case "expert": return `Score: ${user.expert_score}`;
            case "solo": return `Score: ${user.solo_score}`;
            default: return `Score: ${user.combined_score}`;
        }
    };

    return (
        <Card
            onClick={() => navigate(`/profile/${user.id}`)}
            sx={{
                '&:hover': {
                    backgroundColor: 'action.hover',
                    boxShadow: 6,
                },
                transition: 'background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
            }}
        >
            <CardContent>
                <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                    <Grid item sx={{ pl: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={user.avatar} sx={{ width: 38, height: 38 }} />
                            <Box minWidth={"22vw"}>
                                <Typography variant="bebas" fontSize="19">{truncate(user.name, 15)}</Typography>
                                <Typography variant="subtitle1" fontWeight="bold" fontSize="13">
                                    Rank: #{user.rank}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="bold" fontSize="13" color="text.secondary">
                                    {renderScore()}
                                </Typography>
                            </Box>
                            {renderConfidences()}
                        </Stack>
                        <Stack direction="row" spacing={4} mt={1}>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default React.memo(UserCard);
