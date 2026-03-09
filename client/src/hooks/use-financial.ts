import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type FinancialInput = z.infer<typeof api.financial.upsert.input>;

export function useFinancial() {
  return useQuery({
    queryKey: [api.financial.get.path],
    queryFn: async () => {
      const res = await fetch(api.financial.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch financial data");
      return res.json();
    },
  });
}

export function useUpsertFinancial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FinancialInput) => {
      const res = await fetch(api.financial.upsert.path, {
        method: api.financial.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update financial data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.financial.get.path] });
    },
  });
}
