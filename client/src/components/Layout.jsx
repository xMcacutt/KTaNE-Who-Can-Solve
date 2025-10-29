import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    useMediaQuery,
    useTheme,
    Divider,
    Icon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export default function Layout() {
    const { authUser, handleLogin, handleLogout } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const navItems = [
        { label: "Modules", to: "/" },
        { label: "Users", to: "/users" },
        { label: "Bombs", to: "/bombs" },
        { label: "Privacy", href: "/privacy/Policy.html" },
        ...(authUser ? [{ label: "Practice", to: "/practice" }] : []),
    ];

    const handleLogoutClick = async () => {
        try {
            await handleLogout();
        } catch (e) {
            console.error("Logout failed: ", e);
        } finally {
            setDrawerOpen(false);
        }
    };

    const renderNavButtons = () =>
        navItems.map((item) =>
            item.to ? (
                <Button
                    key={item.label}
                    color="inherit"
                    component={NavLink}
                    to={item.to}
                    end
                    sx={({ isActive }) => ({
                        borderBottom: isActive ? "2px solid white" : "none",
                    })}
                >
                    {item.label}
                </Button>
            ) : (
                <Button
                    key={item.label}
                    color="inherit"
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {item.label}
                </Button>
            )
        );

    return (
        <>
            <AppBar
                position="static"
                color="primary"
                sx={{
                    height: 64,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Toolbar sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton edge="start" color="inherit" href="/" sx={{ mr: 2 }}>
                        <img
                            src="/Logo_Small.svg"
                            alt="KTaNE Who Can Solve?"
                            width={40}
                            height={40}
                        />
                    </IconButton>

                    {!isMobile && (
                        <Box sx={{ display: "flex", gap: 2 }}>{renderNavButtons()}</Box>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {authUser ? (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                ...(isMobile && { order: 0 }),
                            }}
                        >
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
                        <Box>
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

                    {isMobile && (
                        <IconButton
                            color="inherit"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ ml: 1 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box sx={{ width: 225, p: 2 }} textAlign="center">
                    <Box
                        component="img"
                        src="/Logo Light.svg"
                        alt="Who Can Solve?"
                        width={175}
                    />
                    <Divider sx={{ my: 2 }} />
                    <List sx={{ display: "flex", flexDirection: "column", gap: 1, justifyContent: "flex-end" }}>
                        {navItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemButton
                                    component={item.to ? NavLink : "a"}
                                    to={item.to}
                                    href={item.href}
                                    target={item.href ? "_blank" : undefined}
                                    rel={item.href ? "noopener noreferrer" : undefined}
                                    onClick={() => setDrawerOpen(false)}
                                >
                                    <Box sx={{ display: "flex", flexGrow: 1, alignItems: "center", flexDirection: "row", gap: 1, }}>
                                        <Box 
                                            sx={{ height: "24", mb: 0.5}}
                                            component="img" 
                                            src={`/icons/menu_${item.label.toLowerCase()}.svg`}
                                            
                                        />
                                        <ListItemText
                                            primary={item.label}
                                            sx={{
                                                "& .MuiListItemText-primary": {
                                                    fontFamily: theme.typography.ostrich,
                                                    fontWeight: 500,
                                                    fontSize: "1.25rem",
                                                    letterSpacing: "0.5px",
                                                },
                                                textAlign: "end",
                                            }}
                                        />
                                    </Box>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            <Box
                sx={{
                    flexGrow: 1,
                    height: "calc(100vh - 64px)",
                    pt: 2,
                    overflowY: "auto",
                    mx: "auto",
                }}
            >
                <Box sx={{ width: { xs: "95%", md: "90%" }, mx: "auto" }}>
                    <Outlet />
                </Box>
            </Box>
        </>
    );
}
