import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import theme from "./theme.js";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import { ActiveUsersProvider } from "./context/ActiveUsersContext";

const UserAccount = lazy(() => import("./pages/UserAccount.jsx"));
const Users = lazy(() => import("./pages/Users.jsx"));
const Bombs = lazy(() => import("./pages/Bombs.jsx"));
const Practice = lazy(() => import("./pages/Practice.jsx"));
const Mission = lazy(() => import("./pages/Mission.jsx"));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <ActiveUsersProvider>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route index element={<Home />} />
                                <Route
                                    path="users"
                                    element={
                                        <Suspense fallback={<p>Loading users...</p>}>
                                            <Users />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="bombs"
                                    element={
                                        <Suspense fallback={<p>Loading bombs...</p>}>
                                            <Bombs />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="practice"
                                    element={
                                        <Suspense fallback={<p>Loading practice...</p>}>
                                            <Practice />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="profile/:id"
                                    element={
                                        <Suspense fallback={<p>Loading profile...</p>}>
                                            <UserAccount />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="missions/:missionName"
                                    element={
                                        <Suspense fallback={<p>Loading mission...</p>}>
                                            <Mission />
                                        </Suspense>
                                    }
                                />
                                <Route path="*" element={<p>Not found</p>} />
                            </Route>
                        </Routes>
                    </ActiveUsersProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;
