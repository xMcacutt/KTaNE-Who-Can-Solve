import { Stack, Box, Typography } from "@mui/material";
import ConfidenceInfo from "./ConfidenceInfo";

export default function ConfidenceBlock({ title, data, isMobile }) {
    return (
        <Stack direction="column" minWidth="15vw">
            <Typography variant="bebas" fontSize={isMobile ? "1rem" : "1.2rem"}>
                {title}
            </Typography>

            <Stack direction="row" spacing={isMobile ? 2 : 3}>
                <Box>
                    <Typography variant="subtitle2">Defuser:</Typography>
                    <Stack direction="row" spacing={1}>
                        <ConfidenceInfo type="confident" count={data.defuser_confident}/>
                        <ConfidenceInfo type="attempted" count={data.defuser_attempted}/>
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2">Expert:</Typography>
                    <Stack direction="row" spacing={1}>
                        <ConfidenceInfo type="confident" count={data.expert_confident}/>
                        <ConfidenceInfo type="attempted" count={data.expert_attempted}/>
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2">Solo:</Typography>
                    <ConfidenceInfo type="solo" count={data.solo}/>
                </Box>
            </Stack>
        </Stack>
    );
}