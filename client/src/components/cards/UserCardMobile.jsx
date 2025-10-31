import React from "react";
import { useNavigate } from "react-router-dom";
import { truncate } from "../../utility"
import { Card, CardContent, Box, Typography, Avatar, Stack, Grid } from "@mui/material";

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
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                component="img"
                                src="icons/confident.png"
                                alt="Confident"
                                sx={{ height: "0.9em" }}
                            />
                            <Typography variant="body2">
                                {user.defuser_confident}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                component="img"
                                src="icons/attempted.png"
                                alt="Attempted"
                                sx={{ height: "0.9em" }}
                            />
                            <Typography variant="body2">{user.defuser_attempted}</Typography>
                        </Stack>
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Expert:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                component="img"
                                src="icons/confident.png"
                                alt="Confident"
                                sx={{ height: "0.9em" }}
                            />
                            <Typography variant="body2">{user.expert_confident}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                component="img"
                                src="icons/attempted.png"
                                alt="Attempted"
                                sx={{ height: "0.9em" }}
                            />
                            <Typography variant="body2">{user.expert_attempted}</Typography>
                        </Stack>
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Solo:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                component="img"
                                src="icons/confident.png"
                                alt="Confident"
                                sx={{ height: "0.9em" }}
                            />
                            <Typography variant="body2">{user.solo_count}</Typography>
                        </Stack>
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
                                <Typography variant="h6" fontSize="16">{truncate(user.name, 23)}</Typography>
                                <Box display="flex" flexDirection="row" gap={2} alignItems="center">
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Rank: #{user.rank}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
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
