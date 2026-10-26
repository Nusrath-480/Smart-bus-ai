import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Bell, Brain, Bus, Clock, LayoutDashboard, LogIn, MapPin, Navigation,
  Repeat, Route as RouteIcon, ShieldAlert, Siren, Sparkles, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-navy text-primary-foreground">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-gold">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered college transport
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
            Your Journey.<br /><span className="text-gold">Made Smarter.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-primary-foreground/75 md:text-lg">
            Real-time bus tracking, intelligent arrival predictions, and smarter alternative-bus
            suggestions — designed for a more reliable college commute.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="gold" size="lg" className="h-12 rounded-xl" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Explore SmartBus <ArrowRight /></Link>
            </Button>
            <Button variant="onNavy" size="lg" className="h-12 rounded-xl" asChild>
              <Link to="/how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <p className="mb-2 text-right text-[11px] uppercase tracking-wider text-primary-foreground/50">
        Example preview — illustrative values
      </p>
      <div className="rounded-3xl bg-card p-4 text-card-foreground shadow-lift">
        {/* route map */}
        <div className="relative h-44 overflow-hidden rounded-2xl bg-teal-soft">
          <svg viewBox="0 0 300 160" className="absolute inset-0 h-full w-full">
            <path d="M20 130 C 80 120, 90 40, 150 60 S 240 120, 280 30" fill="none"
              stroke="var(--teal)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 0" />
            {[[20, 130], [150, 60], [280, 30]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="7" fill="var(--card)" stroke="var(--primary)" strokeWidth="3" />
            ))}
          </svg>
          <div className="absolute left-[44%] top-[30%] grid h-9 w-9 place-items-center rounded-full bg-gold text-gold-foreground shadow-lift">
            <Bus className="h-4 w-4" />
          </div>
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold text-teal">
            <span className="live-dot h-2 w-2 rounded-full bg-teal" /> Live tracking
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Bus 12 · Route R3</p>
            <p className="font-display text-lg font-bold">Arriving at Main Gate</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Example ETA</p>
            <p className="font-display text-2xl font-bold text-teal">6 min</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gold-soft p-3">
            <p className="flex items-center gap-1 text-[11px] font-semibold text-primary"><Users className="h-3.5 w-3.5" /> Predicted occupancy</p>
            <p className="mt-1 font-display text-xl font-bold">92%</p>
            <div className="mt-2 h-1.5 rounded-full bg-card"><div className="h-full w-[92%] rounded-full bg-warning" /></div>
          </div>
          <div className="rounded-xl bg-teal-soft p-3">
            <p className="flex items-center gap-1 text-[11px] font-semibold text-accent-foreground"><Repeat className="h-3.5 w-3.5" /> Suggested alternative</p>
            <p className="mt-1 font-display text-xl font-bold">Bus 07</p>
            <p className="text-[11px] text-muted-foreground">58% full · +3 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Navigation, title: "Live Bus Tracking", text: "See where your college bus is on the map, updated from the driver's device." },
  { icon: Clock, title: "Smart ETA Prediction", text: "Arrival estimates that learn from traffic, time of day, and past trips." },
  { icon: Users, title: "Occupancy Prediction", text: "Know how crowded your bus is likely to be before it reaches your stop." },
  { icon: Repeat, title: "Smart Bus Recommendations", text: "Get a suitable alternative bus when yours is predicted to be overcrowded." },
  { icon: Bell, title: "Real-Time Notifications", text: "Alerts for arrivals, delays, route changes, and service updates." },
  { icon: RouteIcon, title: "Route Deviation Detection", text: "Unusual detours and unexpected delays are flagged automatically." },
  { icon: Siren, title: "Emergency Support", text: "Drivers report breakdowns and emergencies in one tap." },
  { icon: LayoutDashboard, title: "Centralized Bus Management", text: "Admins manage any number of buses, routes, drivers, and schedules." },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeading eyebrow="Features" title="Everything your commute needs" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card-surface group p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-teal transition-colors group-hover:bg-teal group-hover:text-teal-foreground">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { icon: LogIn, title: "Sign in securely", text: "Use your college account to access your personalised dashboard." },
  { icon: MapPin, title: "Track your bus", text: "Follow your bus live and see when it will reach your stop." },
  { icon: Users, title: "Check predicted occupancy", text: "See how full the bus is expected to be when it arrives." },
  { icon: Repeat, title: "Find a suitable alternative", text: "If it's overcrowded, get a recommended bus that works for you." },
];

export function HowItWorks() {
  return (
    <section className="bg-card py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading eyebrow="How it works" title="Four steps to a smarter commute" />
        <ol className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border p-6">
              <span className="font-display text-4xl font-bold text-gold">0{i + 1}</span>
              <s.icon className="absolute right-6 top-7 h-5 w-5 text-teal" />
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const ai = [
  { icon: Clock, title: "ETA prediction", text: "Combines live GPS, distance to your stop, and historical trip times to estimate arrival." },
  { icon: Users, title: "Occupancy prediction", text: "Uses past boarding patterns by stop, day, and time to forecast how full a bus will be." },
  { icon: Repeat, title: "Intelligent recommendations", text: "Ranks nearby buses by predicted space, arrival time, and route fit." },
  { icon: ShieldAlert, title: "Route deviation detection", text: "Compares live positions with the planned route and flags unusual detours or delays." },
];

export function SmartAI() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal"><Brain className="h-4 w-4" /> Smart AI</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Not just “when is my bus coming?”</h2>
          <p className="mt-4 text-muted-foreground">
            SmartBus-AI also answers: will my bus be overcrowded — and which bus should I take instead?
            Predictions are always labelled with their source so you know what's live and what's estimated.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ai.map((a) => (
            <div key={a.title} className="card-surface p-5">
              <a.icon className="h-5 w-5 text-teal" />
              <h3 className="mt-3 text-sm font-semibold">{a.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="bg-card py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <SectionHeading eyebrow="About" title="Why SmartBus-AI exists" />
        <p className="mt-6 text-muted-foreground">
          Every morning, students wait at stops without knowing where their bus is, when it will arrive, or
          whether there will be room to board. Missed buses, packed aisles, and long waits make the day harder
          before it begins.
        </p>
        <p className="mt-4 text-muted-foreground">
          SmartBus-AI brings live locations, arrival predictions, and capacity forecasts together in one
          place — and gives the transport office the tools to manage a fleet of any size, respond to
          incidents, and keep every route running smoothly.
        </p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="bg-gradient-navy rounded-3xl px-6 py-14 text-center text-primary-foreground md:px-16">
        <h2 className="text-3xl font-bold md:text-4xl">Make Every College Journey Smarter.</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/75">
          Join your campus on SmartBus-AI and travel with confidence.
        </p>
        <Button variant="gold" size="lg" className="mt-8 h-12 rounded-xl" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>Get Started <ArrowRight /></Link>
        </Button>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="bg-gradient-navy text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-primary-foreground/75">{subtitle}</p>
      </div>
    </section>
  );
}
