import { PageTransition } from "@/components/layout/PageTransition";
import { useJournal } from "@/hooks/use-wellbeing";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Journal() {
  const { data: entries, isLoading } = useJournal();

  return (
    <PageTransition>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Journal</h1>
        <p className="text-muted-foreground mt-2">Your past reflections and thoughts.</p>
      </header>

      {isLoading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {entries?.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">No journal entries yet</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Journal entries are created during your Daily Check-in. Take a moment to reflect today.
              </p>
            </div>
          ) : (
            entries?.map((entry: any) => (
              <div key={entry.id} className="glass-card p-6 md:p-8 rounded-3xl hover-elevate group">
                <div className="flex items-center justify-between mb-4">
                  <div className="px-4 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-full">
                    {format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {format(new Date(entry.createdAt), 'h:mm a')}
                  </span>
                </div>
                <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </PageTransition>
  );
}
