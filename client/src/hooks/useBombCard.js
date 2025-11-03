
import axios from "axios";
import { difficultyMap } from "../utility";
import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

function useBombCard(mission, users, onFavouriteChanged, authUser) {
    const missionPageUrl = {
        pathname: `/missions/${encodeURIComponent(mission.mission_name)}`,
        state: { mission, users },
    };
    const [isFavourite, setIsFavourite] = useState(mission.is_favourite);

    useEffect(() => {
        setIsFavourite(mission.is_favourite);
    }, [mission.is_favourite]);

    const handleFavouriteSet = async () => {
        if (!authUser) return;

        const newFavourite = !isFavourite;
        setIsFavourite(newFavourite);

        try {
            await axios.put(
                `/api/users/${authUser.id}/${mission.id}/favourites`,
                { isFavourite: newFavourite },
                { withCredentials: true }
            );
            console.log("Update successful");
            await onFavouriteChanged?.();
        } catch (error) {
            console.error("Failed to update favourite or refetch:", error);
            setIsFavourite(!newFavourite);
        }
    };

    const bombs = Array.isArray(mission.bombs)
        ? mission.bombs
        : JSON.parse(mission.bombs || "[]");

    const allModuleIds = [...new Set(bombs?.flatMap((bomb) => bomb.pools?.flatMap((pool) => pool.modules)) || [])];

    const {
        data: modulesData = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ['modules', mission?.mission_name || JSON.stringify(bombs)],
        queryFn: async () => {
            if (!allModuleIds.length) {
                console.warn('No module names to fetch');
                return {};
            }
            const res = await fetch('/api/modules/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: allModuleIds }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Fetch error:', res.status, errorData.message || 'Unknown error');
                throw new Error(`Failed to fetch modules: ${res.status} ${errorData.message || 'Unknown error'}`);
            }
            const data = await res.json();
            const dict = {};
            data.forEach((m) => {
                if (m.module_id) {
                    dict[m.module_id] = m;
                } else {
                    console.warn('Module missing name:', m);
                }
            });
            return dict;
        },
        enabled: !!bombs && bombs.length > 0 && allModuleIds.length > 0,
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    const formattedDate = mission.date_added
        ? new Date(mission.date_added).toISOString().split("T")[0]
        : "N/A";

    const totalModules = bombs.reduce((sum, bomb) => sum + (bomb.modules || 0), 0);
    const totalTime = bombs.reduce((sum, bomb) => sum + (bomb.time || 0), 0);

    const sortedModuleIds = [...new Set(allModuleIds)]
        .filter((moduleId) => modulesData[moduleId]?.icon_file_name)
        .sort((a, b) => {
            const moduleA = modulesData[a];
            const moduleB = modulesData[b];
            const defuserDiffA = (difficultyMap[moduleA?.defuser_difficulty] || 0);
            const defuserDiffB = (difficultyMap[moduleB?.defuser_difficulty] || 0);
            const expertDiffA = (difficultyMap[moduleA?.expert_difficulty] || 0);
            const expertDiffB = (difficultyMap[moduleB?.expert_difficulty] || 0);
            const valueA = defuserDiffA + expertDiffA;
            const valueB = defuserDiffB + expertDiffB;
            return valueB - valueA;
        })
        .slice(0, 5).reverse();

    const userModuleStats = useMemo(() => {
        if (!Array.isArray(users) || !users.length) return [];

        const defuser = users.find((u) => u.isDefuser);
        const defuserScores = defuser?.scores || [];

        const soloableModulesInMission = defuserScores
            .filter((s) => s.can_solo && allModuleIds.includes(s.module_id))
            .map((s) => s.module_id);

        return users.map((u) => {
            const userScores = Array.isArray(u.scores) ? u.scores : [];

            const knownCount = allModuleIds.filter((moduleId) => {
                const s = userScores.find((sc) => sc.module_id === moduleId);
                const defuserS = defuserScores.find((sc) => sc.module_id === moduleId);

                if (users.length === 1) {
                    const defConf =
                        s?.defuser_confidence === "Confident" ||
                        s?.defuser_confidence === "Attempted";
                    const expConf =
                        s?.expert_confidence === "Confident" ||
                        s?.expert_confidence === "Attempted";
                    return defConf && expConf;
                }

                if (!u.isDefuser && defuserS?.can_solo) return false;

                const conf = u.isDefuser
                    ? s?.defuser_confidence
                    : s?.expert_confidence;
                return conf === "Confident" || conf === "Attempted";
            }).length;

            const total = u.isDefuser
                ? allModuleIds.length
                : allModuleIds.length - soloableModulesInMission.length;

            return {
                id: u.id,
                name: u.name,
                avatar: u.avatar,
                isDefuser: u.isDefuser,
                knownCount,
                totalModules: total,
            };
        });
    }, [users, bombs, modulesData]);

    return {
        bombs,
        missionPageUrl,
        isFavourite,
        handleFavouriteSet,
        isLoading,
        modulesData,
        formattedDate,
        totalModules,
        totalTime,
        sortedModuleIds,
        userModuleStats
    };

};

export default useBombCard