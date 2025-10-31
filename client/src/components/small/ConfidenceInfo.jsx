import { Stack, Box, Typography } from "@mui/material";

export default function ConfidenceInfo({ type, count }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Box
                component="img"
                src={`/icons/${type}.png`}
                alt={type}
                sx={{ height: "1.2em" }}
            />
            <Typography variant="body2">
                {count}
            </Typography>
        </Stack>
    );
}

