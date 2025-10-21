import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import UserCard from "./UserCard";
import { Virtuoso } from "react-virtuoso";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [visibleRows, setVisibleRows] = useState(new Set());
  const [sortType, setSortType] = useState("combined");

  const debouncedSearchTerm = useDebounce(searchTerm, 100);
  const listRef = useRef(null);

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
  });

  return (
    <Box>
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
      </Stack>

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

      {!isLoading && !error && users.length > 0 ? (
        <Virtuoso
          style={{ height: '80vh', width: '100%' }}
          totalCount={users.length}
          itemContent={(index) => {
            const user = users[index];
            return (
              <div style={{ paddingBottom: 16 }}>
                <UserCard
                  key={user.id}
                  user={user}
                  index={index}
                  sortType={sortType}
                />
              </div>
            )
          }}
          increaseViewportBy={200}
        />
      ) : (
        !isLoading &&
        !error && (
          <Typography color="text.secondary">No users found.</Typography>
        )
      )}
    </Box>
  );
}
