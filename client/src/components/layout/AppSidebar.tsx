import { Link, useLocation } from "wouter";
import {
  Home,
  CheckSquare,
  MessageCircleHeart,
  ListTodo,
  Book,
  PieChart,
  Compass,
  Quote,
  LogOut,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrisisSupportButton } from "@/components/CrisisSupport";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "AI Companion", url: "/companion", icon: MessageCircleHeart },
  { title: "Habits", url: "/habits", icon: ListTodo },
  { title: "Journal", url: "/journal", icon: Book },
  { title: "Survival Tracker", url: "/survival", icon: PieChart },
  { title: "Purpose Matcher", url: "/purpose", icon: Compass },
  { title: "Quotes", url: "/quotes", icon: Quote },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: sub } = useSubscription();

  const isCheckInActive = location === "/check-in";
  const isTrialActive = sub?.status === "trial" && sub?.hasAccess;

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm text-sm">
              H
            </span>
            Humanity Hub
          </h1>
        </div>

        {/* ── Prominent Daily Check-In CTA ─────────────────────────────── */}
        <div className="px-4 pb-2">
          <Link href="/check-in">
            <div
              data-testid="button-daily-checkin-hero"
              className={`
                w-full rounded-2xl p-4 cursor-pointer transition-all duration-200
                ${isCheckInActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-primary/10 hover:bg-primary/20 border border-primary/20 hover-elevate"
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className={`w-5 h-5 ${isCheckInActive ? "text-primary-foreground" : "text-primary"}`} />
                  <span className={`font-bold text-sm ${isCheckInActive ? "text-primary-foreground" : "text-primary"}`}>
                    Daily Check-In
                  </span>
                </div>
                {isTrialActive && !isCheckInActive && (
                  <Badge variant="secondary" className="text-xs px-2">
                    Trial
                  </Badge>
                )}
                {sub?.status === "active" && !isCheckInActive && (
                  <Badge className="text-xs px-2 bg-primary text-primary-foreground">
                    Active
                  </Badge>
                )}
              </div>
              <p className={`text-xs leading-snug mt-1 ${isCheckInActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                How are you feeling today?
              </p>
            </div>
          </Link>
        </div>

        {/* ── Main navigation ───────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-6 text-xs uppercase tracking-wider mt-2">
            Your Journey
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-1">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        w-full justify-start rounded-xl mb-0.5 px-4 py-3 transition-all duration-200
                        ${isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-foreground hover:bg-secondary hover:text-foreground"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3" data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <SidebarFooter className="p-4 border-t border-border/50 space-y-3">
        <CrisisSupportButton />

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-foreground/70" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
              {sub?.status && (
                <p className="text-xs text-muted-foreground capitalize">{sub.status}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            title="Logout"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
