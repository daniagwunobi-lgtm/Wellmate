import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import { MainLayout } from "./components/layout/MainLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Companion from "./pages/Companion";
import Habits from "./pages/Habits";
import Journal from "./pages/Journal";
import SurvivalTracker from "./pages/SurvivalTracker";
import PurposeMatcher from "./pages/PurposeMatcher";
import Quotes from "./pages/Quotes";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        {/* Everything else redirects to landing visually if not authed */}
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/check-in" component={CheckIn} />
        <Route path="/companion" component={Companion} />
        <Route path="/habits" component={Habits} />
        <Route path="/journal" component={Journal} />
        <Route path="/survival" component={SurvivalTracker} />
        <Route path="/purpose" component={PurposeMatcher} />
        <Route path="/quotes" component={Quotes} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
