import { createFileRoute, Navigate } from "@tanstack/react-router";
import { homePathFor, useAuth } from "@/lib/auth";
import { Loading } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SmartBus-AI" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const { role, loading } = useAuth();
    if (loading) return <Loading />;
    return <Navigate to={homePathFor(role)} replace />;
  },
});
