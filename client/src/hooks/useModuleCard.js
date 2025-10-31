import React from "react";
import axios from "axios";
import { useActiveUsers } from "../context/ActiveUsersContext";
import { useQueryClient } from "@tanstack/react-query";

export default function useModuleCard({ module, user, authUser, score, setScores, refetchScores }) {
    const { setActiveUsers } = useActiveUsers();
    const queryClient = useQueryClient();

    const handleScoreChange = async (type, value) => {
        if (!user) return;
        const prevScore = score || { defuserConfidence: "Unknown", expertConfidence: "Unknown", canSolo: false };
        let newScore = { ...prevScore };

        if (type === "defuser") newScore.defuserConfidence = value;
        else if (type === "expert") newScore.expertConfidence = value;
        else if (type === "solo") newScore.canSolo = value;

        setScores(prev => ({ ...prev, [module.module_id]: newScore }));

        try {
            await axios.put(
                `/api/scores/${encodeURIComponent(module.module_id)}`,
                newScore,
                { withCredentials: true }
            );
            if (refetchScores) refetchScores();

            setActiveUsers(prev =>
                prev.map(u =>
                    u.id === user.id
                        ? { ...u, scores: { ...u.scores, [module.module_id]: newScore } }
                        : u
                )
            );
            queryClient.invalidateQueries(["missions"]);
        } catch (error) {
            console.error("Failed to update score:", error);
            setScores(prev => ({ ...prev, [module.module_id]: prevScore }));
        }
    };



    return { handleScoreChange };
}