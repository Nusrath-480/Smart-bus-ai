import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administration — SmartBus-AI" }, { name: "description", content: "SmartBus-AI transport-office administration." }, { property: "og:title", content: "Administration — SmartBus-AI" }, { property: "og:description", content: "SmartBus-AI transport-office administration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["admin"]}><Outlet /></RoleGate>,
});
