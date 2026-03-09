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
  Phone,
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
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Daily Check-in", url: "/check-in", icon: CheckSquare },
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

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              H
            </span>
            Humanity Hub
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-6 text-xs uppercase tracking-wider">
            Your Journey
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        w-full justify-start rounded-xl mb-1 px-4 py-3 transition-all duration-200
                        ${isActive 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "text-foreground hover:bg-secondary hover:text-foreground"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
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

      <SidebarFooter className="p-4 border-t border-border/50 space-y-3">
        <Button 
          variant="destructive" 
          className="w-full justify-start gap-3 rounded-xl hover:shadow-lg shadow-destructive/20 transition-all font-semibold"
          onClick={() => window.open('https://988lifeline.org/', '_blank')}
        >
          <Phone className="w-4 h-4" />
          Crisis Support
        </Button>
        
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-foreground/70" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium truncate">{user?.firstName || 'User'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout" className="shrink-0 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
