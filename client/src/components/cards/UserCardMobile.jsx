import React from "react";
import { useNavigate } from "react-router-dom";
import { truncate } from "../../utility"
import { Card, CardContent, Box, Typography, Avatar, Stack, Grid } from "@mui/material";
import ConfidenceInfo from "../small/ConfidenceInfo";

function UserCard({
    user,
    index,
    sortType,
}) {
    const navigate = useNavigate();

    const renderConfidences = () => {
        return (
            <Stack direction="row" spacing={2}>
                <Box>
                    <Typography variant="subtitle2">Defuser:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ConfidenceInfo type="confident" count={user.defuser_confident} />
                        <ConfidenceInfo type="attempted" count={user.defuser_attempted} />
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Expert:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ConfidenceInfo type="confident" count={user.expert_confident} />
                        <ConfidenceInfo type="attempted" count={user.expert_attempted} />
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Solo:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ConfidenceInfo type="solo" count={user.solo_count} />
                    </Stack>
                </Box>
            </Stack>
        );
    };

    const renderScore = () => {
        switch (sortType) {
            case "defuser":
                return `Score: ${user.defuser_score}`;
            case "expert":
                return `Score: ${user.expert_score}`;
            case "solo":
                return `Score: ${user.solo_score}`;
            default:
                return `Score: ${user.combined_score}`;
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
                            <Box>
                                <Typography variant="bebas" fontSize="19">{truncate(user.name, 23)}</Typography>
                                <Box display="flex" flexDirection="row" gap={2} alignItems="center">
                                    <Typography variant="subtitle1" fontWeight="bold" fontSize="13">
                                        Rank: #{user.rank}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" fontSize="13" color="text.secondary">
                                        {renderScore()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={4} mt={1}>
                            {renderConfidences()}
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default React.memo(UserCard);
