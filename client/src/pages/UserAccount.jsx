import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Virtuoso } from "react-virtuoso";
import ModuleCard from "../components/cards/ModuleCard";
import ModuleCardMobile from "../components/cards/ModuleCardMobile";
import { useAuth } from "../context/AuthContext";
import UploadDialog from "../components/small/UploadDialog";
import { useUserAccount } from "../hooks/useUserAccount";
import {
    Box,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Divider,
    Avatar,
    useTheme,
    useMediaQuery
} from "@mui/material";
import ConfidenceInfo from "../components/small/ConfidenceInfo";

function UserAccount() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { authUser, handleLogout } = useAuth();
    const { id: profileId } = useParams();

    const [uploadType, setUploadType] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [filterType, setFilterType] = useState("defuser");
    const [filterConfidence, setFilterConfidence] = useState("Confident");

    const {
        profileUser,
        profileError,
        localScores,
        setLocalScores,
        modules,
        stats,
        refetchScores,
        loading
    } = useUserAccount(profileId);

    const isOwnAccount = authUser?.id === profileUser?.id;

    const filteredModules = useMemo(() => {
        return modules.filter((module) => {
            const score = localScores[module.module_id] || { defuserConfidence: "Unknown", expertConfidence: "Unknown", canSolo: false };
            return filterType === "defuser" ? score.defuserConfidence === filterConfidence
                : filterType === "expert" ? score.expertConfidence === filterConfidence
                    : filterType === "solo" ? score.canSolo : true;
        });
    }, [modules, localScores, filterType, filterConfidence]);

    const handleDeleteAccount = async () => {
        if (!isOwnAccount) {
            alert("You can only delete your own data.");
            return;
        }
        if (window.confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
            try {
                const res = await axios.delete(`/api/users/${authUser.id}/delete`, { withCredentials: true });
                alert(res.data.message);
                await handleLogout();
            } catch (error) {
                console.error("Failed to delete account:", error);
                alert("Failed to delete data. Please try again.");
            }
        }
    };

    const handleDownloadProfile = async () => {
        try {
            const res = await axios.get(`/api/users/${profileId}/download`, { responseType: "blob" });

            const url = window.URL.createObjectURL(new Blob([res.data]));

            let filename = `${profileUser.name}'s Profile.json`;
            const contentDisposition = res.headers["content-disposition"];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Download failed. Please try again.");
        }
    };

    const handleOpenDialog = (type) => {
        setUploadType(type);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setUploadType(null);
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (profileError) return <Typography color="error">Failed to load profile: {profileError.message}</Typography>;
    if (!profileUser) return <Typography color="text.secondary">User not found.</Typography>;

    const totalModules = modules.length;

    return (
        <Box
            display="flex"
            flexDirection="column"
            sx={{
                height: "150%",
            }}
        >
            <Box sx={{ flexShrink: 0, p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={profileUser?.avatar} sx={{ width: 48, height: 48 }} />
                    <Typography variant="h5" gutterBottom>
                        {profileUser?.name}'s Account
                    </Typography>
                </Stack>

                <Typography variant="subtitle1" gutterBottom>
                    Discord ID: {profileUser?.id || "N/A"}
                </Typography>

                <Stack direction="row" spacing={2} my={2}>
                    {isOwnAccount && !isMobile && (
                        <>
                            <Button
                                variant="contained"
                                sx={{ height: "55" }}
                                onClick={() => handleOpenDialog("profile")}
                            >
                                Upload Profile
                            </Button>
                            <Button
                                variant="contained"
                                sx={{ height: "55" }}
                                onClick={() => handleOpenDialog("log")}
                            >
                                Upload Log
                            </Button>
                        </>
                    )}
                    {!isMobile && (
                        <Button
                            variant="outlined"
                            sx={{ height: "55" }}
                            onClick={handleDownloadProfile}
                        >
                            Download Profile
                        </Button>
                    )}

                    {isOwnAccount && (
                        <Button variant="contained" color="error" onClick={handleDeleteAccount} sx={{ height: "55" }}>
                            Delete My Data
                        </Button>
                    )}
                </Stack>

                <UploadDialog
                    open={dialogOpen}
                    type={uploadType}
                    onClose={handleCloseDialog}
                    refetchScores={refetchScores}
                />

                <Box mb={3}>
                    <Typography variant="subtitle1">User Stats (Total Modules: {totalModules})</Typography>
                    <Stack spacing={2} mt={1}>
                        <Box>
                            <Typography variant="subtitle2">Defuser:</Typography>
                            <Stack direction="row" spacing={3} mt={1}>
                                {Object.keys(stats.defuser).map((key) => (
                                    <ConfidenceInfo key={key} type={key.toLowerCase()} count={stats.defuser[key]} />
                                ))}
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2">Expert:</Typography>
                            <Stack direction="row" spacing={3} mt={1}>
                                {Object.keys(stats.expert).map((key) => (
                                    <ConfidenceInfo key={key} type={key.toLowerCase()} count={stats.expert[key]} />
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>Module List</Typography>
                <Stack direction="row" spacing={2} mb={2}>
                    <FormControl size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="Type">
                            <MenuItem value="defuser">Defuser</MenuItem>
                            <MenuItem value="expert">Expert</MenuItem>
                            <MenuItem value="solo">Solo</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Confidence</InputLabel>
                        <Select value={filterConfidence} onChange={(e) => setFilterConfidence(e.target.value)} label="Confidence">
                            <MenuItem value="Confident">Confident</MenuItem>
                            <MenuItem value="Attempted">Attempted</MenuItem>
                            <MenuItem value="Unknown">Unknown</MenuItem>
                            <MenuItem value="Avoid">Avoid</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            <Box sx={{ flexGrow: 1, mb: 2 }}>
                {filteredModules.length > 0 ? (
                    <Virtuoso
                        style={{ width: "100%" }}
                        totalCount={filteredModules.length}
                        itemContent={(index) => {
                            const module = filteredModules[index];
                            if (!module) return null;
                            return (
                                <div style={{ paddingBottom: 16 }}>
                                    {isMobile ? (
                                        <ModuleCardMobile
                                            module={module}
                                            index={index}
                                            user={authUser}
                                            authUser={authUser}
                                            score={localScores[module.module_id]}
                                            setScores={setLocalScores}
                                            refetchScores={refetchScores}
                                        />
                                    ) : (
                                        <ModuleCard
                                            module={module}
                                            index={index}
                                            user={authUser}
                                            authUser={authUser}
                                            score={localScores[module.module_id]}
                                            setScores={setLocalScores}
                                            refetchScores={refetchScores}
                                        />
                                    )}
                                </div>
                            );
                        }}
                        computeItemKey={(index) => filteredModules[index]?.id}
                        increaseViewportBy={200}
                    />
                ) : (
                    <Typography color="text.secondary">No modules match this filter.</Typography>
                )}
            </Box>
        </Box>
    );
}

export default UserAccount;