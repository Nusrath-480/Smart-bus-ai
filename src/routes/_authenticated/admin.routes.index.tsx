import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Plus, Route as RouteIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { routesQuery } from "@/lib/data";
import { EmptyState, Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/routes/")({ component: Routes });

function Routes() {
  const qc = useQueryClient();
  const routes = useQuery(routesQuery);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });

  const create = useMutation({
    mutationFn: async () => {
      const code = form.code.trim().toUpperCase(), name = form.name.trim();
      if (!code || code.length > 20) throw new Error("Route code required (max 20)");
      if (!name || name.length > 120) throw new Error("Route name required");
      const { error } = await supabase.from("routes").insert({ code, name, description: form.description.trim() || null });
      if (error) throw new Error(error.code === "23505" ? "That route code already exists" : error.message);
    },
    onSuccess: () => { toast.success("Route created"); setOpen(false); setForm({ code: "", name: "", description: "" }); qc.invalidateQueries({ queryKey: ["routes"] }); },
    onError: (e) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("routes").update({ is_active }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routes"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("routes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Route deleted"); qc.invalidateQueries({ queryKey: ["routes"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (routes.isLoading) return <Loading />;
  return (
    <div>
      <PageTitle title="Routes" subtitle="Define routes and their ordered stops." action={<Button variant="gold" onClick={() => setOpen(true)}><Plus /> Add route</Button>} />
      {!routes.data?.length ? (
        <EmptyState icon={RouteIcon} title="No routes yet" text="Create a route, then add its stops." />
      ) : (
        <div className="card-surface divide-y divide-border">
          {routes.data.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <Link to="/admin/routes/$routeId" params={{ routeId: r.id }} className="flex flex-1 items-center gap-3">
                <span className="rounded-lg bg-primary px-2 py-1 font-display text-xs font-bold text-primary-foreground">{r.code}</span>
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.route_stops?.[0]?.count ?? 0} stops</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-3">
                <StatusPill tone={r.is_active ? "success" : "muted"}>{r.is_active ? "active" : "inactive"}</StatusPill>
                <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} aria-label="Active" />
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Delete route ${r.code}? Its stops will be removed.`) && remove.mutate(r.id)}><Trash2 className="text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add route</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Code</Label><Input placeholder="R1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Name</Label><Input placeholder="City Centre – Campus" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button variant="gold" onClick={() => create.mutate()} disabled={create.isPending}>Create route</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
