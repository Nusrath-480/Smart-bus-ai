import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="bg-gradient-navy text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Brand onDark />
          <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">
            Smarter campus mobility through real-time tracking and intelligent predictions.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Quick links</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            <li><Link to="/" className="hover:text-primary-foreground">Home</Link></li>
            <li><Link to="/features" className="hover:text-primary-foreground">Features</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary-foreground">How It Works</Link></li>
            <li><Link to="/about" className="hover:text-primary-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            <li>Transport Office</li>
            <li>support@yourcollege.edu</li>
            <li><Link to="/auth" className="hover:text-primary-foreground">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} SmartBus-AI. Your Journey. Made Smarter.
      </div>
    </footer>
  );
}
