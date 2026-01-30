import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type LocationStatus = "unknown" | "resolving" | "ready" | "denied";
export type LocationSource = "gps" | "zip";

interface LocationAnchor {
  lat: number;
  lng: number;
  source: "gps" | "zip";
  zipCode?: string;
}

interface LocationContextValue {
  status: LocationStatus;
  anchor: LocationAnchor | null;
  setAnchor: (lat: number, lng: number, source: "gps" | "zip", zipCode?: string) => void;
  requestGps: () => Promise<void>;
  clear: () => void;
}

const STORAGE_KEY = "nearish_location_anchor";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const LocationContext = createContext<LocationContextValue | null>(null);

function loadStoredAnchor(): LocationAnchor | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - (parsed.timestamp || 0) < MAX_AGE_MS) {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          source: parsed.source,
          zipCode: parsed.zipCode,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load stored location:", e);
  }
  return null;
}

function saveAnchor(anchor: LocationAnchor) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...anchor,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn("Failed to save location:", e);
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>(() => {
    const stored = loadStoredAnchor();
    return stored ? "ready" : "unknown";
  });
  
  const [anchor, setAnchorState] = useState<LocationAnchor | null>(loadStoredAnchor);

  const setAnchor = useCallback((lat: number, lng: number, source: "gps" | "zip", zipCode?: string) => {
    const newAnchor: LocationAnchor = { lat, lng, source, zipCode };
    setAnchorState(newAnchor);
    setStatus("ready");
    saveAnchor(newAnchor);
  }, []);

  const requestGps = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }

    setStatus("resolving");

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAnchor(position.coords.latitude, position.coords.longitude, "gps");
          resolve();
        },
        (error) => {
          console.error("Geolocation error:", error);
          setStatus("denied");
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  }, [setAnchor]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear location:", e);
    }
    setAnchorState(null);
    setStatus("unknown");
  }, []);

  // Check if browser already has permission (auto-resolve if so)
  useEffect(() => {
    if (status === "unknown" && "permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestGps();
        }
      }).catch(() => {
        // Permissions API not supported, no auto-request
      });
    }
  }, []);

  return (
    <LocationContext.Provider value={{ status, anchor, setAnchor, requestGps, clear }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
