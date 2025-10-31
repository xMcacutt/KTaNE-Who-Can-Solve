import { useState } from 'react';
import { Box, Typography, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useMission } from "../hooks/useMission";
import BombView from "../components/BombView";
import UserPanel from "../components/small/UserPanel";
import { useAuth } from "../context/AuthContext";

function MissionPageContent({ mission, activeUsers, addUser, removeUser, setDefuser, modulesData }) {
    const [tabIndex, setTabIndex] = useState(0);
    const [viewStyle, setViewStyle] = useState('Large Icons');
    const [filter, setFilter] = useState('Show All');
    const [panelOpen, setPanelOpen] = useState(false);
    const { authUser } = useAuth();

    const handleViewStyleChange = (event) => {
        setViewStyle(event.target.value);
    };

    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };

    return (
        <Box sx={{ mb: 10 }}>
            <Box sx={{ mb: 2 }}>
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
                        <MenuItem value="Only Unknown">Only Unknown</MenuItem>
                    </Select>
                </FormControl>
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
        isLoading,
        error
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
        />
    );
}