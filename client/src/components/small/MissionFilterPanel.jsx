import React, { useState, useEffect } from "react";
import {
    Drawer,
    Box,
    Typography,
    Slider,
    FormControlLabel,
    Checkbox,
    Button,
    Divider,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
} from "@mui/material";

const currentYear = new Date().getFullYear();

export default function MissionFilterPanel({
    open,
    onClose,
    onApply,
    initialFilters = {},
}) {
    const [filters, setFilters] = useState({
        difficultyRange: [0, 30],
        knownPercentRange: [0, 100],
        moduleCountRange: [47, 200],
        possibleModuleCountRange: [47, 300],
        showFactorySequence: true,
        showFactoryStatic: true,
        showFactoryNone: true,
        favesFilter: "all",
        dateRange: [2015, currentYear],
        moduleSearch: "",
        ...initialFilters,
    });

    useEffect(() => {
        if (initialFilters && Object.keys(initialFilters).length > 0) {
            setFilters((prev) => ({
                ...prev,
                ...initialFilters,
            }));
        }
    }, [initialFilters]);

    const handleSliderChange = (name) => (_, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name) => (event) => {
        setFilters((prev) => ({ ...prev, [name]: event.target.checked }));
    };

    const handleInputChange = (name) => (event) => {
        setFilters((prev) => ({ ...prev, [name]: event.target.value }));
    };

    const handleReset = () => {
        const resetValues = {
            difficultyRange: [0, 30],
            knownPercentRange: [0, 100],
            moduleCountRange: [47, 200],
            possibleModuleCountRange: [47, 300],
            showFactorySequence: true,
            showFactoryStatic: true,
            showFactoryNone: true,
            favesFilter: "all",
            dateRange: [2015, currentYear],
            moduleSearch: "",
        };
        setFilters(resetValues);
        onApply(resetValues);
    };

    const handleApply = () => {
        onApply(filters);
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 350, p: 5, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Mission Filters
                </Typography>

                <Divider />

                <Box>
                    <Typography gutterBottom>Difficulty Range</Typography>
                    <Slider
                        value={filters.difficultyRange}
                        onChange={handleSliderChange("difficultyRange")}
                        valueLabelDisplay="auto"
                        min={0}
                        max={30}
                        valueLabelFormat={(v) => (v === 30 ? `${v}+` : v)}
                    />
                </Box>

                <Divider />

                <Box>
                    <Typography gutterBottom>Percentage Known</Typography>
                    <Slider
                        value={filters.knownPercentRange}
                        onChange={handleSliderChange("knownPercentRange")}
                        valueLabelDisplay="auto"
                        min={0}
                        max={100}
                    />
                </Box>

                <Divider />

                <Box>
                    <Typography gutterBottom>Module Count</Typography>
                    <Slider
                        value={filters.moduleCountRange}
                        onChange={handleSliderChange("moduleCountRange")}
                        valueLabelDisplay="auto"
                        min={47}
                        max={200}
                        valueLabelFormat={(v) => (v === 200 ? `${v}+` : v)}
                    />
                    <Typography gutterBottom>Possible Module Count</Typography>
                    <Slider
                        value={filters.possibleModuleCountRange}
                        onChange={handleSliderChange("possibleModuleCountRange")}
                        valueLabelDisplay="auto"
                        min={47}
                        max={300}
                        valueLabelFormat={(v) => (v === 300 ? `${v}+` : v)}
                    />
                </Box>

                <Divider />

                <Box>
                    <Typography gutterBottom>Date Range</Typography>
                    <Slider
                        value={filters.dateRange}
                        onChange={handleSliderChange("dateRange")}
                        valueLabelDisplay="auto"
                        min={2015}
                        max={currentYear}
                        marks={[
                            { value: 2015, label: "2015" },
                            { value: currentYear, label: String(currentYear) },
                        ]}
                    />
                </Box>

                <Divider />

                <Box>
                    <Typography gutterBottom>Factory Type</Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.showFactorySequence}
                                onChange={handleCheckboxChange("showFactorySequence")}
                            />
                        }
                        label="Factory Sequence"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.showFactoryStatic}
                                onChange={handleCheckboxChange("showFactoryStatic")}
                            />
                        }
                        label="Factory Static"
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.showFactoryNone}
                                onChange={handleCheckboxChange("showFactoryNone")}
                            />
                        }
                        label="Factory None"
                    />
                </Box>

                <Divider />

                <FormControl fullWidth size="small">
                    <InputLabel>Favourites</InputLabel>
                    <Select
                        label="Favourites"
                        value={filters.favesFilter}
                        onChange={handleInputChange("favesFilter")}
                    >
                        <MenuItem value="all">Show All</MenuItem>
                        <MenuItem value="only_faves">Only Favourites</MenuItem>
                        <MenuItem value="no_faves">No Favourites</MenuItem>
                    </Select>
                </FormControl>

                <Divider />

                <TextField
                    label="Search by Modules"
                    placeholder="e.g. wires, button, maze..."
                    value={filters.moduleSearch}
                    onChange={handleInputChange("moduleSearch")}
                    size="small"
                    fullWidth
                    multiline
                />

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" gap={1}>
                    <Button variant="outlined" color="secondary" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button variant="contained" onClick={handleApply}>
                        Apply Filters
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
