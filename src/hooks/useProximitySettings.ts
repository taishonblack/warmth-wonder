import { useState, useEffect } from "react";

export type ProximityRadius = 5 | 10 | 15 | 20;

export const RADIUS_OPTIONS: ProximityRadius[] = [5, 10, 15, 20];

const STORAGE_KEY = "nearish_proximity_radius";

export function useProximitySettings() {
  const [radius, setRadius] = useState<ProximityRadius>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed === 5 || parsed === 10 || parsed === 15 || parsed === 20) {
        return parsed as ProximityRadius;
      }
    }
    return 10; // Default to 10 miles
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, radius.toString());
  }, [radius]);

  return { radius, setRadius };
}
