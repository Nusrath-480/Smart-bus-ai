import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Check, MapPin, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { EmptyState, Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/incidents")({
  head: () => ({ meta: [{ title: "Incidents — SmartBus-AI" }, { name: "description", content: "Review transport incident reports and their resolution." }, { property: "og:title", content: "Incidents — SmartBus-AI" }, { property: "og:description", content: "Review transport incident reports and their resolution." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Incidents });

const sevTone = { low: "muted", medium: "teal", high: "warning", critical: "danger" } as const;

function Incidents() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<"open" | "all">("open");
  const list = useQuery({
    queryKey: ["incidents", tab],
    queryFn: async () => {
      let q = supabase.from("incidents").select("*, buses(bus_number)").order("created_at", { ascending: false }).limit(200);
      if (tab === "open") q = q.neq("status", "resolved");
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
  const reporters = useQuery({
    queryKey: ["incident-reporters", list.data?.map((i) => i.reported_by).join(",")],
    enabled: !!list.data?.length,
    queryFn: async () => {
      const ids = [...new Set(list.data!.map((i) => i.reported_by))];
      const { data } = await supabase.from("profiles").select("id, full_name, email, phone").in("id", ids);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`incidents-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => qc.invalidateQueries({ queryKey: ["incidents"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "acknowledged" | "resolved" }) => {
      const { error } = await supabase.from("incidents").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
      await supabase.from("audit_logs").insert({ actor_id: user!.id, action: `incident_${status}`, entity: "incidents", entity_id: id });
    },
    onSuccess: () => { toast.success("Incident updated"); qc.invalidateQueries({ queryKey: ["incidents"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Alerts & incidents" subtitle="Breakdowns, emergencies and delays reported by drivers." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList><TabsTrigger value="open">Open</TabsTrigger><TabsTrigger value="all">All</TabsTrigger></TabsList>
      </Tabs>
      {list.isLoading ? <Loading /> : !list.data?.length ? (
        <EmptyState icon={ShieldAlert} title="No incidents" text="All quiet. New reports appear here instantly." />
      ) : (
        <div className="space-y-3">
          {list.data.map((i) => {
            const r = reporters.data?.[i.reported_by];
            return (
              <div key={i.id} className={cn("card-surface p-5", i.severity === "critical" && i.status === "open" && "border-destructive")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize">{i.type}{i.buses ? ` · Bus ${i.buses.bus_number}` : ""}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })} · by {r?.full_name || r?.email || "unknown"}{r?.phone ? ` · ${r.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusPill tone={sevTone[i.severity]}>{i.severity}</StatusPill>
                    <StatusPill tone={i.status === "resolved" ? "success" : i.status === "acknowledged" ? "teal" : "warning"}>{i.status}</StatusPill>
                  </div>
                </div>
                {i.description && <p className="mt-3 text-sm">{i.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {i.latitude != null && (
                    <a className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline" target="_blank" rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${i.latitude},${i.longitude}`}><MapPin className="h-4 w-4" /> Open location</a>
                  )}
                  <div className="ml-auto flex gap-2">
                    {i.status === "open" && <Button size="sm" variant="outline" onClick={() => update.mutate({ id: i.id, status: "acknowledged" })}>Acknowledge</Button>}
                    {i.status !== "resolved" && <Button size="sm" variant="teal" onClick={() => update.mutate({ id: i.id, status: "resolved" })}><Check /> Resolve</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
