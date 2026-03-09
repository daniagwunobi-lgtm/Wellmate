import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useChatInteract() {
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(api.chat.interact.path, {
        method: api.chat.interact.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to interact with companion");
      return res.json();
    },
  });
}
