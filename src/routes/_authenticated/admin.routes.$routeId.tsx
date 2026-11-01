import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { stopsQuery } from "@/lib/data";
import { EmptyState, Loading, PageTitle } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/routes/$routeId")({
  head: () => ({ meta: [{ title: "Route stops — SmartBus-AI" }, { name: "description", content: "Manage the ordered stops on a campus bus route." }, { property: "og:title", content: "Route stops — SmartBus-AI" }, { property: "og:description", content: "Manage the ordered stops on a campus bus route." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: RouteStops });

function RouteStops() {
  const { routeId } = Route.useParams();
  const qc = useQueryClient();
  const route = useQuery({ queryKey: ["route", routeId], queryFn: async () => (await supabase.from("routes").select("*").eq("id", routeId).maybeSingle()).data });
  const stops = useQuery(stopsQuery(routeId));
  const [form, setForm] = useState({ name: "", lat: "", lng: "", offset: "" });

  const add = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name || name.length > 120) throw new Error("Stop name required");
      const lat = form.lat ? Number(form.lat) : null, lng = form.lng ? Number(form.lng) : null;
      if ((lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) || (lng !== null && (isNaN(lng) || lng < -180 || lng > 180))) throw new Error("Invalid coordinates");
      const next = (stops.data?.at(-1)?.sequence ?? 0) + 1;
      const { error } = await supabase.from("route_stops").insert({
        route_id: routeId, name, sequence: next, latitude: lat, longitude: lng,
        scheduled_offset_minutes: form.offset ? Math.max(0, parseInt(form.offset)) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setForm({ name: "", lat: "", lng: "", offset: "" }); qc.invalidateQueries({ queryKey: ["stops", routeId] }); qc.invalidateQueries({ queryKey: ["routes"] }); },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("route_stops").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stops", routeId] }); qc.invalidateQueries({ queryKey: ["routes"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (route.isLoading || stops.isLoading) return <Loading />;
  if (!route.data) return <EmptyState icon={MapPin} title="Route not found" />;
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/routes" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> All routes</Link>
      <PageTitle title={`${route.data.code} · ${route.data.name}`} subtitle="Stops in boarding order." />
      <div className="card-surface p-5">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <Input placeholder="Stop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <Input placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          <Input placeholder="+min" value={form.offset} onChange={(e) => setForm({ ...form, offset: e.target.value })} />
          <Button variant="gold" onClick={() => add.mutate()} disabled={add.isPending}><Plus /> Add</Button>
        </div>
        {!stops.data?.length ? (
          <p className="mt-6 text-sm text-muted-foreground">No stops yet. Add the first boarding point above.</p>
        ) : (
          <ol className="mt-5 divide-y divide-border">
            {stops.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-soft text-xs font-bold text-teal">{s.sequence}</span>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.latitude != null ? `${s.latitude.toFixed(5)}, ${s.longitude?.toFixed(5)}` : "No coordinates"}
                      {s.scheduled_offset_minutes != null && ` · +${s.scheduled_offset_minutes} min`}
                    </p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" aria-label="Delete stop" onClick={() => remove.mutate(s.id)}><Trash2 className="text-destructive" /></Button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
