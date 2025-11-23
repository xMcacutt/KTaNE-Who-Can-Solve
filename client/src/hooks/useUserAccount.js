import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

function normalizeScores(input) {
  if (!input) return {};
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input.map((s) => [
        s.module_id,
        {
          defuserConfidence: s.defuser_confidence,
          expertConfidence: s.expert_confidence,
          canSolo: s.can_solo,
        },
      ])
    );
  }
  return input;
}


export function useUserAccount(profileId) {
  const [localScores, setLocalScores] = useState({});

  const {
    data: profileUser,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profileUser", profileId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${profileId}`, { credentials: "include" });
      if (!res.ok) throw new Error("User does not exist");
      return res.json();
    },
    enabled: !!profileId,
  });

  const {
    data: fetchedScoresArray = [],
    isLoading: scoresLoading,
    refetch: refetchScores,
  } = useQuery({
    queryKey: ["profileScores", profileId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${profileId}/scores`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile scores");
      return res.json();
    },
    enabled: !!profileId,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["modules", "all"],
    queryFn: async () => {
      const res = await fetch(`/api/modules/all`);
      if (!res.ok) throw new Error("Failed to fetch modules");
      return res.json();
    },
  });

  useEffect(() => {
    if (Array.isArray(fetchedScoresArray)) setLocalScores(normalizeScores(fetchedScoresArray));
  }, [fetchedScoresArray]);

  const stats = useMemo(() => {
    const totalModules = modules.length;
    const stats = {
      defuser: { Confident: 0, Attempted: 0, Unknown: 0, Avoid: 0 },
      expert: { Confident: 0, Attempted: 0, Unknown: 0, Avoid: 0 },
      solo: 0
    };
    Object.values(localScores).forEach((score) => {
      stats.defuser[score.defuserConfidence || "Unknown"]++;
      stats.expert[score.expertConfidence || "Unknown"]++;
      stats.solo += score.canSolo ? 1 : 0;
    });
    stats.defuser.Unknown = totalModules - (stats.defuser.Confident + stats.defuser.Attempted + stats.defuser.Avoid);
    stats.expert.Unknown = totalModules - (stats.expert.Confident + stats.expert.Attempted + stats.expert.Avoid);
    return stats;
  }, [localScores, modules]);

  const loading = profileLoading || modulesLoading || scoresLoading;

  return {
    profileUser,
    profileError,
    localScores,
    setLocalScores,
    modules,
    stats,
    refetchScores,
    loading,
  };
}
