import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Virtuoso } from 'react-virtuoso';
import ModuleCard from "./cards/ModuleCard";
import ModuleCardMobile from "./cards/ModuleCardMobile";
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
    useTheme,
    useMediaQuery,
    ListItemText,
    OutlinedInput,
    Accordion,
    AccordionDetails,
    AccordionSummary

} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const searchFieldsOptions = ["name", "description", "author", "tags"];
const difficultyOptions = ["Trivial", "VeryEasy", "Easy", "Medium", "Hard", "VeryHard", "Extreme"];
const confidenceOptions = ["Unknown", "Attempted", "Confident", "Avoid"];
const moduleTypeOptions = ["Regular", "Needy"];

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

export default function ModuleList({ scoresOverride, userOverride }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const { authUser } = useAuth();
    const activeUser = userOverride || authUser;
    const [scores, setScores] = useState(scoresOverride || {});

    const { data: userScores, refetch: refetchScores } = useQuery({
        queryKey: ['scores', activeUser?.id],
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
        enabled: !!activeUser,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (!scoresOverride && userScores) setScores(userScores);
    }, [userScores]);

    let savedFilters = {};
    try {
        savedFilters = JSON.parse(localStorage.getItem("module_filters")) || {};
    } catch {
        savedFilters = {};
    }

    const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("module_search") || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 100);
    const [sortBy, setSortBy] = useState(savedFilters.sortBy || "name");
    const [sortOrder, setSortOrder] = useState(savedFilters.sortOrder || "asc");
    const [searchFields, setSearchFields] = useState(savedFilters.searchFields || ["name", "description"]);
    const [confidenceFilter, setConfidenceFilter] = useState(savedFilters.confidenceFilter || fullConfidenceOptions);
    const [difficultyFilter, setDifficultyFilter] = useState(savedFilters.difficultyFilter || fullDifficultyOptions);
    const [moduleTypeFilter, setModuleTypeFilter] = useState(savedFilters.moduleTypeFilter || moduleTypeOptions);

    useEffect(() => {
        const filters = {
            sortBy,
            sortOrder,
            searchFields,
            confidenceFilter,
            difficultyFilter,
            moduleTypeFilter
        };
        localStorage.setItem("module_filters", JSON.stringify(filters));
    }, [sortBy, sortOrder, searchFields, confidenceFilter, difficultyFilter, moduleTypeFilter]);

    useEffect(() => {
        sessionStorage.setItem("module_search", searchTerm);
    }, [searchTerm]);

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
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteQuery({
        queryKey: [
            "modules",
            debouncedSearchTerm,
            sortBy,
            sortOrder,
            searchFields,
            confidenceFilter,
            difficultyFilter,
            moduleTypeFilter
        ],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({
                search: debouncedSearchTerm,
                sortBy,
                sortOrder,
                searchFields: searchFields.join(","),
                limit: "50",
                offset: pageParam.toString(),
            });

            if (activeUser) params.append("userId", activeUser.id);

            const confidenceParam =
                confidenceFilter.length === fullConfidenceOptions.length ? "All" : confidenceFilter.join(",");
            if (confidenceParam !== "All") params.append("confidenceFilter", confidenceParam);

            const difficultyParam =
                difficultyFilter.length === fullDifficultyOptions.length ? "All" : difficultyFilter.join(",");
            if (difficultyParam !== "All") params.append("difficultyFilter", difficultyParam);

            const typeParam = moduleTypeFilter.length === moduleTypeOptions.length ? "All" : moduleTypeFilter.join(",");
            if (typeParam !== "All") params.append("moduleTypes", typeParam);

            const res = await fetch(`/api/modules?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch modules");

            const rows = await res.json();

            return {
                items: rows,
                nextOffset: rows.length < 50 ? null : pageParam + 50
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5
    });

    const modules = data ? data.pages.flatMap(page => page.items) : [];

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

    const Controls = (
        <Box display="flex" gap={2} m={2} flexWrap="wrap">
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
            <FormControl size="small">
                <InputLabel>Module Types</InputLabel>
                <Select
                    label="Module Types"
                    multiple
                    value={moduleTypeFilter}
                    onChange={(e) => setModuleTypeFilter(e.target.value)}
                    input={<OutlinedInput label="Module Types" />}
                    renderValue={(selected) => selected.join(", ")}
                    sx={{
                        width: (theme) => theme.typography.fontSize * 11,
                    }}
                >
                    {moduleTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                            <Checkbox checked={moduleTypeFilter.includes(type)} />
                            <ListItemText primary={type} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {activeUser && (

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
    )

    return (
        <Box
            display="flex"
            flexDirection="column"
            sx={{
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box sx={{ flexShrink: 0, p: 2 }}>
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
                {isMobile ? (
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ArrowDownwardIcon />}
                            aria-controls="options-panel-content"
                            id="options-panel-header"
                        >
                            <Typography>Filter & Sort</Typography>
                        </AccordionSummary>
                        {Controls}
                    </Accordion>
                ) : (
                    Controls
                )}
            </Box>
            <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
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
                        style={{ height: "97%", width: "100%" }}
                        data={modules}
                        totalCount={modules.length}
                        increaseViewportBy={200}
                        computeItemKey={(index) => modules[index]?.module_id}
                        itemContent={(index, module) => (
                            <div style={{ paddingBottom: 16 }}>
                                {isMobile ? (
                                    <ModuleCardMobile
                                        module={module}
                                        index={index}
                                        user={activeUser}
                                        authUser={authUser}
                                        score={scores[module.module_id]}
                                        setScores={scoresOverride ? undefined : setScores}
                                        refetchScores={refetchScores}
                                    />
                                ) : (
                                    <ModuleCard
                                        module={module}
                                        index={index}
                                        user={activeUser}
                                        authUser={authUser}
                                        score={scores[module.module_id]}
                                        setScores={scoresOverride ? undefined : setScores}
                                        refetchScores={refetchScores}
                                        popularity={sortBy === "popularity" ? module.popularity : null}
                                    />
                                )}
                            </div>
                        )}
                        endReached={() => {
                            if (hasNextPage && !isFetchingNextPage) {
                                console.log("Loading next page…");
                                fetchNextPage();
                            }
                        }}
                    />
                ) : (
                    !isLoading &&
                    !error && (
                        <Typography color="text.secondary">No modules found.</Typography>
                    )
                )}
            </Box>
        </Box>
    );
}