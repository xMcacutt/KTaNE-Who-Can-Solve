import { Box, Button, Checkbox, Grid, Slider, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { lazy, Suspense } from "react";
import { useState } from "react";
import axios from "axios";

export default function Practice() {
    const [repetitions, setRepetitions] = useState(3);
    const [difficulty, setDifficulty] = useState(5);
    const [bombSize, setBombSize] = useState(7);
    const [incremental, setIncremental] = useState(true);
    const [needys, setNeedys] = useState(false);
    const [bosses, setBosses] = useState(false);
    const [prioritizeOlder, setPrioritizeOlder] = useState(false);
    const [output, setOutput] = useState([]);

    const handleGenerate = async () => {
        try {
            const res = await axios.post(`http://${window.location.hostname}:5000/practice/generate`, {
                bombSize,
                difficulty,
                prioritizeOlder
            }, { withCredentials: true });

            setOutput(res.data);
        } catch (err) {
            console.error("Failed to generate:", err);
        }
    };

    const formatDMGString = (modules, repetitions, isIncremental) => {
        var dmgString = "";
        if (isIncremental) {
            dmgString += `factory:finite\n`;
            modules.forEach(module => {
                if (module.quirks.includes("NeedsOtherSolves") || module.boss_status) {
                    dmgString += `${repetitions}*(${module.module_id} 5*SimpleButton)\n`;
                } else {
                    dmgString += `${repetitions}*(${module.module_id})\n`;
                }
            });
        }
        dmgString += `(${modules.map(m => m.module_id).join(' ')})\n`;
        dmgString += `mode:zen\n`;
        dmgString += `nopacing`;
        return dmgString;
    };

    return (
        <Suspense fallback={<div>Loading practice...</div>}>
            <div>
                <h1>Practice</h1>
                <Grid container spacing={6}>
                    <Grid item size={6}>
                        <Box display="flex" flexDirection={"column"}>
                            <div>
                                <Typography gutterBottom>Difficulty</Typography>
                                <Slider
                                    value={difficulty}
                                    onChange={(e, val) => setDifficulty(val)}
                                    step={1}
                                    min={0}
                                    max={10}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </div>

                            <div>
                                <Typography gutterBottom>Bomb Size</Typography>
                                <Slider
                                    value={bombSize}
                                    onChange={(e, val) => setBombSize(val)}
                                    step={null}
                                    marks={[{ value: 3 }, { value: 7 }, { value: 11 }, { value: 17 }, { value: 23 }]}
                                    max={23} min={3}
                                    valueLabelDisplay="auto"
                                />
                            </div>

                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Typography>Use Incremental Learning</Typography>
                                <Checkbox checked={incremental} onChange={e => setIncremental(e.target.checked)} />
                            </div>

                            {incremental && (
                                <div>
                                    <Typography gutterBottom>Repetitions</Typography>
                                    <Slider
                                        value={repetitions}
                                        onChange={(e, val) => setRepetitions(val)}
                                        step={1}
                                        min={2}
                                        max={5}
                                        marks
                                        valueLabelDisplay="auto"
                                    />
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Typography>Prioritise Older Modules</Typography>
                                <Checkbox checked={prioritizeOlder} onChange={e => setPrioritizeOlder(e.target.checked)} />
                            </div>


                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Typography>Allow Needys</Typography>
                                <Checkbox checked={needys} onChange={e => setNeedys(e.target.checked)} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Typography>Allow Bosses</Typography>
                                <Checkbox checked={bosses} onChange={e => setBosses(e.target.checked)} />
                            </div>

                            <Button onClick={handleGenerate}>Generate</Button>
                        </Box>
                    </Grid>
                    <Grid item size={6}>
                        <Box bgcolor={"background.paper"} p={2}>
                            <Typography variant="h6" gutterBottom>
                                Output:
                            </Typography>

                            {output.length > 0 ? (
                                <Box
                                    sx={{
                                        position: "relative",
                                        bgcolor: "grey.900",
                                        color: "grey.100",
                                        fontFamily: "monospace",
                                        p: 2,
                                        borderRadius: 2,
                                        overflowX: "auto",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    <Button
                                        size="small"
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                formatDMGString(output, repetitions, incremental, needys, bosses)
                                            )
                                        }
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            minWidth: "auto",
                                            padding: "2px 6px",
                                            borderRadius: 1,
                                            bgcolor: "grey.800",
                                            color: "grey.100",
                                            "&:hover": { bgcolor: "grey.700" },
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </Button>

                                    {formatDMGString(output, repetitions, incremental, needys, bosses)}
                                </Box>
                            ) : (
                                <Typography>No modules generated yet.</Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </div>
        </Suspense>
    );
}
