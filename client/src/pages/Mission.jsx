import { useState } from 'react';
import { Box, Typography, Chip, Tabs, Tab, Button, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useMission } from "../hooks/useMission";
import BombView from "../components/BombView";
import UserPanel from "../components/small/UserPanel";
import { useAuth } from "../context/AuthContext";
import BombConfDialog from '../components/small/BombConfDialog';

function MissionPageContent({ mission, activeUsers, addUser, removeUser, setDefuser, modulesData, refetchScores }) {
    const [tabIndex, setTabIndex] = useState(0);
    const [viewStyle, setViewStyle] = useState(
        localStorage.getItem("mission_view_style") || "Large Icons"
    );
    const [filter, setFilter] = useState(
        localStorage.getItem("mission_view_filters") || "Show All"
    );
    const [panelOpen, setPanelOpen] = useState(false);
    const { authUser } = useAuth();
    const [dialogType, setDialogType] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleViewStyleChange = (event) => {
        setViewStyle(event.target.value);
        localStorage.setItem("mission_view_style", event.target.value);
    };

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
        localStorage.setItem("mission_view_filters", event.target.value);
    };

    const handleOpenDialog = (type) => {
        setDialogType(type);
        setDialogOpen(true);
    };

    console.log(mission);
    return (
        <Box sx={{ mb: 10 }}>
            <Box
                sx={{
                    my: 2,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>View Style</InputLabel>
                    <Select
                        value={viewStyle}
                        onChange={handleViewStyleChange}
                        label="View Style"
                    >
                        <MenuItem value="Large Icons">Large Icons</MenuItem>
                        <MenuItem value="Small Icons">Small Icons</MenuItem>
                        <MenuItem value="Difficulty Heatmap">Difficulty Heatmap</MenuItem>
                    </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                        value={filter}
                        onChange={handleFilterChange}
                        label="Filter"
                    >
                        <MenuItem value="Show All">Show All</MenuItem>
                        <MenuItem value="Only My Confident">Only My Confident</MenuItem>
                        <MenuItem value="Only My Unknown">Only My Unknown</MenuItem>
                    </Select>
                </FormControl>
                {
                    authUser &&
                    <Button variant="outlined" onClick={() => handleOpenDialog("expert")}>
                        Set Expert Confident
                    </Button>
                }
                {
                    authUser &&
                    <Button variant="outlined" onClick={() => handleOpenDialog("defuser")}>
                        Set Defuser Confident
                    </Button>
                }
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" gutterBottom>
                    {mission.mission_name}
                </Typography>
                {
                    authUser &&
                    <IconButton onClick={() => setPanelOpen(true)}>
                        <GroupAddIcon />
                    </IconButton>
                }
            </Box>
            <Typography variant="subtitle1" gutterBottom>
                By {mission.authors?.join(', ') || 'Unknown'} | Pack: {mission.pack_name}
            </Typography>
            {
                mission.factory &&
                <Typography variant="subtitle2" gutterBottom>
                    Factory {mission.factory} | Strikes {mission.strike_mode} | Time {mission.time_mode}
                </Typography>
            }
            {
                !mission.verified &&
                <Chip label={`Unverified`} size="small" sx={{ pt: 0.35, backgroundColor: "#e74c3c" }} />
            }
            <Tabs
                value={tabIndex}
                onChange={(_, newValue) => setTabIndex(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
            >
                {mission.bombs.map((_, i) => (
                    <Tab key={i} label={`Bomb ${i + 1}`} />
                ))}
            </Tabs>
            {mission.bombs.map((bomb, i) =>
                i === tabIndex ? (
                    <BombView
                        key={i}
                        bomb={bomb}
                        viewStyle={viewStyle}
                        filter={filter}
                        users={activeUsers}
                        modulesData={modulesData}
                        authUser={authUser}
                    />
                ) : null
            )}
            <UserPanel
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
                currentUsers={activeUsers}
                onAddUser={addUser}
                onRemoveUser={removeUser}
                onSetDefuser={setDefuser}
            />
            <BombConfDialog
                open={dialogOpen}
                type={dialogType}
                mission={mission}
                onClose={() => setDialogOpen(false)}
                refetchScores={refetchScores}
            />
        </Box>
    );
}

export default function MissionPage() {
    const {
        mission,
        modulesData,
        activeUsers,
        addUser,
        removeUser,
        setDefuser,
        refetchScores,
        isLoading,
        error,
    } = useMission();

    if (isLoading) return <p>Loading mission...</p>;
    if (error) return <p>Error: {error.message}</p>;
    if (!mission) return <p>No mission found.</p>;
    return (
        <MissionPageContent
            mission={mission}
            activeUsers={activeUsers}
            addUser={addUser}
            removeUser={removeUser}
            setDefuser={setDefuser}
            modulesData={modulesData}
            refetchScores={refetchScores}
        />
    );
}
