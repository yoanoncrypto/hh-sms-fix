/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Google Maps JavaScript API types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: any,
              callback: (predictions: any[] | null, status: any) => void
            ) => void;
          };
          PlacesService: new (div: HTMLElement) => {
            getDetails: (
              request: any,
              callback: (place: any, status: any) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
          };
        };
      };
    };
  }
}

interface LocationMapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const defaultCenter = {
  lat: 42.6977, // Sofia, Bulgaria
  lng: 23.3219,
};

const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  onLocationSelect,
  initialLat,
  initialLng,
}) => {
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialLat || defaultCenter.lat,
    lng: initialLng || defaultCenter.lng,
  });
  const [searchValue, setSearchValue] = useState("");
  const [searchPredictions, setSearchPredictions] = useState<
    Array<{
      place_name: string;
      center?: [number, number];
      place_id?: string;
      category: string;
      icon: string;
    }>
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Set Mapbox access token
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY2hyaXNwYW0xMjMiLCJhIjoiY21kejlvcHgxMGI0NDJqc2V4NHA3cW04byJ9.P-2c1kfnyVGUrnFo116e6A";

  // Load Google Maps JavaScript API
  useEffect(() => {
    const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      console.warn("Google Maps API key not found");
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Maps JavaScript API loaded");
      setGoogleLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps JavaScript API");
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [markerPosition.lng, markerPosition.lat],
      zoom: 13,
    });

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl());

    // Create marker
    const markerInstance = new mapboxgl.Marker({
      color: "#FF0000",
      draggable: true,
    })
      .setLngLat([markerPosition.lng, markerPosition.lat])
      .addTo(mapInstance);

    // Handle marker drag
    const handleMarkerDrag = () => {
      const lngLat = markerInstance.getLngLat();
      const newPosition = { lat: lngLat.lat, lng: lngLat.lng };
      setMarkerPosition(newPosition);
      onLocationSelect(newPosition.lat, newPosition.lng);
    };

    markerInstance.on("dragend", handleMarkerDrag);

    // Handle map click
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      markerInstance.setLngLat([lng, lat]);
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition);
      onLocationSelect(lat, lng);
    };

    mapInstance.on("click", handleMapClick);

    setMap(mapInstance);
    setMarker(markerInstance);

    return () => {
      mapInstance.remove();
    };
  }, []); // Only run once when component mounts

  // Update marker position when props change
  useEffect(() => {
    if (marker && (initialLat !== undefined || initialLng !== undefined)) {
      const newLat = initialLat ?? markerPosition.lat;
      const newLng = initialLng ?? markerPosition.lng;
      marker.setLngLat([newLng, newLat]);
      setMarkerPosition({ lat: newLat, lng: newLng });
    }
  }, [initialLat, initialLng, marker]);

  const handleSearchPredictions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchPredictions([]);
        setShowDropdown(false);
        return;
      }

      try {
        // Use Google Places API if loaded, otherwise fallback to Mapbox
        if (googleLoaded && window.google?.maps?.places) {
          const service = new window.google.maps.places.AutocompleteService();
          const request = {
            input: query,
            componentRestrictions: { country: "bg" },
            types: ["establishment", "geocode"],
          };

          service.getPlacePredictions(request, (predictions, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              const mappedPredictions = predictions.map((prediction: any) => ({
                place_name: prediction.description,
                place_id: prediction.place_id,
                category: prediction.types?.[0] || "location",
                icon: "📍",
              }));
              setSearchPredictions(mappedPredictions);
              setShowDropdown(true);
            } else {
              setSearchPredictions([]);
              setShowDropdown(false);
            }
          });
        } else {
          // Fallback to Mapbox
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              query
            )}.json?access_token=${
              mapboxgl.accessToken
            }&country=BG&types=poi,address,place&limit=8&language=bg`
          );
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const predictions = data.features.map(
              (feature: {
                place_name: string;
                center: [number, number];
                properties: {
                  category?: string;
                  maki?: string;
                };
              }) => ({
                place_name: feature.place_name,
                center: feature.center,
                category: feature.properties?.category || "location",
                icon: "📍",
              })
            );
            setSearchPredictions(predictions);
            setShowDropdown(true);
          } else {
            setSearchPredictions([]);
            setShowDropdown(false);
          }
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchPredictions([]);
        setShowDropdown(false);
      }
    },
    [googleLoaded]
  );

  const getPlaceDetails = useCallback(async (placeId: string) => {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!window.google?.maps?.places) {
        resolve(null);
        return;
      }

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      const request = {
        placeId: placeId,
        fields: ["geometry"],
      };

      service.getDetails(request, (place: any, status: any) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          place?.geometry?.location
        ) {
          const { lat, lng } = place.geometry.location;
          resolve({ lat: lat(), lng: lng() });
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const handlePredictionSelect = useCallback(
    async (prediction: {
      place_name: string;
      center?: [number, number];
      place_id?: string;
      category: string;
      icon: string;
    }) => {
      let lat: number, lng: number;

      if (prediction.center) {
        // Direct coordinates available (Mapbox)
        [lng, lat] = prediction.center;
      } else if (prediction.place_id) {
        // Need to get coordinates from Google Places API
        const coords = await getPlaceDetails(prediction.place_id);
        if (!coords) return;
        lat = coords.lat;
        lng = coords.lng;
      } else {
        return;
      }

      if (marker) {
        marker.setLngLat([lng, lat]);
        setMarkerPosition({ lat, lng });
        onLocationSelect(lat, lng);
      }

      if (map) {
        map.flyTo({ center: [lng, lat], zoom: 15 });
      }

      setSearchValue(prediction.place_name);
      setShowDropdown(false);
      setSearchPredictions([]);
    },
    [marker, map, onLocationSelect, getPlaceDetails]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".search-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Search Input with Predictions */}
      <div className="relative search-container">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Location
        </label>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            handleSearchPredictions(e.target.value);
          }}
          onFocus={() => {
            if (searchPredictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search for a location..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ fontSize: "16px", minHeight: "44px" }}
        />

        {/* Predictions Dropdown */}
        {showDropdown && searchPredictions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchPredictions.map((prediction, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePredictionSelect(prediction);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center space-x-2">
                  <div className="text-lg">📍</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 font-medium">
                      {prediction.place_name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {prediction.category}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div ref={mapContainer} className="w-full h-80" />
      </div>

      {/* Coordinates Display */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <span className="font-medium">📍 Marker Position:</span>{" "}
          {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </div>
      </div>
    </div>
  );
};

export default LocationMapPicker;
