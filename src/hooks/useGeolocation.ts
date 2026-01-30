import { useState, useEffect, useCallback } from "react";

const LOCATION_STORAGE_KEY = "nearish_last_location";

interface StoredLocation {
  latitude: number;
  longitude: number;
  source: "gps" | "zip" | "manual";
  zipCode?: string;
  timestamp: number;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  source: "gps" | "zip" | "manual" | null;
  zipCode?: string;
}

interface UseGeolocationReturn extends GeolocationState {
  refreshLocation: () => void;
  setManualLocation: (lat: number, lng: number, source?: "zip" | "manual", zipCode?: string) => void;
  clearManualLocation: () => void;
}

// Persist location to localStorage
function saveLocation(location: StoredLocation) {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (e) {
    console.warn("Failed to save location to localStorage:", e);
  }
}

// Load location from localStorage
function loadStoredLocation(): StoredLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredLocation;
      // Only use if less than 24 hours old
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp < maxAge) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load location from localStorage:", e);
  }
  return null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>(() => {
    // Try to restore from localStorage on init
    const stored = loadStoredLocation();
    if (stored) {
      return {
        latitude: stored.latitude,
        longitude: stored.longitude,
        error: null,
        loading: false,
        source: stored.source,
        zipCode: stored.zipCode,
      };
    }
    return {
      latitude: null,
      longitude: null,
      error: null,
      loading: true,
      source: null,
    };
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
      const newState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
        source: "gps" as const,
        zipCode: undefined,
      };
      setState(newState);
      saveLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: "gps",
        timestamp: Date.now(),
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
    // Only fetch GPS if we don't have a stored location
    const stored = loadStoredLocation();
    if (!stored) {
      fetchGpsLocation();
    }
  }, []);

  const setManualLocation = useCallback(
    (lat: number, lng: number, source: "zip" | "manual" = "manual", zipCode?: string) => {
      const newState = {
        latitude: lat,
        longitude: lng,
        error: null,
        loading: false,
        source,
        zipCode,
      };
      setState(newState);
      saveLocation({
        latitude: lat,
        longitude: lng,
        source,
        zipCode,
        timestamp: Date.now(),
      });
    },
    []
  );

  const clearManualLocation = useCallback(() => {
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear location from localStorage:", e);
    }
    fetchGpsLocation();
  }, [fetchGpsLocation]);

  return {
    ...state,
    refreshLocation: fetchGpsLocation,
    setManualLocation,
    clearManualLocation,
  };
}
