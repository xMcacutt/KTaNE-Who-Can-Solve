import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import UserCard from "./cards/UserCard";
import UserCardMobile from "./cards/UserCardMobile";
import { Virtuoso } from "react-virtuoso";
import { useActiveUsers } from "../context/ActiveUsersContext";
import {
    Box,
    Typography,
    TextField,
    Stack,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    useMediaQuery
} from "@mui/material";

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

export default function UserList() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { refreshActiveUserScores, loadingUsers } = useActiveUsers();
    const [usersReady, setUsersReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await refreshActiveUserScores();
            } finally {
                if (!cancelled) setUsersReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshActiveUserScores]);

    let savedFilters = {};
    try {
        savedFilters = JSON.parse(localStorage.getItem("user_filters")) || {};
    } catch {
        savedFilters = {};
    }
    const [sortType, setSortType] = useState(savedFilters.sort || "combined");
    const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("user_search") || "");
    const [confidenceView, setConfidenceView] = useState(
        savedFilters.confidenceView || "combined"
    );

    useEffect(() => {
        sessionStorage.setItem("user_search", searchTerm);
    }, [searchTerm]);
    
    useEffect(() => {
        const filters = { sortType, confidenceView };
        localStorage.setItem("user_filters", JSON.stringify(filters));
    }, [sortType, confidenceView]);

    const debouncedSearchTerm = useDebounce(searchTerm, 100);

    const {
        data: users = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["users", debouncedSearchTerm, sortType],
        queryFn: async () => {
            const res = await fetch(
                `/api/leaderboard?search=${encodeURIComponent(
                    debouncedSearchTerm
                )}&sort=${sortType}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
        enabled: usersReady && !loadingUsers,
    });

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
                    Leaderboard
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                    <TextField
                        fullWidth
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="outlined"
                        size="small"
                    />

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Leaderboard Type</InputLabel>
                        <Select
                            value={sortType}
                            label="Leaderboard Type"
                            onChange={(e) => setSortType(e.target.value)}
                        >
                            <MenuItem value="combined">Combined</MenuItem>
                            <MenuItem value="defuser">Defuser</MenuItem>
                            <MenuItem value="expert">Expert</MenuItem>
                            <MenuItem value="solo">Solo</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Confidence View</InputLabel>
                        <Select
                            value={confidenceView}
                            label="Confidence View"
                            onChange={(e) => setConfidenceView(e.target.value)}
                        >
                            <MenuItem value="combined">Combined</MenuItem>
                            <MenuItem value="regular">Regular Only</MenuItem>
                            <MenuItem value="needy">Needy Only</MenuItem>
                            <MenuItem value="split">Split View</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                {(isLoading || loadingUsers || !usersReady) && (
                    <Box display="flex" justifyContent="center" mt={4}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error.message}
                    </Alert>
                )}

                {!isLoading && !error && usersReady && !loadingUsers && users.length > 0 ? (
                    <Virtuoso
                        style={{
                            height: "97%",
                            width: "100%",
                        }}
                        totalCount={users.length}
                        itemContent={(index) => {
                            const user = users[index];
                            return (
                                <div style={{ paddingBottom: 16 }}>
                                    {
                                        isMobile &&
                                        <UserCardMobile
                                            key={user.id}
                                            user={user}
                                            index={index}
                                            sortType={sortType}
                                            confidenceView={confidenceView}
                                        />
                                    }
                                    {
                                        !isMobile &&
                                        <UserCard
                                            key={user.id}
                                            user={user}
                                            index={index}
                                            sortType={sortType}
                                            confidenceView={confidenceView}
                                        />
                                    }
                                </div>
                            )
                        }}
                        increaseViewportBy={200}
                    />
                ) : (
                    !isLoading &&
                    !error &&
                    usersReady &&
                    !loadingUsers && (
                        <Typography color="text.secondary">No users found.</Typography>
                    )
                )}
            </Box>
        </Box>
    );
}
