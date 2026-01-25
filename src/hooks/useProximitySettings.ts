import { useState, useEffect } from "react";

export type ProximityRadius = 10 | 20 | 30;

const STORAGE_KEY = "nearish_proximity_radius";

export function useProximitySettings() {
  const [radius, setRadius] = useState<ProximityRadius>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed === 10 || parsed === 20 || parsed === 30) {
        return parsed as ProximityRadius;
      }
    }
    return 20; // Default to 20 miles
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, radius.toString());
  }, [radius]);

  return { radius, setRadius };
}
