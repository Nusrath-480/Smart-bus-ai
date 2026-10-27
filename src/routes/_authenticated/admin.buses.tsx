import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bus, Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { busesQuery, routesQuery } from "@/lib/data";
import { DemoBadge, EmptyState, Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/buses")({ component: Buses });

const busSchema = z.object({
  bus_number: z.string().trim().min(1, "Bus number required").max(20),
  registration_number: z.string().trim().max(30),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(200),
  status: z.enum(["active", "maintenance", "inactive"]),
  route_id: z.string(),
});
type BusForm = z.input<typeof busSchema>;
const empty: BusForm = { bus_number: "", registration_number: "", capacity: 50, status: "active", route_id: "none" };

function Buses() {
  const qc = useQueryClient();
  const buses = useQuery(busesQuery);
  const routes = useQuery(routesQuery);
  const [editing, setEditing] = useState<{ id?: string; form: BusForm } | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const p = busSchema.safeParse(editing!.form);
      if (!p.success) throw new Error(p.error.issues[0].message);
      const row = { ...p.data, registration_number: p.data.registration_number || null, route_id: p.data.route_id === "none" ? null : p.data.route_id };
      const { error } = editing!.id ? await supabase.from("buses").update(row).eq("id", editing!.id) : await supabase.from("buses").insert(row);
      if (error) throw new Error(error.code === "23505" ? "A bus with that number already exists" : error.message);
    },
    onSuccess: () => { toast.success("Bus saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["buses"] }); },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("buses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Bus removed"); qc.invalidateQueries({ queryKey: ["buses"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (buses.isLoading) return <Loading />;
  const f = editing?.form;
  const set = (patch: Partial<BusForm>) => setEditing((e) => e && { ...e, form: { ...e.form, ...patch } });

  return (
    <div>
      <PageTitle title="Buses" subtitle="Add, update, deactivate or remove buses — no fleet size limit."
        action={<Button variant="gold" onClick={() => setEditing({ form: empty })}><Plus /> Add bus</Button>} />
      {!buses.data?.length ? (
        <EmptyState icon={Bus} title="No buses yet" text="Add your first bus to get started." />
      ) : (
        <div className="card-surface divide-y divide-border">
          {buses.data.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-soft text-teal"><Bus className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold">Bus {b.bus_number} {b.is_demo && <DemoBadge />}</p>
                  <p className="text-sm text-muted-foreground">{b.routes ? `${b.routes.code} · ${b.routes.name}` : "No route"} · {b.capacity} seats{b.registration_number ? ` · ${b.registration_number}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={b.status === "active" ? "success" : b.status === "maintenance" ? "warning" : "muted"}>{b.status}</StatusPill>
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing({ id: b.id, form: { bus_number: b.bus_number, registration_number: b.registration_number ?? "", capacity: b.capacity, status: b.status, route_id: b.route_id ?? "none" } })}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Remove bus ${b.bus_number}?`) && remove.mutate(b.id)}><Trash2 className="text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit bus" : "Add bus"}</DialogTitle></DialogHeader>
          {f && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Bus number</Label><Input value={f.bus_number} onChange={(e) => set({ bus_number: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={String(f.capacity)} onChange={(e) => set({ capacity: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Registration number</Label><Input value={f.registration_number} onChange={(e) => set({ registration_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Status</Label>
                  <Select value={f.status} onValueChange={(v) => set({ status: v as BusForm["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Route</Label>
                  <Select value={f.route_id} onValueChange={(v) => set({ route_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">No route</SelectItem>{routes.data?.map((r) => <SelectItem key={r.id} value={r.id}>{r.code} · {r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="gold" onClick={() => save.mutate()} disabled={save.isPending}>Save bus</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
