import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ActiveUsersContext = createContext();

export function ActiveUsersProvider({ children }) {
    const { authUser } = useAuth();
    const [activeUsers, setActiveUsers] = useState([]);

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
            value={{ activeUsers, setActiveUsers, addUser, removeUser, setDefuser }}
        >
            {children}
        </ActiveUsersContext.Provider>
    );
}

export function useActiveUsers() {
    return useContext(ActiveUsersContext);
}
