import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveUsers } from "../context/ActiveUsersContext";
import { decodeUsersParam, encodeUsersParam } from "../utility";

export function useMission() {
    const { missionName, users: usersParam } = useParams();
    const urlUsers = decodeUsersParam(usersParam);

    const {
        data: mission,
        isLoading: missionLoading,
        error: missionError
    } = useQuery({
        queryKey: ['mission', missionName],
        queryFn: async () => {
            const res = await fetch(`/api/missions/${encodeURIComponent(missionName)}`);
            if (!res.ok) throw new Error('Failed to fetch mission');
            return res.json();
        },
    });

    const allModuleIds = mission ?
        [...new Set(mission.bombs.flatMap(bomb =>
            bomb.pools?.flatMap(pool => pool.modules) || []
        ))] : [];

    const {
        data: modulesData = {},
        isLoading: modulesLoading,
    } = useQuery({
        queryKey: ['modules', missionName],
        queryFn: async () => {
            if (!allModuleIds.length)
                return {};
            const res = await fetch('/api/modules/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: allModuleIds }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Failed to fetch modules: ${res.status} ${errorData.message || 'Unknown error'}`);
            }
            const data = await res.json();
            const dict = {};
            data.forEach((m) => { if (m.module_id) { dict[m.module_id] = m;} });
            return dict;
        },
        enabled: !!mission && allModuleIds.length > 0,
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    const {
        data: activeUsers = [],
        isLoading: usersLoading,
    } = useQuery({
        queryKey: ['missionUsers', usersParam],
        queryFn: async () => {
            if (!urlUsers.length) return [];

            const fetched = await Promise.all(
                urlUsers.map(async ({ id, isDefuser }) => {
                    const [userRes, scoresRes] = await Promise.all([
                        fetch(`/api/users/${id}`),
                        fetch(`/api/users/${id}/scores`),
                    ]);
                    if (!userRes.ok) throw new Error(`Failed to fetch user ${id}`);
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
                        isDefuser,
                    };
                })
            );

            const hasDefuser = fetched.some((u) => u.isDefuser);
            return hasDefuser
                ? fetched
                : fetched.map((u, i) => ({ ...u, isDefuser: i === 0 }));
        },
        enabled: urlUsers.length > 0,
        staleTime: 1000 * 60 * 5,
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && urlUsers.length > 0) {
                queryClient.invalidateQueries({ queryKey: ['missionUsers', usersParam] });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [queryClient, usersParam, urlUsers.length]);

    const isLoading = missionLoading || modulesLoading || usersLoading;
    const error = missionError;

    return {
        mission,
        modulesData: isLoading ? {} : modulesData,
        activeUsers,
        isLoading,
        error,
    };
}
