import React from "react";
import { useNavigate } from "react-router-dom";
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
            <Stack direction="row" spacing={3}>
                <Box>
                    <Typography variant="subtitle2">Defuser:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ConfidenceInfo type="confident" count={user.defuser_confident}/>
                        <ConfidenceInfo type="attempted" count={user.defuser_attempted}/>
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Expert:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ConfidenceInfo type="confident" count={user.expert_confident}/>
                        <ConfidenceInfo type="attempted" count={user.expert_attempted}/>
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Solo:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ConfidenceInfo type="solo" count={user.solo_count}/>
                    </Stack>
                </Box>
            </Stack>
        );
    };

    const renderScore = () => {
        switch (sortType) {
            case "defuser":
                return `Defuser Score: ${user.defuser_score}`;
            case "expert":
                return `Expert Score: ${user.expert_score}`;
            case "solo":
                return `Solo Score: ${user.solo_score}`;
            default:
                return `Combined Score: ${user.combined_score}`;
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
                    <Grid item sx={{ pl: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={user.avatar} alt={user.name} sx={{ width: 48, height: 48 }} />
                            <Box>
                                <Typography variant="bebas" fontSize="1.4rem">{user.name}</Typography>
                                <Stack direction="row" spacing={4} mt={1}>
                                    {renderConfidences()}
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item sx={{ pr: 2 }}>
                        <Stack spacing={0.5} alignItems="flex-end" justifyContent="center">
                            <Typography variant="subtitle1" fontWeight="bold">
                                Rank: #{user.rank}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {renderScore()}
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default React.memo(UserCard);
