import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHabits, useCreateHabit, useLogHabit } from "@/hooks/use-habits";
import { useState } from "react";
import { Plus, Check, Target, Trophy } from "lucide-react";
import { format, isToday } from "date-fns";

export default function Habits() {
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const [newHabit, setNewHabit] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    createHabit.mutate(newHabit, {
      onSuccess: () => setNewHabit("")
    });
  };

  return (
    <PageTransition>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Habit Tracker</h1>
        <p className="text-muted-foreground mt-2">Build consistency through small daily actions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleAdd} className="flex gap-3">
            <Input 
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Add a new habit (e.g., Drink Water)"
              className="h-14 rounded-2xl bg-card border-border/50 shadow-sm px-6 text-lg"
            />
            <Button type="submit" disabled={!newHabit.trim() || createHabit.isPending} className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Add
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {habits?.map(({ habit, logs }: any) => {
                const completedToday = logs.some((l: any) => isToday(new Date(l.completedAt)));
                
                return (
                  <div key={habit.id} className="glass-card p-4 rounded-2xl flex items-center justify-between group hover-elevate">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => !completedToday && logHabit.mutate(habit.id)}
                        disabled={completedToday || logHabit.isPending}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                          ${completedToday 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                            : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
                          }`}
                      >
                        <Check className={`w-6 h-6 ${completedToday ? 'opacity-100' : 'opacity-30'}`} />
                      </button>
                      <div>
                        <h3 className={`text-lg font-bold transition-colors ${completedToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          {habit.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Created {format(new Date(habit.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex gap-1">
                      {/* Placeholder for weekly progress pills */}
                      {[...Array(7)].map((_, i) => (
                        <div key={i} className={`w-3 h-8 rounded-full ${i === 6 && completedToday ? 'bg-emerald-500' : 'bg-secondary'}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {habits?.length === 0 && (
                <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border">
                  <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No habits yet</h3>
                  <p className="text-muted-foreground">Start small. Add your first habit above.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border/50 h-fit">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Consistency is Key</h3>
          <p className="text-muted-foreground mb-6">
            Focus on showing up every day. Missing a day is okay, just don't miss two in a row.
          </p>
          <div className="bg-secondary/50 rounded-2xl p-4 text-center">
            <div className="text-4xl font-black text-primary mb-1">
              {habits?.length || 0}
            </div>
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Active Habits
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
