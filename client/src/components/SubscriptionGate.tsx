import { ReactNode } from "react";
import { useSubscription, useStartCheckout, getTrialDaysRemaining } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Loader2, Clock } from "lucide-react";

interface SubscriptionGateProps {
  children: ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { data: sub, isLoading } = useSubscription();
  const checkout = useStartCheckout();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sub?.hasAccess) {
    const daysLeft = sub.status === "trial" ? getTrialDaysRemaining(sub.trialEndsAt) : null;
    return (
      <div className="space-y-0">
        {daysLeft !== null && daysLeft <= 3 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 text-sm">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-800 dark:text-amber-300">
              Your free trial ends in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.{" "}
              <button
                className="underline font-semibold"
                onClick={() => checkout.mutate()}
              >
                Subscribe now
              </button>{" "}
              to keep access.
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>

      <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
        <Sparkles className="w-3 h-3" />
        Premium Feature
      </Badge>

      <h2 className="text-2xl font-bold mb-3">Daily Check-In</h2>
      <p className="text-muted-foreground max-w-sm mb-2 leading-relaxed">
        Track your mood, stress, energy, and motivation every day to build meaningful insights into your wellbeing.
      </p>

      {sub?.status === "trial" && !sub.hasAccess && (
        <p className="text-sm text-muted-foreground mb-6">Your 3-day free trial has ended.</p>
      )}

      <div className="bg-card border border-border/60 rounded-2xl p-6 mb-8 w-full max-w-sm text-left space-y-3">
        <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">What you get</p>
        {[
          "Daily wellbeing check-in",
          "Mood, stress & energy tracking",
          "Wellbeing analytics & trends",
          "Journal integration",
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">✓</span>
            {f}
          </div>
        ))}
      </div>

      <div className="space-y-3 w-full max-w-xs">
        <Button
          className="w-full h-12 text-base font-bold rounded-xl"
          onClick={() => checkout.mutate()}
          disabled={checkout.isPending}
          data-testid="button-subscribe"
        >
          {checkout.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
          ) : (
            <>Subscribe — £1.99/month</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Cancel anytime. Secure payment via Stripe.
        </p>
      </div>
    </div>
  );
}
