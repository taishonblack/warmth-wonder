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
        // Use OpenStreetMap Nominatim for free reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
          {
            headers: {
              "User-Agent": "Nearish App",
            },
          }
        );

        if (cancelled) return;

        const data = await response.json();
        
        if (data?.address) {
          const { neighbourhood, suburb, city, town, village, county, state } = data.address;
          
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
