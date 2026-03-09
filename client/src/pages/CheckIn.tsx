import { PageTransition } from "@/components/layout/PageTransition";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateCheckIn } from "@/hooks/use-wellbeing";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { useVerifySession } from "@/hooks/use-subscription";

export default function CheckIn() {
  const verifySession = useVerifySession();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      verifySession.mutate(sessionId, {
        onSuccess: () => {
          toast({ title: "Subscription activated!", description: "You now have full access to Daily Check-In." });
          window.history.replaceState({}, "", "/check-in");
        },
      });
    }
  }, []);
  const [mood, setMood] = useState([5]);
  const [stress, setStress] = useState([5]);
  const [energy, setEnergy] = useState([5]);
  const [motivation, setMotivation] = useState([5]);
  const [productivity, setProductivity] = useState([5]);
  const [notes, setNotes] = useState("");
  const [journal, setJournal] = useState("");

  const createCheckIn = useCreateCheckIn();

  const handleSubmit = () => {
    createCheckIn.mutate(
      {
        moodScore: mood[0],
        stressLevel: stress[0],
        energyLevel: energy[0],
        motivationLevel: motivation[0],
        productivityLevel: productivity[0],
        notes,
        journalContent: journal || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Check-in Complete!",
            description: "Your wellbeing data has been logged.",
          });
          setNotes("");
          setJournal("");
        },
      }
    );
  };

  return (
    <PageTransition className="max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Daily Check-in</h1>
        <p className="text-muted-foreground mt-2">Take a moment to reflect on how you're feeling today.</p>
      </header>

      <SubscriptionGate>
        <div className="bg-card rounded-3xl p-6 md:p-10 shadow-lg shadow-black/5 border border-border/60">
          <div className="space-y-10">
            <MetricSlider label="Overall Mood" value={mood} setValue={setMood} description="How are you feeling generally?" color="bg-primary" />
            <MetricSlider label="Stress Level" value={stress} setValue={setStress} description="How much tension are you holding?" color="bg-rose-500" />
            <MetricSlider label="Energy" value={energy} setValue={setEnergy} description="How physically energized do you feel?" color="bg-amber-500" />
            <MetricSlider label="Motivation" value={motivation} setValue={setMotivation} description="Ready to tackle the day?" color="bg-blue-500" />
            <MetricSlider label="Productivity" value={productivity} setValue={setProductivity} description="How much did you get done?" color="bg-emerald-500" />

            <hr className="border-border" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Quick Notes (Optional)</label>
                <Textarea
                  placeholder="What contributed to your feelings today?"
                  className="resize-none rounded-xl bg-secondary/50 border-transparent focus:bg-background h-24"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-notes"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Journal Entry (Optional)</label>
                <Textarea
                  placeholder="Write a deeper reflection..."
                  className="resize-none rounded-xl bg-secondary/50 border-transparent focus:bg-background h-32"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  data-testid="input-journal"
                />
              </div>
            </div>

            <Button
              className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/25 hover:-translate-y-0.5 transition-all"
              onClick={handleSubmit}
              disabled={createCheckIn.isPending}
              data-testid="button-complete-checkin"
            >
              {createCheckIn.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5 mr-2" /> Complete Check-in</>
              )}
            </Button>
          </div>
        </div>
      </SubscriptionGate>
    </PageTransition>
  );
}

function MetricSlider({ label, value, setValue, description, color }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end gap-1">
        <div>
          <h3 className="font-bold text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${color}`}>
          {value[0]}
        </div>
      </div>
      <Slider
        defaultValue={[5]}
        max={10}
        min={1}
        step={1}
        value={value}
        onValueChange={setValue}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
        <span>Low (1)</span>
        <span>High (10)</span>
      </div>
    </div>
  );
}
