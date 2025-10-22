import React, { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { AutoSizer, List, CellMeasurer, CellMeasurerCache } from "react-virtualized";
import ModuleCard from "../components/ModuleCard";
import { useAuth } from "../context/AuthContext";
import { Virtuoso } from "react-virtuoso";

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
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";

function normalizeScores(input) {
    if (!input) return {};
    if (Array.isArray(input)) {
        return Object.fromEntries(
            input.map((s) => [
                s.module_id,
                {
                    defuserConfidence: s.defuser_confidence,
                    expertConfidence: s.expert_confidence,
                    canSolo: s.can_solo,
                },
            ])
        );
    }
    return input;
}

function UserAccount() {
    const { authUser, logout } = useAuth();
    const [scores, setScores] = useState([]);
    const { id } = useParams();
    const profileId = id;

    const [uploadType, setUploadType] = useState(null);
    const [role, setRole] = useState("defuser");
    const [file, setFile] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [logUrl, setLogUrl] = useState("");

    const cache = useRef(
        new CellMeasurerCache({
            fixedWidth: true,
            minHeight: 130,
        })
    );

    const listRef = useRef(null);
    const [filterType, setFilterType] = useState("defuser");
    const [filterConfidence, setFilterConfidence] = useState("Confident");

    const {
        data: profileUser,
        isLoading: profileLoading,
        error: profileError,
    } = useQuery({
        queryKey: ["profileUser", profileId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${profileId}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("User does not exist");
            return res.json();
        },
        enabled: Boolean(profileId),
        staleTime: 1000 * 60 * 5,
    });

    const isOwnAccount = authUser?.id === profileUser?.id;

    const {
        data: fetchedScoresArray = [],
        isLoading: profileScoresLoading,
        refetch: refetchScores,
    } = useQuery({
        queryKey: ["profileScores", profileId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${profileId}/scores`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch profile scores");
            return res.json();
        },
        enabled: Boolean(profileId),
        staleTime: 1000 * 60 * 5,
    });

    const scoresObj = normalizeScores(fetchedScoresArray);

    const { data: modules = [], isLoading: modulesLoading } = useQuery({
        queryKey: ["modules"],
        queryFn: async () => {
            const res = await fetch(`/api/modules`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch modules");
            return res.json();
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleDeleteAccount = async () => {
        if (!isOwnAccount) {
            alert("You can only delete your own data.");
            return;
        }
        if (window.confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
            try {
                logout();
                const res = await axios.delete(`/api/users/${authUser.id}/delete`, { withCredentials: true });
                alert(res.data.message);
            } catch (error) {
                console.error("Failed to delete account:", error);
                alert("Failed to delete data. Please try again.");
            }
        }
    };

    const stats = {
        defuser: { Confident: 0, Attempted: 0, Unknown: 0, Avoid: 0 },
        expert: { Confident: 0, Attempted: 0, Unknown: 0, Avoid: 0 },
    };
    Object.values(scoresObj).forEach((score) => {
        stats.defuser[score.defuserConfidence || "Unknown"]++;
        stats.expert[score.expertConfidence || "Unknown"]++;
    });
    const totalModules = modules.length;
    stats.defuser.Unknown = totalModules - (stats.defuser.Confident + stats.defuser.Attempted + stats.defuser.Avoid);
    stats.expert.Unknown = totalModules - (stats.expert.Confident + stats.expert.Attempted + stats.expert.Avoid);

    const filteredModules = modules.filter((module) => {
        const score = scoresObj[module.module_id] || { defuserConfidence: "Unknown", expertConfidence: "Unknown", canSolo: false };
        return filterType === "defuser" ? score.defuserConfidence === filterConfidence
            : filterType === "expert" ? score.expertConfidence === filterConfidence
                : filterType === "solo" ? score.canSolo : true;
    });

    if (profileLoading || modulesLoading || profileScoresLoading) return <Typography>Loading...</Typography>;
    if (profileError) return <Typography color="error">Failed to load profile: {profileError.message}</Typography>;
    if (!profileUser) return <Typography color="text.secondary">User not found.</Typography>;

    const handleOpenDialog = (type) => {
        setUploadType(type);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFile(null);
        setRole("defuser");
        refetchScores();
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file && uploadType === "profile") {
            alert("Please select a file to upload.");
            return;
        }

        if (!file && !logUrl && uploadType === "log") {
            alert("Please upload a log file or provide a log link.");
            return;
        }

        try {
            const formData = new FormData();
            if (file) {
                formData.append("file", file);
            }
            if (logUrl) {
                formData.append("logUrl", logUrl);
            }
            formData.append("type", uploadType);
            formData.append("role", role);

            const res = await axios.post(
                `/api/scores/upload`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            alert(res.data.message || `${uploadType} uploaded successfully.`);
            handleCloseDialog();

        } catch (err) {
            console.error("Upload failed:", err);
            alert(err.response?.data?.error || "Upload failed. Please try again.");
        }
    };

    const handleDownloadProfile = async () => {
        try {
            const res = await axios.get(
                `/api/users/${profileId}/download`,
                { responseType: "blob" }
            );

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


    return (
        <Box p={3}>
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
                {isOwnAccount && (
                    <>
                        <Button
                            variant="contained"
                            onClick={() => handleOpenDialog("profile")}
                        >
                            Upload Profile
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleOpenDialog("log")}
                        >
                            Upload Log
                        </Button>
                    </>
                )}
                <Button
                    variant="outlined"
                    onClick={handleDownloadProfile}
                >
                    Download Profile
                </Button>
            </Stack>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Upload {uploadType}</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Is the profile for expert or defuser?
                    </Typography>
                    <RadioGroup
                        row
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <FormControlLabel value="defuser" control={<Radio />} label="Defuser" />
                        <FormControlLabel value="expert" control={<Radio />} label="Expert" />
                        <FormControlLabel value="both" control={<Radio />} label="Both" />
                        {uploadType === "profile" && (
                            <FormControlLabel value="solo" control={<Radio />} label="Solo" />
                        )}
                    </RadioGroup>
                    <Box mt={2}>
                        <input type="file" onChange={handleFileChange} />
                    </Box>
                    {uploadType === "log" && (
                        <Box mt={2}>
                            <Typography gutterBottom>Upload a file or paste a Logfile Analyzer link:</Typography>
                            <Typography align="center" variant="body2" sx={{ my: 1 }}>— or —</Typography>
                            <input
                                type="text"
                                placeholder="https://ktane.timwi.de/More/Logfile%20Analyzer.html#file=..."
                                value={logUrl}
                                onChange={(e) => setLogUrl(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleUpload} variant="contained">
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>

            <Box mb={3}>
                <Typography variant="subtitle1">User Stats (Total Modules: {totalModules})</Typography>
                <Stack spacing={2} mt={1}>
                    <Box>
                        <Typography variant="subtitle2">Defuser:</Typography>
                        <Stack direction="row" spacing={3} mt={1}>
                            {Object.keys(stats.defuser).map((key) => (
                                <Stack direction="row" alignItems="center" key={key} spacing={1}>
                                    <img src={`/icons/${key.toLowerCase()}.png`} alt={key} style={{ height: "1.2em" }} />
                                    <Typography variant="body2">{stats.defuser[key]}/{totalModules}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2">Expert:</Typography>
                        <Stack direction="row" spacing={3} mt={1}>
                            {Object.keys(stats.expert).map((key) => (
                                <Stack direction="row" alignItems="center" key={key} spacing={1}>
                                    <img src={`/icons/${key.toLowerCase()}.png`} alt={key} style={{ height: "1.2em" }} />
                                    <Typography variant="body2">{stats.expert[key]}/{totalModules}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </Box>

            {isOwnAccount ? (
                <Button variant="contained" color="error" onClick={handleDeleteAccount}>
                    Delete My Data
                </Button>
            ) : null}

            <Divider sx={{ my: 2 }} />

            <Box mb={3}>
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

                {filteredModules.length > 0 ? (
                    <Virtuoso
                        style={{ width: '100%' }}
                        totalCount={modules.length}
                        itemContent={(index) => {
                            const module = filteredModules[index];
                            return (
                                <div style={{ paddingBottom: 16 }}>
                                    <ModuleCard
                                        key={module.id}
                                        module={module}
                                        index={index}
                                        user={authUser}
                                        authUser={authUser}
                                        score={scoresObj[module.module_id]}
                                        setScores={setScores}
                                    />
                                </div>
                            );
                        }}
                        computeItemKey={(index) => modules[index]?.id}
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
