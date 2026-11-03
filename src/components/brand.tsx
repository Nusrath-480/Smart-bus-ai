
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <img
        src="/favicon.png"
        alt="SmartBus-AI Logo"
        className="h-10 w-10 rounded-full object-contain"
      />

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
