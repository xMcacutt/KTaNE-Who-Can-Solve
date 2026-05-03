import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

const ActiveUsersContext = createContext();

export function ActiveUsersProvider({ children }) {
    const { authUser } = useAuth();
    const [activeUsers, setActiveUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const activeUsersRef = useRef(activeUsers);
    const refreshCountRef = useRef(0);

        const refreshActiveUserScores = useCallback(async () => {
        const usersToRefresh = activeUsersRef.current;
        if (usersToRefresh.length === 0) return;
        refreshCountRef.current += 1;
        setLoadingUsers(true);

        const prevDefuserId = usersToRefresh.find((u) => u.isDefuser)?.id;

        try {
            const refreshed = await Promise.all(
                usersToRefresh.map(async (user) => {
                    try {
                        const [userRes, scoresRes] = await Promise.all([
                            fetch(`/api/users/${user.id}`),
                            fetch(`/api/users/${user.id}/scores`),
                        ]);

                        const userData = await userRes.json();
                        const scores = scoresRes.ok ? await scoresRes.json() : [];
                        const normalizedScores = (Array.isArray(scores) ? scores : []).map(s => ({
                            module_id: s.module_id,
                            defuserConfidence: s.defuser_confidence ?? s.defuserConfidence ?? "Unknown",
                            expertConfidence: s.expert_confidence ?? s.expertConfidence ?? "Unknown",
                            canSolo: !!(s.can_solo ?? s.canSolo),
                        }));

                        return {
                            ...userData,
                            scores: normalizedScores,
                            isDefuser: prevDefuserId ? String(user.id) === String(prevDefuserId) : false,
                        };
                    } catch (err) {
                        console.error("Failed to refresh user:", err);
                        return {
                            ...user,
                            isDefuser: prevDefuserId ? String(user.id) === String(prevDefuserId) : user.isDefuser,
                        };
                    }
                })
            );

            const ensuredDefuser =
                refreshed.some((u) => u.isDefuser) && refreshed.length > 0
                    ? refreshed
                    : refreshed.map((u, i) => ({ ...u, isDefuser: i === 0 }));

            setActiveUsers(ensuredDefuser);
        } finally {
            refreshCountRef.current = Math.max(0, refreshCountRef.current - 1);
            setLoadingUsers(refreshCountRef.current > 0);
        }
    }, [setActiveUsers]);

    useEffect(() => {
        const handleFocus = () => {
            if (activeUsersRef.current.length > 0) {
                refreshActiveUserScores();
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [refreshActiveUserScores]);

    useEffect(() => {
        if (authUser == null) return;

        try {
            const stored = localStorage.getItem("activeUsers");
            if (stored) {
                const parsed = JSON.parse(stored);
                const validUsers = Array.isArray(parsed) ? parsed : [];
                setActiveUsers(validUsers);
                if (validUsers.length > 0) {
                    refreshActiveUserScores();
                }
            }
        } catch {
            setActiveUsers([]);
        }
    }, [authUser, refreshActiveUserScores]);

    useEffect(() => {
        activeUsersRef.current = activeUsers;
    }, [activeUsers]);

    useEffect(() => {
        if (authUser)
            localStorage.setItem("activeUsers", JSON.stringify(activeUsers));
    }, [activeUsers, authUser]);

    const addUser = async (newUser) => {
        try {
            if (activeUsers.some((u) => u.id === newUser.id)) return;
            const res = await fetch(`/api/users/${newUser.id}/scores`);
            if (!res.ok) throw new Error(`Failed to fetch scores for ${newUser.id}`);
            const scores = await res.json();
            setActiveUsers((prev) => [
                ...prev,
                { ...newUser, isDefuser: false, scores: Array.isArray(scores) ? scores : [] },
            ]);
        } catch (err) {
            console.error("Failed to add user:", err);
        }
    };

    const removeUser = (id) => {
        setActiveUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const setDefuser = (id) => {
        setActiveUsers((prev) =>
            prev.map((u) => ({ ...u, isDefuser: u.id === id }))
        );
    };

    return (
        <ActiveUsersContext.Provider
            value={{
                activeUsers,
                setActiveUsers,
                addUser,
                removeUser,
                setDefuser,
                refreshActiveUserScores,
                loadingUsers,
            }}
        >
            {children}
        </ActiveUsersContext.Provider>
    );
}

export function useActiveUsers() {
    return useContext(ActiveUsersContext);
}
