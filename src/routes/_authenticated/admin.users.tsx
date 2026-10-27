import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { EmptyState, Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Users });

function Users() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }, { data: drivers }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, phone").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("drivers").select("id, profile_id, is_active"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
        driver: drivers?.find((d) => d.profile_id === p.id),
      }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ id, role, grant }: { id: string; role: AppRole; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase.from("user_roles").insert({ user_id: id, role });
        if (error && error.code !== "23505") throw error;
        if (role === "driver") {
          const { error: e2 } = await supabase.from("drivers").upsert({ profile_id: id, is_active: true }, { onConflict: "profile_id" });
          if (e2) throw e2;
        }
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", role);
        if (error) throw error;
        if (role === "driver") await supabase.from("drivers").update({ is_active: false }).eq("profile_id", id);
      }
      await supabase.from("audit_logs").insert({ actor_id: user!.id, action: grant ? "grant_role" : "revoke_role", entity: "user_roles", entity_id: id, details: { role } });
    },
    onSuccess: () => { toast.success("Access updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["drivers"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (list.isLoading) return <Loading />;
  const rows = (list.data ?? []).filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageTitle title="Users & access" subtitle="Grant driver or admin access. Everyone who registers starts as a student." />
      <Input className="mb-4 max-w-sm" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      {!rows.length ? (
        <EmptyState icon={UsersIcon} title="No users found" />
      ) : (
        <div className="card-surface divide-y divide-border">
          {rows.map((u) => {
            const isDriver = u.roles.includes("driver"), isAdmin = u.roles.includes("admin"), self = u.id === user?.id;
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{u.full_name || "Unnamed"} {self && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <div className="mt-1.5 flex gap-1.5">{u.roles.map((r) => <StatusPill key={r} tone={r === "admin" ? "warning" : r === "driver" ? "teal" : "muted"}>{r}</StatusPill>)}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={isDriver ? "outline" : "teal"} onClick={() => setRole.mutate({ id: u.id, role: "driver", grant: !isDriver })}>
                    {isDriver ? "Remove driver" : "Make driver"}
                  </Button>
                  {!self && (
                    <Button size="sm" variant="outline" onClick={() => confirm(isAdmin ? "Remove admin access?" : "Give this user full admin access?") && setRole.mutate({ id: u.id, role: "admin", grant: !isAdmin })}>
                      {isAdmin ? "Remove admin" : "Make admin"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
