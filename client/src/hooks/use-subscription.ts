import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { useLocation } from "wouter";

export interface SubscriptionStatus {
  id: number;
  userId: string;
  status: "trial" | "active" | "cancelled" | "expired";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export function useSubscription() {
  return useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription"],
    retry: false,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/checkout", {});
      const data = await res.json();
      return data as { url: string };
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}

export function useVerifySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("POST", "/api/subscription/verify-session", { sessionId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
  });
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
