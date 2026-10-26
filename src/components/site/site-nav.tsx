import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useAuth, homePathFor } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button variant="gold" asChild>
              <Link to={homePathFor(role)}>Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button variant="gold" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-lg md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-card px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm font-medium text-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            {user ? (
              <Button variant="gold" className="flex-1" asChild>
                <Link to={homePathFor(role)}>Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button variant="gold" className="flex-1" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
