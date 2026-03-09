import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDailyQuotes() {
  return useQuery({
    queryKey: [api.quotes.daily.path],
    queryFn: async () => {
      const res = await fetch(api.quotes.daily.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily quotes");
      return res.json();
    },
  });
}
