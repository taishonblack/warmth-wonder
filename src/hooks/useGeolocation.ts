import { useState, useEffect, useCallback } from "react";

const LOCATION_STORAGE_KEY = "nearish_user_location";

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
  hasPromptedForGps: boolean;
}

interface UseGeolocationReturn extends Omit<GeolocationState, 'hasPromptedForGps'> {
  refreshLocation: () => void;
  setManualLocation: (lat: number, lng: number, source?: "zip" | "manual" | "gps", zipCode?: string) => void;
  clearManualLocation: () => void;
  promptForGps: () => void;
}

// Persist location to localStorage (no TTL - persists until cleared)
function saveLocation(location: StoredLocation) {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (e) {
    console.warn("Failed to save location to localStorage:", e);
  }
}

// Load location from localStorage (no TTL expiry)
function loadStoredLocation(): StoredLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredLocation;
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to load location from localStorage:", e);
  }
  return null;
}

// Default location: 07016 (Cranford, NJ)
const DEFAULT_ZIP = "07016";
const DEFAULT_LAT = 40.6584;
const DEFAULT_LNG = -74.2995;

const GPS_PROMPTED_KEY = "nearish_gps_prompted";

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>(() => {
    // Check if user has a stored location preference
    const stored = loadStoredLocation();
    if (stored) {
      return {
        latitude: stored.latitude,
        longitude: stored.longitude,
        error: null,
        loading: false,
        source: stored.source,
        zipCode: stored.zipCode,
        hasPromptedForGps: true,
      };
    }
    
    // Default to 07016 zip code, but mark that we haven't prompted for GPS yet
    const hasPrompted = localStorage.getItem(GPS_PROMPTED_KEY) === "true";
    return {
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      error: null,
      loading: !hasPrompted, // Show loading if we're about to prompt
      source: "zip",
      zipCode: DEFAULT_ZIP,
      hasPromptedForGps: hasPrompted,
    };
  });

  const fetchGpsLocation = useCallback((isAutoPrompt: boolean = false, retryWithLowAccuracy: boolean = false) => {
    console.log("[Geolocation] Starting location fetch, isAutoPrompt:", isAutoPrompt, "retryWithLowAccuracy:", retryWithLowAccuracy);
    
    if (!navigator.geolocation) {
      console.error("[Geolocation] Geolocation not supported");
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
        hasPromptedForGps: true,
      }));
      localStorage.setItem(GPS_PROMPTED_KEY, "true");
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const successHandler = (position: GeolocationPosition) => {
      console.log("[Geolocation] Success! Coords:", position.coords.latitude, position.coords.longitude);
      const newState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
        source: "gps" as const,
        zipCode: undefined,
        hasPromptedForGps: true,
      };
      setState(newState);
      saveLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: "gps",
        timestamp: Date.now(),
      });
      localStorage.setItem(GPS_PROMPTED_KEY, "true");
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.error("[Geolocation] Error:", error.code, error.message);
      
      // If high accuracy failed, retry with low accuracy (better for mobile)
      if (!retryWithLowAccuracy && error.code === error.TIMEOUT) {
        console.log("[Geolocation] Retrying with low accuracy...");
        fetchGpsLocation(isAutoPrompt, true);
        return;
      }
      
      let errorMessage: string | null = null;
      
      // Only show error if this was a manual request, not auto-prompt
      if (!isAutoPrompt) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
      }
      
      // On failure, keep the default 07016 location
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
        hasPromptedForGps: true,
      }));
      localStorage.setItem(GPS_PROMPTED_KEY, "true");
    };

    // Use longer timeout for mobile devices, lower accuracy on retry for better mobile support
    const options: PositionOptions = {
      enableHighAccuracy: !retryWithLowAccuracy,
      timeout: retryWithLowAccuracy ? 30000 : 15000, // Longer timeout for mobile
      maximumAge: 60000, // Accept cached position up to 1 minute old
    };
    
    console.log("[Geolocation] Requesting position with options:", options);
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
  }, []);

  // Auto-prompt for GPS on first visit (if no stored location)
  useEffect(() => {
    if (!state.hasPromptedForGps) {
      fetchGpsLocation(true);
    }
  }, [state.hasPromptedForGps, fetchGpsLocation]);

  const setManualLocation = useCallback(
    (lat: number, lng: number, source: "zip" | "manual" | "gps" = "manual", zipCode?: string) => {
      const newState = {
        latitude: lat,
        longitude: lng,
        error: null,
        loading: false,
        source,
        zipCode,
        hasPromptedForGps: true,
      };
      setState(newState);
      saveLocation({
        latitude: lat,
        longitude: lng,
        source: source === "gps" ? "gps" : source,
        zipCode,
        timestamp: Date.now(),
      });
    },
    []
  );

  const clearManualLocation = useCallback(() => {
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      localStorage.removeItem(GPS_PROMPTED_KEY);
    } catch (e) {
      console.warn("Failed to clear location from localStorage:", e);
    }
    // Reset to default and prompt for GPS again
    setState({
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      error: null,
      loading: true,
      source: "zip",
      zipCode: DEFAULT_ZIP,
      hasPromptedForGps: false,
    });
  }, []);

  const promptForGps = useCallback(() => {
    fetchGpsLocation(false);
  }, [fetchGpsLocation]);

  return {
    latitude: state.latitude,
    longitude: state.longitude,
    error: state.error,
    loading: state.loading,
    source: state.source,
    zipCode: state.zipCode,
    refreshLocation: () => fetchGpsLocation(false),
    setManualLocation,
    clearManualLocation,
    promptForGps,
  };
}
