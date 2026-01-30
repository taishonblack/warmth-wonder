import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Default fallback image
import market1 from "@/assets/market-1.jpg";

interface UseMarketPhotoResult {
  photoUrl: string;
  isLoading: boolean;
}

// Build Google Places photo URL from photo_reference
// Always use edge function proxy since the API key is server-side only
function buildGooglePhotoUrl(photoReference: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-photo-proxy?ref=${encodeURIComponent(photoReference)}`;
}

export function useMarketPhoto(
  marketId: string | undefined,
  name: string | undefined,
  address?: string,
  lat?: number,
  lng?: number,
  existingPhotoUrl?: string | null,
  photoReference?: string | null
): UseMarketPhotoResult {
  const [photoUrl, setPhotoUrl] = useState<string>(existingPhotoUrl || market1);
  const [isLoading, setIsLoading] = useState(!existingPhotoUrl && !photoReference);

  useEffect(() => {
    // If we already have a photo URL from the database, use it
    if (existingPhotoUrl) {
      setPhotoUrl(existingPhotoUrl);
      setIsLoading(false);
      return;
    }

    // If we have a photo_reference (from Google), build the URL directly
    if (photoReference) {
      setPhotoUrl(buildGooglePhotoUrl(photoReference));
      setIsLoading(false);
      return;
    }

    // Don't fetch if we don't have required data
    if (!marketId || !name) {
      setIsLoading(false);
      return;
    }

    // Only fetch for database markets (OSM markets don't have stable IDs)
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(marketId);
    if (!isValidUuid) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPhoto = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("market-photo", {
          body: { marketId, name, address, lat, lng },
        });

        if (cancelled) return;

        if (error) {
          console.error("Error fetching market photo:", error);
          setIsLoading(false);
          return;
        }

        if (data?.photoUrl) {
          setPhotoUrl(data.photoUrl);
        }
      } catch (err) {
        console.error("Error fetching market photo:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPhoto();

    return () => {
      cancelled = true;
    };
  }, [marketId, name, address, lat, lng, existingPhotoUrl, photoReference]);

  return { photoUrl, isLoading };
}

// Hook to fetch photos for multiple markets at once
export function useMarketPhotos(
  markets: Array<{
    id: string;
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
    photo_url?: string | null;
    photo_reference?: string | null;
  }>
): Map<string, string> {
  const [photoMap, setPhotoMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!markets.length) return;

    const fetchPhotos = async () => {
      const newMap = new Map<string, string>();
      
      // Process markets that need photos
      const marketsNeedingPhotos = markets.filter((m) => {
        // Use cached photo if available
        if (m.photo_url) {
          newMap.set(m.id, m.photo_url);
          return false;
        }
        // Use photo_reference if available (Google markets)
        if (m.photo_reference) {
          newMap.set(m.id, buildGooglePhotoUrl(m.photo_reference));
          return false;
        }
        // Only fetch for valid UUIDs (database markets)
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id);
      });

      // Fetch photos in parallel (limit to 5 concurrent requests)
      const batchSize = 5;
      for (let i = 0; i < marketsNeedingPhotos.length; i += batchSize) {
        const batch = marketsNeedingPhotos.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (market) => {
            try {
              const { data } = await supabase.functions.invoke("market-photo", {
                body: {
                  marketId: market.id,
                  name: market.name,
                  address: market.address,
                  lat: market.lat,
                  lng: market.lng,
                },
              });

              if (data?.photoUrl) {
                newMap.set(market.id, data.photoUrl);
              }
            } catch (err) {
              console.error(`Error fetching photo for ${market.name}:`, err);
            }
          })
        );
      }

      setPhotoMap(new Map([...photoMap, ...newMap]));
    };

    fetchPhotos();
  }, [markets.map((m) => m.id).join(",")]);

  return photoMap;
}
