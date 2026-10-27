import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — SmartBus-AI" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["admin"]}><Outlet /></RoleGate>,
});
