import React, { createContext, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: authUser,
        error: userError,
        isFetching: isFetchingUser,
    } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axios.get(
                `/api/auth/user`,
                { withCredentials: true }
            );
            const data = res.data;
            return {
                id: data.discord_id,
                name: data.username,
                email: data.email,
                avatar: data.avatar
                    ? `https://cdn.discordapp.com/avatars/${data.discord_id}/${data.avatar}.png`
                    : `https://cdn.discordapp.com/embed/avatars/0.png`,
            };
        },
        retry: false,
    });

    const {
        data: authScores,
        error: scoresError,
        isFetching: isFetchingScores,
    } = useQuery({
        queryKey: ["authScores", authUser?.id],
        queryFn: async () => {
            const res = await axios.get(
                `/api/scores`,
                { withCredentials: true }
            );
            return res.data.reduce(
                (acc, score) => ({
                    ...acc,
                    [score.module_id]: {
                        defuserConfidence: score.defuser_confidence,
                        expertConfidence: score.expert_confidence,
                        canSolo: score.can_solo,
                    },
                }),
                {}
            );
        },
        enabled: !!authUser,
        retry: false,
    });

    const handleLogin = () => {
        window.location.href = `/api/auth/discord`;
    };

    const handleLogout = async () => {
        try {
            await axios.get(`/api/auth/logout`, {
                withCredentials: true,
            });
            queryClient.clear();
            navigate("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    useEffect(() => {
        if (authUser && window.location.pathname === "/profile") {
            navigate("/");
        }
    }, [authUser, navigate]);

    return (
        <AuthContext.Provider
            value={{
                authUser,
                authScores,
                isFetchingUser,
                isFetchingScores,
                userError,
                scoresError,
                handleLogin,
                handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
