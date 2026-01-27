import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Market {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  lat: number;
  lng: number;
  type: string;
  is_open: boolean;
  hours: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export function useMarkets(searchQuery?: string) {
  return useQuery({
    queryKey: ["markets", searchQuery],
    queryFn: async () => {
      let query = supabase.from("markets").select("*");

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.order("name");

      if (error) {
        console.error("Error fetching markets:", error);
        throw error;
      }

      return data as Market[];
    },
  });
}

export function useMarketById(id: string | null) {
  return useQuery({
    queryKey: ["market", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching market:", error);
        throw error;
      }

      return data as Market | null;
    },
    enabled: !!id,
  });
}

// Calculate distance between two coordinates in miles
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
