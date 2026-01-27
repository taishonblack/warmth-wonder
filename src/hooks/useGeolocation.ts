import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  source: "gps" | "zip" | "manual" | null;
}

interface UseGeolocationReturn extends GeolocationState {
  refreshLocation: () => void;
  setManualLocation: (lat: number, lng: number, source?: "zip" | "manual") => void;
  clearManualLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    source: null,
  });

  const fetchGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
        source: "gps",
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = "Unable to get your location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Cache position for 5 minutes
    });
  }, []);

  useEffect(() => {
    fetchGpsLocation();
  }, [fetchGpsLocation]);

  const setManualLocation = useCallback(
    (lat: number, lng: number, source: "zip" | "manual" = "manual") => {
      setState({
        latitude: lat,
        longitude: lng,
        error: null,
        loading: false,
        source,
      });
    },
    []
  );

  const clearManualLocation = useCallback(() => {
    fetchGpsLocation();
  }, [fetchGpsLocation]);

  return {
    ...state,
    refreshLocation: fetchGpsLocation,
    setManualLocation,
    clearManualLocation,
  };
}
