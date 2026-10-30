import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, Bus, Loader2, MapPin, Navigation, Play, Siren, Square, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { shouldSendLocation, toKmh } from "@/lib/gps";
import { EmptyState, Loading, PageTitle, RoleGate, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/driver")({
  head: () => ({ meta: [{ title: "Driver dashboard — SmartBus-AI" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["driver", "admin"]}><DriverHome /></RoleGate>,
});

type Pos = { lat: number; lng: number; speed: number | null; heading: number | null; accuracy: number };

function DriverHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const a = useQuery({
    queryKey: ["driver-assignment", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: d } = await supabase.from("drivers").select("id").eq("profile_id", user!.id).maybeSingle();
      if (!d) return null;
      const { data } = await supabase.from("bus_assignments").select("*, buses(id, bus_number, capacity), routes(id, code, name)").eq("driver_id", d.id).eq("is_active", true).maybeSingle();
      return data ? { ...data, driverId: d.id } : null;
    },
  });
  const busId = a.data?.bus_id;
  const trip = useQuery({
    queryKey: ["driver-trip", busId],
    enabled: !!busId,
    queryFn: async () => (await supabase.from("trips").select("*").eq("bus_id", busId!).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const [direction, setDirection] = useState<"to_college" | "from_college">("to_college");

  const start = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trips").insert({
        bus_id: busId!, driver_id: a.data!.driverId, route_id: a.data!.route_id ?? a.data!.routes?.id ?? null,
        direction, status: "in_progress", started_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Trip started — sharing location"); qc.invalidateQueries({ queryKey: ["driver-trip"] }); },
    onError: (e) => toast.error(e.message),
  });
  const end = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trips").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", trip.data!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Trip ended"); qc.invalidateQueries({ queryKey: ["driver-trip"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (a.isLoading) return <Loading />;
  if (!a.data) return (
    <div className="mx-auto max-w-2xl"><PageTitle title="Driver dashboard" />
      <EmptyState icon={Bus} title="No active assignment" text="The transport office will assign you a bus and route." /></div>
  );
  const active = trip.data;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageTitle title="Driver dashboard" subtitle="Start your trip to share the bus location with students." />
      <div className="bg-gradient-navy rounded-3xl p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">Assigned bus</p>
            <h2 className="mt-1 text-3xl font-bold">Bus {a.data.buses?.bus_number}</h2>
            <p className="mt-1 text-primary-foreground/70">{a.data.routes ? `${a.data.routes.code} · ${a.data.routes.name}` : "No route set"} · {a.data.buses?.capacity} seats</p>
          </div>
          {active ? <StatusPill tone="teal">on trip</StatusPill> : <StatusPill tone="muted">idle</StatusPill>}
        </div>
        {active ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-sm text-primary-foreground/80">Started {formatDistanceToNow(new Date(active.started_at!), { addSuffix: true })} · {active.direction === "to_college" ? "to college" : "from college"}</p>
            <Button variant="onNavy" className="ml-auto" onClick={() => confirm("End this trip and stop sharing location?") && end.mutate()} disabled={end.isPending}><Square /> End trip</Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
              <SelectTrigger className="w-44 border-primary-foreground/25 bg-transparent text-primary-foreground"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="to_college">To college</SelectItem><SelectItem value="from_college">From college</SelectItem></SelectContent>
            </Select>
            <Button variant="gold" size="lg" className="h-11 rounded-xl" onClick={() => start.mutate()} disabled={start.isPending}><Play /> Start trip</Button>
          </div>
        )}
      </div>

      {active && <GpsSharer busId={busId!} tripId={active.id} />}
      {active && <OccupancyReporter busId={busId!} tripId={active.id} capacity={a.data.buses?.capacity ?? 0} />}
      <IncidentReporter busId={busId!} tripId={active?.id ?? null} />
    </div>
  );
}

