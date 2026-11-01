import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Loading, PageTitle } from "@/components/app/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({ meta: [{ title: "Admin setup — SmartBus-AI" }, { name: "description", content: "Complete the initial SmartBus-AI administrator setup." }, { property: "og:title", content: "Admin setup — SmartBus-AI" }, { property: "og:description", content: "Complete the initial SmartBus-AI administrator setup." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Setup,
});

function Setup() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const exists = useQuery({ queryKey: ["admin-exists"], queryFn: async () => (await supabase.rpc("admin_exists")).data ?? true });

  async function claim() {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data) { toast.error("An administrator already exists."); return; }
    toast.success("You are now the administrator.");
    await qc.invalidateQueries();
    navigate({ to: "/admin" });
  }

  if (exists.isLoading) return <Loading />;
  if (exists.data) {
    return <EmptyState icon={ShieldCheck} title="Setup is complete" text="An administrator already exists. New admins must be granted by an existing administrator." />;
  }
  return (
    <div className="mx-auto max-w-lg">
      <PageTitle title="Initial administrator setup" />
      <div className="card-surface p-6">
        <p className="text-sm text-muted-foreground">
          This one-time step makes your signed-in account the first SmartBus-AI administrator. It is disabled
          permanently once an administrator exists. Only the transport office should do this.
        </p>
        <Button variant="gold" className="mt-5 h-11 rounded-xl" onClick={claim} disabled={busy}>Make me administrator</Button>
      </div>
    </div>
  );
}
