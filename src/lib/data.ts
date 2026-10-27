import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const routesQuery = queryOptions({
  queryKey: ["routes"],
  queryFn: async () => {
    const { data, error } = await supabase.from("routes").select("*, route_stops(count)").order("code");
    if (error) throw error;
    return data;
  },
});

export const busesQuery = queryOptions({
  queryKey: ["buses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("buses").select("*, routes(code, name)").order("bus_number");
    if (error) throw error;
    return data;
  },
});

export const stopsQuery = (routeId: string) =>
  queryOptions({
    queryKey: ["stops", routeId],
    queryFn: async () => {
      const { data, error } = await supabase.from("route_stops").select("*").eq("route_id", routeId).order("sequence");
      if (error) throw error;
      return data;
    },
  });

export const driversQuery = queryOptions({
  queryKey: ["drivers"],
  queryFn: async () => {
    const { data, error } = await supabase.from("drivers").select("*, profiles(full_name, email, phone)").order("created_at");
    if (error) throw error;
    return data;
  },
});