function GpsSharer({ busId, tripId }: { busId: string; tripId: string }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) { setErr("This device can't share location."); return; }
    let wake: any = null;
    (navigator as any).wakeLock?.request?.("screen").then((w: any) => (wake = w)).catch(() => {});
    const id = navigator.geolocation.watchPosition(
      async (p) => {
        const next: Pos = { lat: p.coords.latitude, lng: p.coords.longitude, speed: p.coords.speed, heading: p.coords.heading, accuracy: p.coords.accuracy };
        setPos(next); setErr(null);
        const now = Date.now();
        if (!shouldSendLocation(last.current, now)) return;
        last.current = now;
        const { error } = await supabase.from("bus_locations").insert({
          bus_id: busId, trip_id: tripId, latitude: next.lat, longitude: next.lng,
          speed_kmh: toKmh(next.speed), heading: next.heading, is_demo: false,
        });
        if (error) { setErr("Couldn't send location — retrying."); last.current = null; }
        else setSentAt(now);
      },
      (e) => setErr(e.code === e.PERMISSION_DENIED ? "Location permission was denied. Allow it in your browser settings." : "Waiting for GPS signal…"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => { navigator.geolocation.clearWatch(id); wake?.release?.(); };
  }, [busId, tripId]);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Navigation className="h-4 w-4 text-teal" /> Location sharing</h3>
        {sentAt && !err ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal"><span className="live-dot h-2 w-2 rounded-full bg-teal" /> Live</span> : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {err && <p className="mt-3 flex items-center gap-2 text-sm text-warning"><AlertTriangle className="h-4 w-4" /> {err}</p>}
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div><p className="text-xs text-muted-foreground">Position</p><p className="font-medium">{pos ? `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Speed</p><p className="font-medium">{pos?.speed != null ? `${toKmh(pos.speed)} km/h` : "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Last sent</p><p className="font-medium">{sentAt ? new Date(sentAt).toLocaleTimeString() : "—"}</p></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Keep this page open while driving. Location is sent every 10 seconds and stops when you end the trip.</p>
    </div>
  );
}

function OccupancyReporter({ busId, tripId, capacity }: { busId: string; tripId: string; capacity: number }) {
  const [count, setCount] = useState("");
  const send = useMutation({
    mutationFn: async (n: number) => {
      if (!Number.isInteger(n) || n < 0 || n > capacity * 2) throw new Error("Enter a valid passenger count");
      const { error } = await supabase.from("occupancy_observations").insert({ bus_id: busId, trip_id: tripId, passenger_count: n, source: "driver" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Passenger count saved"); setCount(""); },
    onError: (e) => toast.error(e.message),
  });
  const presets = [0.25, 0.5, 0.75, 1].map((f) => Math.round(capacity * f));
  return (
    <div className="card-surface p-5">
      <h3 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-teal" /> Passengers on board</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p, i) => <Button key={i} variant="outline" size="sm" onClick={() => send.mutate(p)}>{["¼", "½", "¾", "Full"][i]} · {p}</Button>)}
      </div>
      <div className="mt-3 flex gap-2">
        <Input type="number" inputMode="numeric" placeholder="Exact count" value={count} onChange={(e) => setCount(e.target.value)} className="max-w-40" />
        <Button variant="teal" onClick={() => send.mutate(Number(count))} disabled={!count || send.isPending}>Save</Button>
      </div>
    </div>
  );
}

function IncidentReporter({ busId, tripId }: { busId: string; tripId: string | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<null | "breakdown" | "emergency" | "delay">(null);
  const [form, setForm] = useState({ severity: "high", description: "" });
  const mine = useQuery({
    queryKey: ["my-incidents", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("incidents").select("*").eq("reported_by", user!.id).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });

  const report = useMutation({
    mutationFn: async () => {
      if (form.description.length > 2000) throw new Error("Description is too long");
      const coords = await new Promise<GeolocationCoordinates | null>((res) =>
        navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => res(p.coords), () => res(null), { timeout: 5000 }) : res(null));
      const { error } = await supabase.from("incidents").insert({
        bus_id: busId, trip_id: tripId, reported_by: user!.id, type: open!, severity: form.severity as "low" | "medium" | "high" | "critical",
        description: form.description.trim() || null, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reported. The transport office has been alerted."); setOpen(null); setForm({ severity: "high", description: "" }); qc.invalidateQueries({ queryKey: ["my-incidents"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="card-surface p-5">
      <h3 className="flex items-center gap-2 font-semibold"><Siren className="h-4 w-4 text-destructive" /> Report a problem</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="destructive" className="h-14 flex-col gap-0.5" onClick={() => { setForm({ severity: "critical", description: "" }); setOpen("emergency"); }}><Siren /> Emergency</Button>
        <Button variant="outline" className="h-14 flex-col gap-0.5" onClick={() => { setForm({ severity: "high", description: "" }); setOpen("breakdown"); }}><AlertTriangle className="text-warning" /> Breakdown</Button>
        <Button variant="outline" className="h-14 flex-col gap-0.5" onClick={() => { setForm({ severity: "medium", description: "" }); setOpen("delay"); }}><MapPin className="text-teal" /> Delay</Button>
      </div>
      {!!mine.data?.length && (
        <ul className="mt-4 divide-y divide-border text-sm">
          {mine.data.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2">
              <span className="capitalize">{i.type} · {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</span>
              <StatusPill tone={i.status === "resolved" ? "success" : i.status === "acknowledged" ? "teal" : "warning"}>{i.status}</StatusPill>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">Report {open}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5"><Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low", "medium", "high", "critical"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>What happened? (optional)</Label>
              <Textarea rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">Your current location will be attached if available.</p>
            <Button variant={open === "emergency" ? "destructive" : "gold"} onClick={() => report.mutate()} disabled={report.isPending}>
              {report.isPending && <Loader2 className="animate-spin" />} Send report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
