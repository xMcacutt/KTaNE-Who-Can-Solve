import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useActiveUsers } from "../context/ActiveUsersContext";

export function useMission() {
    const { missionName, users: usersParam } = useParams();
    const { activeUsers, setActiveUsers, addUser, removeUser, setDefuser } = useActiveUsers();
    const [loaded, setLoaded] = useState(false);

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
        error: modulesError
    } = useQuery({
        queryKey: ['modules', missionName],
        queryFn: async () => {
            if (!allModuleIds.length) {
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
                throw new Error(`Failed to fetch modules: ${res.status} ${errorData.message || 'Unknown error'}`);
            }
            const data = await res.json();
            const dict = {};
            data.forEach((m) => {
                if (m.module_id) {
                    dict[m.module_id] = m;
                }
            });
            return dict;
        },
        enabled: !!mission && allModuleIds.length > 0,
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    useEffect(() => {
        if (loaded || activeUsers.length > 0 || !usersParam) return;
        setLoaded(true);
        const ids = usersParam.split(',');
        Promise.all(ids.map(async (id) => {
            const resUser = await fetch(`/api/users/${id}`);
            if (!resUser.ok) throw new Error(`Failed to fetch user ${id}`);
            const userData = await resUser.json();
            const resScores = await fetch(`/api/users/${id}/scores`);
            if (!resScores.ok) throw new Error(`Failed to fetch scores for ${id}`);
            const scores = await resScores.json();
            return { ...userData, scores: Array.isArray(scores) ? scores : [], isDefuser: false };
        })).then((newUsers) => {
            if (newUsers.length > 0) {
                newUsers[0].isDefuser = true;
            }
            setActiveUsers(newUsers);
        }).catch((err) => {
            console.error('Error loading users from params:', err);
        });
    }, [usersParam, activeUsers, setActiveUsers, loaded]);

    const isLoading = missionLoading || modulesLoading;
    const error = missionError || modulesError;

    return {
        mission,
        modulesData,
        activeUsers,
        addUser,
        removeUser,
        setDefuser,
        isLoading,
        error
    };
}