import { useEffect } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const notificationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

/** Unread count + live toast when a new notification arrives. */
export function useNotificationFeed(userId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery(notificationsQuery(userId));
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as { title: string; body: string | null };
        toast(n.title, n.body ? { description: n.body } : undefined);
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);
  return (q.data ?? []).filter((n) => !n.read_at).length;
}
