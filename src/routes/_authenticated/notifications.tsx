import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notificationsQuery } from "@/lib/notifications";
import { EmptyState, Loading, PageTitle } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SmartBus-AI" }, { name: "robots", content: "noindex" }] }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const list = useQuery(notificationsQuery(user?.id));
  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOne = useMutation({
    mutationFn: async (id: string) => { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (list.isLoading) return <Loading />;
  const unread = (list.data ?? []).filter((n) => !n.read_at).length;
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Notifications" subtitle={unread ? `${unread} unread` : "You're all caught up"}
        action={unread > 0 ? <Button variant="outline" onClick={() => markAll.mutate()}><CheckCheck /> Mark all read</Button> : undefined} />
      {!list.data?.length ? (
        <EmptyState icon={Bell} title="No notifications yet" text="Arrival alerts, delays and service updates will show up here." />
      ) : (
        <div className="card-surface divide-y divide-border">
          {list.data.map((n) => (
            <button key={n.id} onClick={() => !n.read_at && markOne.mutate(n.id)} className={cn("flex w-full gap-3 p-4 text-left", !n.read_at && "bg-teal-soft/50")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read_at ? "bg-border" : "bg-teal")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
