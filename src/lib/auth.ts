import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "driver" | "student";

export const sessionQuery = queryOptions({
  queryKey: ["auth", "user"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },
  staleTime: 60_000,
});

export const rolesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["auth", "roles", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppRole[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
    staleTime: 60_000,
  });

/** Highest-privilege role decides the home dashboard. */
export function primaryRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("driver")) return "driver";
  if (roles.includes("student")) return "student";
  return null;
}

export function homePathFor(role: AppRole | null): "/admin" | "/driver" | "/student" | "/profile" {
  if (role === "admin") return "/admin";
  if (role === "driver") return "/driver";
  if (role === "student") return "/student";
  return "/profile";
}

export function useAuth() {
  const user = useQuery(sessionQuery);
  const roles = useQuery(rolesQuery(user.data?.id));
  const list = roles.data ?? [];
  return {
    user: user.data ?? null,
    roles: list,
    role: primaryRole(list),
    loading: user.isLoading || (!!user.data && roles.isLoading),
  };
}
