import { PageTransition } from "@/components/layout/PageTransition";
import { useAuth } from "@/hooks/use-auth";
import { useMoodLogs } from "@/hooks/use-wellbeing";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { Activity, Flame, Zap, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: logs, isLoading } = useMoodLogs();

  // Process data for charts
  const chartData = logs?.map(log => ({
    date: format(new Date(log.createdAt), 'MMM dd'),
    mood: log.moodScore,
    stress: log.stressLevel,
    motivation: log.motivationLevel,
  })).reverse() || [];

  const latestLog = logs?.[0];

  return (
    <PageTransition>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{user?.firstName || 'Friend'}</span>
        </h1>
        <p className="text-muted-foreground mt-2">Here's your wellbeing overview for today.</p>
      </header>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard 
              title="Current Mood" 
              value={latestLog?.moodScore ? `${latestLog.moodScore}/10` : '-'} 
              icon={Activity} 
              color="text-emerald-500" 
              bg="bg-emerald-50" 
            />
            <StatCard 
              title="Stress Level" 
              value={latestLog?.stressLevel ? `${latestLog.stressLevel}/10` : '-'} 
              icon={Flame} 
              color="text-rose-500" 
              bg="bg-rose-50" 
            />
            <StatCard 
              title="Energy" 
              value={latestLog?.energyLevel ? `${latestLog.energyLevel}/10` : '-'} 
              icon={Zap} 
              color="text-amber-500" 
              bg="bg-amber-50" 
            />
            <StatCard 
              title="Motivation" 
              value={latestLog?.motivationLevel ? `${latestLog.motivationLevel}/10` : '-'} 
              icon={Target} 
              color="text-blue-500" 
              bg="bg-blue-50" 
            />
          </div>

          {/* Main Chart */}
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Wellbeing Trends</h2>
              <p className="text-sm text-muted-foreground">Your progress over time</p>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-[300px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                    <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                    <Line type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground flex-col gap-2 bg-secondary/30 rounded-2xl border border-dashed border-border">
                <Activity className="w-8 h-8 opacity-50" />
                <p>Complete a daily check-in to see your trends.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
  return (
    <div className="glass-card p-5 rounded-2xl hover-elevate group">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
