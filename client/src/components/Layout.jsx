import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    IconButton,
} from "@mui/material";

export default function Layout() {
    const { authUser, handleLogin, handleLogout } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogoutClick = async () => {
        try {
            await handleLogout();
        } catch (e) {
            console.error("Logout failed: ", e);
        } finally {
            setOpen(false);
        }
    };

    return (
        <>
            <AppBar
                position="static"
                color="primary"
                sx={{
                    height: 64,
                    minHeight: 64,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Toolbar>
                    <IconButton edge="start" color="inherit" href="/" sx={{ mr: 2 }}>
                        <img
                            src="/Logo_Small.svg"
                            alt="KTaNE Who Can Solve?"
                            width={40}
                            height={40}
                        />
                    </IconButton>

                    <Box sx={{ flexGrow: 1, display: "flex", gap: 2 }}>
                        <Button
                            color="inherit"
                            component={NavLink}
                            to="/"
                            end
                            sx={({ isActive }) => ({
                                borderBottom: isActive ? "2px solid white" : "none",
                            })}
                        >
                            Modules
                        </Button>
                        <Button
                            color="inherit"
                            component={NavLink}
                            to="/users"
                            sx={({ isActive }) => ({
                                borderBottom: isActive ? "2px solid white" : "none",
                            })}
                        >
                            Users
                        </Button>
                        <Button
                            color="inherit"
                            component={NavLink}
                            to="/bombs"
                            sx={({ isActive }) => ({
                                borderBottom: isActive ? "2px solid white" : "none",
                            })}
                        >
                            Bombs
                        </Button>
                        <Button
                            color="inherit"
                            component="a"
                            href="/privacy/Policy.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ borderBottom: "none" }}
                        >
                            Privacy
                        </Button>
                        {authUser && (
                            <Button
                                color="inherit"
                                component={NavLink}
                                to="/practice"
                                sx={({ isActive }) => ({
                                    borderBottom: isActive ? "2px solid white" : "none",
                                })}
                            >
                                Practice
                            </Button>
                        )}
                    </Box>

                    {authUser ? (
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                color="inherit"
                                component={NavLink}
                                to={`/profile/${authUser.id}`}
                                variant="outlined"
                            >
                                My Account
                            </Button>
                            <Button
                                color="secondary"
                                variant="contained"
                                onClick={handleLogoutClick}
                            >
                                Logout
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ ml: "auto" }}>
                            <Button
                                color="inherit"
                                variant="contained"
                                onClick={handleLogin}
                                sx={{
                                    backgroundColor: "#5865F2",
                                    "&:hover": { backgroundColor: "#4752c4" },
                                }}
                            >
                                Login with Discord
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    flexGrow: 1,
                    height: "calc(100vh - 64px)",
                    overflow: "hidden",
                    px: 2,
                    width: "90%",
                    mx: "auto",
                }}
            >
                <Outlet />
            </Box>
        </>
    );
}
