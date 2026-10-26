import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: typeof Lock; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-soft text-teal"><Icon className="h-6 w-6" /></span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "success" | "warning" | "danger" | "muted" | "teal"; children: ReactNode }) {
  const map = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
    teal: "bg-teal-soft text-teal",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", map[tone])}>{children}</span>;
}

export function DemoBadge() {
  return <span className="rounded-md bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary">DEMO</span>;
}

/** UI-level gate. Real enforcement is done by database access policies. */
export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { roles, loading } = useAuth();
  if (loading) return <Loading />;
  if (!roles.some((r) => allow.includes(r))) {
    return (
      <EmptyState
        icon={Lock}
        title="You don't have access to this page"
        text="This area is restricted. Contact your transport office if you think this is a mistake."
        action={<Button variant="gold" asChild><Link to="/dashboard">Go to my dashboard</Link></Button>}
      />
    );
  }
  return <>{children}</>;
}
