import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Market } from "@/hooks/useMarkets";
import { MapBounds } from "@/hooks/useMapViewportMarkets";
import { Locate, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapViewProps {
  markets: Market[];
  selectedMarket: string | null;
  onMarketSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  showDirections?: boolean;
  onBoundsChange?: (bounds: MapBounds) => void;
  isSearching?: boolean;
}

const pinColors: Record<string, string> = {
  farmers: "#7C9A5E",
  flea: "#D4A574",
  artisan: "#C4A77D",
  specialty: "#B8860B",
};

export function MapView({ 
  markets, 
  selectedMarket, 
  onMarketSelect, 
  userLocation,
  showDirections = false,
  onBoundsChange,
  isSearching = false,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Extract bounds from map
  const getBounds = useCallback((): MapBounds | null => {
    if (!map.current) return null;
    const bounds = map.current.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = "pk.eyJ1IjoidGFpc2hvbmIiLCJhIjoiY21rdnRkMTFiMDk1ZTNjcHc0YzRoc3I2aiJ9.9D_Nrd1vBV64gLPWKg_Q8g";
    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-73.9857, 40.7484],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
      
      // Add directions source and layer
      if (map.current) {
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#7C9A5E",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });

        // Emit initial bounds
        const bounds = getBounds();
        if (bounds && onBoundsChange) {
          onBoundsChange(bounds);
        }
      }
    });

    // Listen for map movement (pan/zoom)
    map.current.on("moveend", () => {
      const bounds = getBounds();
      if (bounds && onBoundsChange) {
        console.log("[MapView] moveend - emitting new bounds");
        onBoundsChange(bounds);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fetch and display directions
  const fetchDirections = useCallback(async (
    start: [number, number],
    end: [number, number]
  ) => {
    if (!map.current || !mapLoaded) return;

    const token = "pk.eyJ1IjoidGFpc2hvbmIiLCJhIjoiY21rdnRkMTFiMDk1ZTNjcHc0YzRoc3I2aiJ9.9D_Nrd1vBV64gLPWKg_Q8g";
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${token}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;
        const source = map.current.getSource("route") as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: route,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  }, [mapLoaded]);

  // Clear directions
  const clearDirections = useCallback(() => {
    if (!map.current || !mapLoaded) return;
    
    const source = map.current.getSource("route") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      });
    }
  }, [mapLoaded]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.innerHTML = `
        <div class="w-4 h-4 bg-accent rounded-full shadow-lg relative">
          <span class="absolute inset-0 rounded-full bg-accent animate-ping opacity-50"></span>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
      });
    }
  }, [userLocation, mapLoaded]);

  // Update market markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    markets.forEach((market) => {
      const el = document.createElement("div");
      el.className = "market-marker cursor-pointer";
      const color = pinColors[market.type] || pinColors.farmers;
      const isSelected = selectedMarket === market.id;
      
      el.innerHTML = `
        <div class="relative transition-transform ${isSelected ? "scale-125" : "hover:scale-110"}">
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isSelected ? "ring-2 ring-white" : ""}"
            style="background-color: ${color};"
          >
            <span class="text-sm">🏪</span>
          </div>
        </div>
      `;

      el.addEventListener("click", () => {
        onMarketSelect(market.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([market.lng, market.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div class="p-2">
              <h3 class="font-medium text-sm">${market.name}</h3>
              <p class="text-xs text-gray-500">${market.address}</p>
              ${market.hours ? `<p class="text-xs text-gray-400 mt-1">${market.hours}</p>` : ""}
              <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                market.is_open ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }">
                ${market.is_open ? "Open" : "Closed"}
              </span>
            </div>
          `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [markets, selectedMarket, mapLoaded, onMarketSelect]);

  // Fly to selected market and show directions
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedMarket) {
      clearDirections();
      return;
    }

    const market = markets.find((m) => m.id === selectedMarket);
    if (market) {
      map.current.flyTo({
        center: [market.lng, market.lat],
        zoom: 14,
        duration: 1000,
      });

      if (showDirections && userLocation) {
        fetchDirections(
          [userLocation.lng, userLocation.lat],
          [market.lng, market.lat]
        );
      }
    }
  }, [selectedMarket, markets, mapLoaded, userLocation, showDirections, fetchDirections, clearDirections]);

  const handleLocateMe = useCallback(() => {
    if (!map.current || !userLocation) return;
    
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 1000,
    });
  }, [userLocation]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Searching indicator */}
      {isSearching && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Searching this area...</span>
        </div>
      )}
      
      {/* Locate Me Button */}
      {userLocation && (
        <Button
          onClick={handleLocateMe}
          size="icon"
          variant="secondary"
          className="absolute bottom-24 right-4 z-10 shadow-lg md:bottom-4"
          aria-label="Center map on my location"
        >
          <Locate className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
