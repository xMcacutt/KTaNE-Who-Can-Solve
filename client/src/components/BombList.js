import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { IconButton, Box, MenuItem, Select, Accordion, AccordionDetails, AccordionSummary, InputLabel, useTheme, useMediaQuery, FormControl, Typography, TextField, CircularProgress, Alert } from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useQuery } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
import UserPanel from "./small/UserPanel";
import BombCard from "./cards/BombCard";
import { useAuth } from "../context/AuthContext";
import { useActiveUsers } from "../context/ActiveUsersContext";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function BombList() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    let savedFilters = {};
    try {
        savedFilters = JSON.parse(localStorage.getItem("mission_filters")) || {};
    } catch {
        savedFilters = {};
    }
    const [sort, setSort] = useState(savedFilters.sort || "date_added");
    const [order, setOrder] = useState(savedFilters.order || "ascending");
    const [favesFilter, setFavesFilter] = useState(savedFilters.favesFilter || "all");
    const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("bomb_search") || "");
    const [panelOpen, setPanelOpen] = useState(false);

    useEffect(() => {
        const filters = { sort, order, favesFilter, searchTerm };
        localStorage.setItem("mission_filters", JSON.stringify(filters));
    }, [sort, order, favesFilter, searchTerm]);

    useEffect(() => {
        sessionStorage.setItem("bomb_search", searchTerm);
    }, [searchTerm]);

    const debouncedSearchTerm = useDebounce(searchTerm, 100);

    const { authUser } = useAuth();

    const { activeUsers, setActiveUsers, addUser, removeUser, setDefuser } = useActiveUsers();

    const teamKey = useMemo(() => {
        return activeUsers.map((u) => ({
            id: u.id,
            isDefuser: u.isDefuser,
        }));
    }, [activeUsers]);

    const { data: missions = [], isLoading, error, refetch } = useQuery({
        queryKey: ["missions", debouncedSearchTerm, sort, order, teamKey],
        queryFn: async () => {
            const params = new URLSearchParams({ search: debouncedSearchTerm, sort, order });
            let body = null;
            let method = "GET";
            const teamData = sort === "known_modules" ? teamKey : null;
            const discordId = authUser ? authUser.id : null;

            if (teamData && teamData.length > 0) {
                method = "POST";
                body = JSON.stringify({ team: teamData, discordId });
            } else if (discordId) {
                params.append("discordId", discordId);
            }

            const res = await fetch(`/api/missions?${params.toString()}`, {
                method,
                headers: body ? { "Content-Type": "application/json" } : {},
                body,
            });

            if (!res.ok) throw new Error("Failed to fetch missions");
            return res.json();
        },
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000,
    });

    const filteredMissions = React.useMemo(() => {
        if (!missions) return [];

        return missions.filter((m) => {
            if (favesFilter === "only_faves") return m.is_favourite;
            if (favesFilter === "no_faves") return !m.is_favourite;
            return true;
        });
    }, [missions, favesFilter]);

    const { data: authScores = [] } = useQuery({
        queryKey: ["userScores", authUser?.id],
        queryFn: async () => {
            const res = await fetch(`/api/users/${authUser.id}/scores`);
            if (!res.ok) throw new Error("Failed to fetch scores");
            return res.json();
        },
        enabled: !!authUser,
    });

    const Controls = (
        <Box display="flex" gap={2} m={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                    label="Sort by"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <MenuItem value="date_added">Date Published</MenuItem>
                    <MenuItem value="mission_name">Alphabetical</MenuItem>
                    <MenuItem value="difficulty">Difficulty</MenuItem>
                    <MenuItem value="known_modules">Known Modules (Team)</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Order</InputLabel>
                <Select
                    label="Order"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                >
                    <MenuItem value="descending">Descending</MenuItem>
                    <MenuItem value="ascending">Ascending</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Favourites</InputLabel>
                <Select
                    label="Favourites"
                    value={favesFilter}
                    onChange={(e) => setFavesFilter(e.target.value)}
                >
                    <MenuItem value="all">Show All</MenuItem>
                    <MenuItem value="no_faves">No Favourites</MenuItem>
                    <MenuItem value="only_faves">Only Favourites</MenuItem>
                </Select>
            </FormControl>
        </Box>
    )

    useEffect(() => {
        if (!authUser) return;

        setActiveUsers((prev) => {
            const exists = prev.find((u) => u.id === authUser.id);
            const currentDefuser = prev.find((u) => u.isDefuser);
            const userWithScores = {
                ...authUser,
                scores: authScores,
                isDefuser: currentDefuser
                    ? exists?.isDefuser ?? false
                    : true,
            };

            const same =
                exists &&
                JSON.stringify(exists.scores) === JSON.stringify(authScores) &&
                exists.isDefuser === userWithScores.isDefuser;

            if (same) return prev;

            if (exists) {
                return prev.map((u) =>
                    u.id === authUser.id ? userWithScores : u
                );
            } else {
                return [...prev, userWithScores];
            }
        });
    }, [authUser, authScores, setActiveUsers]);

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
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={600} mb={2}>Missions</Typography>
                    {authUser && (
                        <IconButton onClick={() => setPanelOpen(true)}>
                            <GroupAddIcon />
                        </IconButton>
                    )}
                </Box>
                <TextField
                    fullWidth
                    placeholder="Search missions..."
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

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

                {!isLoading && !error && filteredMissions.length > 0 ? (
                    <Virtuoso
                        style={{
                            height: "97%",
                            width: "100%",
                        }}
                        totalCount={filteredMissions.length}
                        itemContent={(index) => {
                            const mission = filteredMissions[index];
                            return (
                                <div style={{ paddingBottom: 16 }}>
                                    <BombCard
                                        mission={mission}
                                        index={index}
                                        users={activeUsers}
                                        authUser={authUser}
                                        onFavouriteChanged={refetch}
                                    />
                                </div>
                            )
                        }}
                        increaseViewportBy={200}
                    />
                ) : (
                    !isLoading && !error && (
                        <Typography color="text.secondary">No missions found.</Typography>
                    )
                )}

                {authUser && (
                    <UserPanel
                        open={panelOpen}
                        onClose={() => setPanelOpen(false)}
                        currentUsers={activeUsers}
                        onAddUser={addUser}
                        onRemoveUser={removeUser}
                        onSetDefuser={setDefuser}
                    />
                )}
            </Box>
        </Box>
    );
}
