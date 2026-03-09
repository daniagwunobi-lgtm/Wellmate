import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSkills() {
  return useQuery({
    queryKey: [api.skills.list.path],
    queryFn: async () => {
      const res = await fetch(api.skills.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json();
    },
  });
}

export function useSetSkills() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (skills: string[]) => {
      const res = await fetch(api.skills.set.path, {
        method: api.skills.set.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set skills");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.skills.list.path] });
    },
  });
}

export function usePurposeMatch() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.skills.purposeMatch.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch purpose match");
      return res.json();
    },
  });
}
