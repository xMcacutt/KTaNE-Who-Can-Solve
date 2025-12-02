import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ModuleList from "../components/ModuleList";
import { useAuth } from "../context/AuthContext";
import UploadDialog from "../components/small/UploadDialog";
import { useUserAccount } from "../hooks/useUserAccount";
import {
    Box,
    Typography,
    Button,
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

    const {
        profileUser,
        profileError,
        localScores,
        modules,
        stats,
        refetchScores,
        loading
    } = useUserAccount(profileId);

    const isOwnAccount = authUser?.id === profileUser?.id;

    const handleDeleteAccount = async () => {
        if (!isOwnAccount) return;
        if (window.confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
            try {
                const res = await axios.delete(`/api/users/${authUser.id}/delete`, { withCredentials: true });
                alert(res.data.message);
                await handleLogout();
            } catch (error) {
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
        } catch {
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
    if (profileError) return <Typography color="error">Failed to load profile</Typography>;
    if (!profileUser) return <Typography color="text.secondary">User not found.</Typography>;

    const totalModules = modules.length;

    return (
        <Box display="flex" flexDirection="column" sx={{ height: "120%" }}>
            <Box sx={{ flexShrink: 0, p: 2, height: "75%" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={profileUser?.avatar} sx={{ width: 48, height: 48 }} />
                    <Typography variant="h5">{profileUser?.name}'s Account</Typography>
                </Stack>

                <Typography variant="subtitle1">Discord ID: {profileUser?.id || "N/A"}</Typography>

                <Stack direction="row" spacing={2} my={2}>
                    {isOwnAccount && !isMobile && (
                        <>
                            <Button variant="contained" onClick={() => handleOpenDialog("profile")}>Upload Profile</Button>
                            <Button variant="contained" onClick={() => handleOpenDialog("log")}>Upload Log</Button>
                        </>
                    )}
                    {!isMobile && (
                        <Button variant="outlined" onClick={handleDownloadProfile}>
                            Download Profile
                        </Button>
                    )}
                    {isOwnAccount && (
                        <Button variant="contained" color="error" onClick={handleDeleteAccount}>
                            Delete My Data
                        </Button>
                    )}
                </Stack>

                <UploadDialog open={dialogOpen} type={uploadType} onClose={handleCloseDialog} refetchScores={refetchScores} />

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

                        <Box>
                            <Typography variant="subtitle2">Solo</Typography>
                            <ConfidenceInfo type="solo" count={stats.solo} />
                        </Box>
                    </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <ModuleList
                    scoresOverride={localScores}
                    userOverride={profileUser}
                />
            </Box>
        </Box>
    );
}

export default UserAccount;
