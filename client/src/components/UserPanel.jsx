import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";
import { truncate } from "../utility";

export default function UserPanel({
  open,
  onClose,
  currentUsers,
  onAddUser,
  onRemoveUser,
  onSetDefuser,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (!value) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?search=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const { authUser } = useAuth();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Manage Users</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <TextField
          fullWidth
          placeholder="Search users..."
          value={search}
          onChange={handleSearch}
          size="small"
          sx={{ my: 2 }}
        />
        {loading && <CircularProgress size={20} />}

        <List dense>
          {results.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <Button
                  size="small"
                  variant="outlined"
                  disabled={
                    currentUsers.length >= 4 ||
                    currentUsers.some((u) => u.id === user.id)
                  }
                  onClick={() => onAddUser(user)}
                >
                  Add
                </Button>
              }
              sx={{ alignItems: 'center' }}
            >
              <ListItemAvatar>
                <Avatar src={user.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={truncate(user.name, 15)}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    },
                  },
                }}
                sx={{ ml: 1 }}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Defusal Team Builder
        </Typography>
        <List dense>
          {currentUsers.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <>
                  <Checkbox
                    checked={user.isDefuser}
                    onChange={() => onSetDefuser(user.id)}
                  />
                  {authUser && authUser.id !== user.id &&
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onRemoveUser(user.id)}
                    >
                      Remove
                    </Button>
                  }
                </>
              }
            >
              <ListItemAvatar>
                <Avatar src={user.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={truncate(user.name, 13)}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    },
                  },
                }}
                sx={{ ml: 1 }}
                secondary={user.isDefuser ? "Defuser" : "Expert"}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
