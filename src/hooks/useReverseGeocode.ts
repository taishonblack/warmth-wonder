import { useState, useEffect } from "react";

interface LocationInfo {
  neighborhood?: string;
  city?: string;
  state?: string;
  displayName: string;
}

export function useReverseGeocode(
  latitude: number | null,
  longitude: number | null
): { location: LocationInfo | null; isLoading: boolean } {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) {
      setLocation(null);
      return;
    }

    let cancelled = false;

    const fetchLocation = async () => {
      setIsLoading(true);
      
      try {
        // Use edge function to proxy geocoding requests (avoids CORS)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode?type=reverse&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (cancelled) return;

        if (!response.ok) {
          throw new Error('Geocoding failed');
        }

        const result = await response.json();
        
        if (result?.address) {
          const { neighbourhood, suburb, city, town, village, county, state } = result.address;
          
          // Prioritize neighborhood > suburb > city/town
          const neighborhood = neighbourhood || suburb;
          const cityName = city || town || village || county;
          
          let displayName = "";
          if (neighborhood && cityName) {
            displayName = `${neighborhood}, ${cityName}`;
          } else if (cityName) {
            displayName = cityName;
          } else if (state) {
            displayName = state;
          } else {
            displayName = "Your area";
          }

          setLocation({
            neighborhood,
            city: cityName,
            state,
            displayName,
          });
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocation({ displayName: "Your area" });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchLocation();

    return () => {
      cancelled = true;
    };
  }, [latitude?.toFixed(2), longitude?.toFixed(2)]); // Only refetch if location changes significantly

  return { location, isLoading };
}
