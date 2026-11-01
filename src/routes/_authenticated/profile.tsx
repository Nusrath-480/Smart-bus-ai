import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loading, PageTitle, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile — SmartBus-AI" }, { name: "description", content: "Manage your SmartBus-AI profile and journey preferences." }, { property: "og:title", content: "My profile — SmartBus-AI" }, { property: "og:description", content: "Manage your SmartBus-AI profile and journey preferences." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

function Profile() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const adminExists = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => (await supabase.rpc("admin_exists")).data ?? true,
  });
  const [form, setForm] = useState({ full_name: "", phone: "" });
  useEffect(() => {
    if (profile.data) setForm({ full_name: profile.data.full_name, phone: profile.data.phone ?? "" });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const name = form.full_name.trim();
      if (name.length < 2 || name.length > 120) throw new Error("Enter your full name");
      if (form.phone && !/^[+\d\s-]{6,20}$/.test(form.phone)) throw new Error("Enter a valid phone number");
      const { error } = await supabase.from("profiles").update({ full_name: name, phone: form.phone || null }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (profile.isLoading) return <Loading />;
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="My profile" subtitle={user?.email ?? ""} />
      <div className="card-surface space-y-4 p-6">
        <div className="flex flex-wrap gap-2">{roles.map((r) => <StatusPill key={r} tone="teal">{r}</StatusPill>)}</div>
        <div className="space-y-1.5">
          <Label htmlFor="n">Full name</Label>
          <Input id="n" className="h-11 rounded-xl" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p">Phone</Label>
          <Input id="p" className="h-11 rounded-xl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Button variant="gold" className="h-11 rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>Save changes</Button>
      </div>
      {adminExists.data === false && (
        <div className="card-surface mt-6 flex items-start gap-4 p-6">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-teal" />
          <div>
            <h3 className="font-semibold">First-time setup</h3>
            <p className="mt-1 text-sm text-muted-foreground">No administrator exists yet. The first person to complete setup becomes the administrator.</p>
            <Button variant="teal" className="mt-3" asChild><Link to="/setup">Open admin setup</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
