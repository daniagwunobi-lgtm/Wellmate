import { useState, useEffect } from "react";
import { Phone, ExternalLink, X, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getResourcesByCountry, detectCountryCode, type CountryCrisis } from "@/lib/crisis-resources";

export function CrisisSupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        className="w-full justify-start gap-3 rounded-xl font-semibold"
        onClick={() => setOpen(true)}
        data-testid="button-crisis-support"
      >
        <Phone className="w-4 h-4 shrink-0" />
        Crisis Support
      </Button>
      <CrisisSupportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CrisisSupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [resources, setResources] = useState<CountryCrisis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || resources) return;
    setLoading(true);
    detectCountryCode()
      .then((code) => setResources(getResourcesByCountry(code)))
      .finally(() => setLoading(false));
  }, [open, resources]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-crisis-support">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Phone className="w-5 h-5 text-destructive" />
            Crisis Support Resources
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are not alone. Reach out to a trained counsellor right now — it's free and confidential.
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting your location…
            </div>
          )}

          {resources && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>Showing resources for <strong>{resources.flag} {resources.countryName}</strong></span>
              </div>

              <div className="space-y-3">
                {resources.resources.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/60 bg-card p-4 space-y-1.5"
                    data-testid={`card-crisis-resource-${i}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm">{r.name}</p>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {r.number && (
                      <a
                        href={r.number.startsWith("Text") ? undefined : `tel:${r.number.replace(/\s/g, "")}`}
                        className="block text-primary font-bold text-base hover:underline"
                      >
                        {r.number}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground">{r.available}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
            If you are in immediate danger, please call your local emergency services (e.g. 999 in UK, 911 in US).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
