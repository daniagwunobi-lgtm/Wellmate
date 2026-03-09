import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useMoodLogs() {
  return useQuery({
    queryKey: [api.moodLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.moodLogs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mood logs");
      return res.json();
    },
  });
}

export function useJournal() {
  return useQuery({
    queryKey: [api.journal.list.path],
    queryFn: async () => {
      const res = await fetch(api.journal.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch journal entries");
      return res.json();
    },
  });
}

type CheckInInput = z.infer<typeof api.moodLogs.createCheckIn.input>;

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CheckInInput) => {
      const res = await fetch(api.moodLogs.createCheckIn.path, {
        method: api.moodLogs.createCheckIn.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit check-in");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.moodLogs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.journal.list.path] });
    },
  });
}
