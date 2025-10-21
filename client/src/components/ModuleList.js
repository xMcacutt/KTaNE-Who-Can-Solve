import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Virtuoso } from 'react-virtuoso';
import ModuleCard from "./ModuleCard";
import {
    Box,
    Typography,
    TextField,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const searchFieldsOptions = ["name", "description", "author", "tags"];
const difficultyOptions = ["Trivial", "VeryEasy", "Easy", "Medium", "Hard", "VeryHard", "Extreme"];
const confidenceOptions = ["Unknown", "Attempted", "Confident", "Avoid"];

const fullConfidenceOptions = [
    ...confidenceOptions.map(opt => `Defuser:${opt}`),
    ...confidenceOptions.map(opt => `Expert:${opt}`),
];

const fullDifficultyOptions = [
    ...difficultyOptions.map(opt => `Defuser:${opt}`),
    ...difficultyOptions.map(opt => `Expert:${opt}`),
];

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function ModuleList() {
    const { authUser, logout } = useAuth();
    const [scores, setScores] = useState({});

    const { data: userScores } = useQuery({
        queryKey: ['scores', authUser?.id],
        queryFn: async () => {
            const res = await fetch(`/api/scores`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch scores');
            const data = await res.json();
            return data.reduce(
                (acc, score) => ({
                    ...acc,
                    [score.module_id]: {
                        defuserConfidence: score.defuser_confidence,
                        expertConfidence: score.expert_confidence,
                        canSolo: score.can_solo,
                    },
                }),
                {}
            );
        },
        enabled: !!authUser,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (userScores) setScores(userScores);
    }, [userScores]);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 100);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [searchFields, setSearchFields] = useState(["name", "description"]);
    const [confidenceFilter, setConfidenceFilter] = useState(fullConfidenceOptions);
    const [difficultyFilter, setDifficultyFilter] = useState(fullDifficultyOptions);

    const toggleConfidence = (value) => {
        setConfidenceFilter((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
        );
    };

    const toggleDifficulty = (value) => {
        setDifficultyFilter((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
        );
    };

    const {
        data: modules = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["modules", debouncedSearchTerm, sortBy, sortOrder, searchFields, confidenceFilter, difficultyFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                search: debouncedSearchTerm,
                sortBy,
                sortOrder,
                searchFields: searchFields.join(","),
            });
            if (authUser) params.append("userId", authUser.id);
            const confidenceParam = confidenceFilter.length === fullConfidenceOptions.length ? 'All' : confidenceFilter.join(',');
            if (confidenceParam && confidenceParam !== 'All') params.append("confidenceFilter", confidenceParam);
            const difficultyParam = difficultyFilter.length === fullDifficultyOptions.length ? 'All' : difficultyFilter.join(',');
            if (difficultyParam && difficultyParam !== 'All') params.append("difficultyFilter", difficultyParam);
            const res = await fetch(
                `/api/modules?${params.toString()}`
            );
            if (!res.ok) throw new Error("Failed to fetch modules");
            return res.json();
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });

    const renderMultiSelectValue = (selected, totalOptions, label) => {
        if (selected.length === 0) return `No ${label}`;
        if (selected.length === totalOptions.length) return `All ${label}`;
        return `${selected.length} ${label} selected`;
    };

    const ConfidenceMenuContent = ({ confidenceFilter, toggleConfidence }) => (
        <Box sx={{ display: 'flex', minWidth: 400 }}>
            <Box sx={{ flex: 1, py: 1, px: 2, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                    Defuser
                </Typography>
                {confidenceOptions.map((opt) => {
                    const value = `Defuser:${opt}`;
                    return (
                        <MenuItem
                            key={value}
                            value={value}
                            sx={{ justifyContent: 'flex-start', py: 0.5 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleConfidence(value);
                            }}
                        >
                            <Checkbox size="small" checked={confidenceFilter.includes(value)} />
                            <ListItemText primary={opt} sx={{ m: 0 }} />
                        </MenuItem>
                    );
                })}
            </Box>
            <Box sx={{ flex: 1, py: 1, px: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                    Expert
                </Typography>
                {confidenceOptions.map((opt) => {
                    const value = `Expert:${opt}`;
                    return (
                        <MenuItem
                            key={value}
                            value={value}
                            sx={{ justifyContent: 'flex-start', py: 0.5 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleConfidence(value);
                            }}
                        >
                            <Checkbox size="small" checked={confidenceFilter.includes(value)} />
                            <ListItemText primary={opt} sx={{ m: 0 }} />
                        </MenuItem>
                    );
                })}
            </Box>
        </Box>
    );


    const DifficultyMenuContent = ({ difficultyFilter, toggleDifficulty }) => (
        <Box sx={{ display: 'flex', minWidth: 500 }}>
            <Box sx={{ flex: 1, py: 1, px: 2, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                    Defuser
                </Typography>
                {difficultyOptions.map((opt) => {
                    const value = `Defuser:${opt}`;
                    return (
                        <MenuItem
                            key={value}
                            value={value}
                            sx={{ justifyContent: 'flex-start', py: 0.5 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDifficulty(value);
                            }}
                        >
                            <Checkbox size="small" checked={difficultyFilter.includes(value)} />
                            <ListItemText primary={opt} sx={{ m: 0 }} />
                        </MenuItem>
                    );
                })}
            </Box>
            <Box sx={{ flex: 1, py: 1, px: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                    Expert
                </Typography>
                {difficultyOptions.map((opt) => {
                    const value = `Expert:${opt}`;
                    return (
                        <MenuItem
                            key={value}
                            value={value}
                            sx={{ justifyContent: 'flex-start', py: 0.5 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDifficulty(value);
                            }}
                        >
                            <Checkbox size="small" checked={difficultyFilter.includes(value)} />
                            <ListItemText primary={opt} sx={{ m: 0 }} />
                        </MenuItem>
                    );
                })}
            </Box>
        </Box>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight={600} mb={2}>
                Modules
            </Typography>
            <TextField
                fullWidth
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
            />
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                        label="Sort By"
                        displayEmpty
                        sx={{
                            width: (theme) => theme.typography.fontSize * 11,
                        }}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="difficulty">Difficulty</MenuItem>
                        <MenuItem value="popularity">Popularity</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Order</InputLabel>
                    <Select
                        label="Order"
                        displayEmpty
                        sx={{
                            width: (theme) => theme.typography.fontSize * 11,
                        }}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small">
                    <InputLabel>Search Fields</InputLabel>
                    <Select
                        label="Search Fields"
                        displayEmpty
                        sx={{
                            width: (theme) => theme.typography.fontSize * 11,
                        }}
                        multiple
                        value={searchFields}
                        onChange={(e) => setSearchFields(e.target.value)}
                        input={<OutlinedInput label="Search Fields" />}
                        renderValue={(selected) => selected.join(", ")}
                    >
                        {searchFieldsOptions.map((field) => (
                            <MenuItem key={field} value={field}>
                                <Checkbox checked={searchFields.includes(field)} />
                                <ListItemText primary={field} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {authUser && (

                    <FormControl size="small">
                        <InputLabel>Confidence</InputLabel>
                        <Select
                            label="Confidence"
                            multiple
                            value={confidenceFilter}
                            onChange={(e) => setConfidenceFilter(e.target.value || [])}
                            input={<OutlinedInput label="Confidence" />}
                            renderValue={(selected) =>
                                <Typography variant="body2" noWrap>
                                    {renderMultiSelectValue(selected, fullConfidenceOptions, 'Confidences')}
                                </Typography>
                            }
                            sx={{
                                width: (theme) => theme.typography.fontSize * 15,
                            }}
                            MenuProps={{
                                MenuListProps: {
                                    component: 'div',
                                },
                                PaperProps: {
                                    sx: {
                                        minWidth: (theme) => theme.typography.fontSize * 15,
                                    },
                                },
                            }}
                        >
                            <ConfidenceMenuContent
                                confidenceFilter={confidenceFilter}
                                toggleConfidence={toggleConfidence}
                            />
                        </Select>
                    </FormControl>
                )}
                <FormControl size="small">
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                        label="Difficulty"
                        multiple
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value || [])}
                        input={<OutlinedInput label="Difficulty" />}
                        renderValue={(selected) =>
                            <Typography variant="body2" noWrap>
                                {renderMultiSelectValue(selected, fullDifficultyOptions, 'Difficulties')}
                            </Typography>
                        }
                        sx={{
                            width: (theme) => theme.typography.fontSize * 15,
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    minWidth: (theme) => theme.typography.fontSize * 15,
                                },
                            },
                        }}
                    >
                        <DifficultyMenuContent
                            difficultyFilter={difficultyFilter}
                            toggleDifficulty={toggleDifficulty}
                        />
                    </Select>
                </FormControl>
            </Box>
            {isLoading && (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Box>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message}
                </Alert>
            )}
            {!isLoading && !error && modules.length > 0 ? (
                <Virtuoso
                    style={{ height: '80vh', width: '100%' }}
                    totalCount={modules.length}
                    itemContent={(index) => {
                        const module = modules[index];
                        return (
                            <div style={{ paddingBottom: 16 }}>
                                <ModuleCard
                                    key={module.id}
                                    module={module}
                                    index={index}
                                    user={authUser}
                                    authUser={authUser}
                                    score={scores[module.module_id]}
                                    setScores={setScores}
                                />
                            </div>
                        );
                    }}
                    computeItemKey={(index) => modules[index]?.id}
                    increaseViewportBy={200}
                />
            ) : (
                !isLoading &&
                !error && (
                    <Typography color="text.secondary">No modules found.</Typography>
                )
            )}
        </Box>
    );
}