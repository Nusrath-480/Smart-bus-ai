import { Link } from "@tanstack/react-router";
import { Bus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-gold-foreground shadow-sm">
        <Bus className="h-5 w-5" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight",
          onDark ? "text-primary-foreground" : "text-primary",
        )}
      >
        SmartBus<span className="text-teal">-AI</span>
      </span>
    </Link>
  );
}
