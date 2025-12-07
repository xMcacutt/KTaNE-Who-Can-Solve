import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

const ActiveUsersContext = createContext();

export function ActiveUsersProvider({ children }) {
    const { authUser } = useAuth();
    const [activeUsers, setActiveUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const activeUsersRef = useRef(activeUsers);
    const refreshCountRef = useRef(0);

    useEffect(() => {
        if (authUser == null) return;

        try {
            const stored = localStorage.getItem("activeUsers");
            const parsed = stored ? JSON.parse(stored) : [];
            setActiveUsers(Array.isArray(parsed) ? parsed : []);
        } catch {
            setActiveUsers([]);
        }
    }, [authUser]);

    useEffect(() => {
        activeUsersRef.current = activeUsers;
    }, [activeUsers]);

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

                        if (!userRes.ok) {
                            throw new Error(`Failed to fetch user ${user.id}`);
                        }

                        const userData = await userRes.json();
                        const scores = scoresRes.ok ? await scoresRes.json() : [];

                        return {
                            ...userData,
                            scores: Array.isArray(scores) ? scores : [],
                            isDefuser: prevDefuserId ? user.id === prevDefuserId : false,
                        };
                    } catch (err) {
                        console.error("Failed to refresh user:", err);
                        return {
                            ...user,
                            isDefuser: prevDefuserId ? user.id === prevDefuserId : user.isDefuser,
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
