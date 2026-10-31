import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3, Bell, Bus, CalendarClock, Radar, ShieldAlert, Gauge, Home, LogOut, Map, Route as RouteIcon, User, UserCog, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { useAuth, type AppRole } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationFeed } from "@/lib/notifications";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };

const navByRole: Record<AppRole, NavItem[]> = {
  student: [
    { to: "/student", label: "Home", icon: Home, exact: true },
    { to: "/student/routes", label: "Routes", icon: Map },
    { to: "/notifications", label: "Alerts", icon: Bell },
    { to: "/profile", label: "Profile", icon: User },
  ],
  driver: [
    { to: "/driver", label: "Trip", icon: Gauge, exact: true },
    { to: "/notifications", label: "Alerts", icon: Bell },
    { to: "/profile", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: Gauge, exact: true },
    { to: "/admin/monitor", label: "Monitor", icon: Radar },
    { to: "/admin/incidents", label: "Incidents", icon: ShieldAlert },
    { to: "/admin/buses", label: "Buses", icon: Bus },
    { to: "/admin/routes", label: "Routes", icon: RouteIcon },
    { to: "/admin/schedules", label: "Schedules", icon: CalendarClock },
    { to: "/admin/assignments", label: "Assignments", icon: UserCog },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: User },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const unread = useNotificationFeed(user?.id);
  const items = role ? navByRole[role] : [{ to: "/profile", label: "Profile", icon: User }];
  const mobileItems = items.slice(0, 5);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="p-5"><Brand onDark /></div>
        <nav className="flex-1 space-y-1 px-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 bg-sidebar-accent" />)
            : items.map((i) => (
                <Link
                  key={i.to}
                  to={i.to}
                  activeOptions={{ exact: !!i.exact }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
                  activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
                >
                  <i.icon className="h-4 w-4" /> {i.label} {i.to === "/notifications" && unread > 0 && <span className="ml-auto rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">{unread}</span>}
                </Link>
              ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
          <p className="text-xs font-semibold capitalize text-sidebar-primary">{role ?? "—"}</p>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:hidden">
          <Brand />
          <button onClick={signOut} aria-label="Sign out" className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card md:hidden">
        {mobileItems.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            activeOptions={{ exact: !!i.exact }}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-teal" }}
          >
            <span className="relative"><i.icon className="h-5 w-5" />{i.to === "/notifications" && unread > 0 && <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-gold" />}</span> {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
