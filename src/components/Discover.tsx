import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import Background from "./Background";
import BackgroundBlobs from "./BackgroundBlobs";
import EventCarousel, { Event } from "./EventCarousel";
import Logo from "./Logo";
import Navbar from "./Navbar";

// Set Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiY2hyaXNwYW0xMjMiLCJhIjoiY21kejlvcHgxMGI0NDJqc2V4NHA3cW04byJ9.P-2c1kfnyVGUrnFo116e6A";

// Campaign interface to match Supabase structure
interface Campaign {
  id: string;
  short_id: string;
  name: string;
  description: string;
  image_url?: string | null;
  date?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rsvp_enabled: boolean;
  type: "event" | "promotion";
  created_at: string;
}

// Default fallback location (Sofia, Bulgaria)
const DEFAULT_LOCATION = { lat: 42.6977, lng: 23.3219 };

// Helper function to calculate offset center for mobile/tablet
const getOffsetCenter = (
  lat: number,
  lng: number,
  isMobile: boolean,
  isTablet: boolean
) => {
  if (isMobile) {
    // Move camera down by offsetting latitude (moving south)
    // Each degree of latitude is approximately 111km, so 0.003 degrees ≈ 330m
    return { lat: lat - 0.006, lng };
  } else if (isTablet) {
    // Smaller offset for tablets
    return { lat: lat - 0.002, lng };
  }
  // No offset for desktop
  return { lat, lng };
};

// Skeleton Loader Component
const SkeletonLoader: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent pb-8">
      <div className="w-full px-4 relative">
        <div className="flex justify-center">
          <div className="w-64 sm:w-72 md:w-80 lg:w-96 xl:w-[480px] 2xl:w-[520px]">
            <div className="backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
              <div className="flex flex-col sm:flex-row h-auto sm:h-44 md:h-48 lg:h-56">
                {/* Image Skeleton */}
                <div className="relative w-full sm:w-1/2 bg-gray-800">
                  <div className="w-full h-28 sm:h-full bg-gray-700 animate-pulse"></div>
                  {/* Tag Skeleton */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-3 sm:w-10 sm:h-4 md:w-12 md:h-5 bg-gray-600 rounded-full animate-pulse"></div>
                </div>

                {/* Content Skeleton */}
                <div className="w-full sm:w-1/2 p-2.5 sm:p-3 md:p-4 flex flex-col justify-between">
                  <div>
                    {/* Title Skeleton */}
                    <div className="h-3.5 sm:h-4 md:h-5 bg-gray-700 rounded mb-1.5 sm:mb-2 animate-pulse"></div>

                    {/* Date and Location Skeleton */}
                    <div className="space-y-1 sm:space-y-1.5 md:space-y-2 mb-1.5 sm:mb-2 md:mb-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-gray-600 rounded animate-pulse"></div>
                        <div className="h-2 sm:h-2.5 md:h-3 bg-gray-700 rounded flex-1 animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-gray-600 rounded animate-pulse"></div>
                        <div className="h-2 sm:h-2.5 md:h-3 bg-gray-700 rounded flex-1 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Description Skeleton - Hidden on mobile */}
                    <div className="hidden xl:block space-y-1">
                      <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Button Skeleton */}
                  <div className="h-5 sm:h-6 md:h-7 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="absolute top-1/2 -translate-y-1/2 left-1 sm:left-2 z-10 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-gray-700 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -translate-y-1/2 right-1 sm:right-2 z-10 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

// Function to map Campaign to Event interface
const mapCampaignToEvent =
  (t: (key: string) => string) =>
  (campaign: Campaign): Event => {
    // Use campaign coordinates or fall back to default Sofia location
    const lat = campaign.latitude ?? DEFAULT_LOCATION.lat;
    const lng = campaign.longitude ?? DEFAULT_LOCATION.lng;

    // Format date for display
    const formatDate = (dateString?: string | null): string => {
      if (!dateString) return t("date_tba");

      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
      } catch {
        return t("date_tba");
      }
    };

    // Determine tag based on campaign type and dates
    const getEventTag = (campaign: Campaign): string => {
      if (campaign.type === "promotion") return t("tag_promo");

      if (campaign.date) {
        const eventDate = new Date(campaign.date);
        const now = new Date();
        const diffTime = eventDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return t("tag_past");
        if (diffDays <= 7) return t("tag_this_week");
        if (diffDays <= 30) return t("tag_coming_soon");
        return t("tag_upcoming");
      }

      return t("tag_new");
    };

    // Default image if none provided
    const defaultImage =
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop";

    return {
      id: campaign.id,
      short_id: campaign.short_id, // Include short_id for navigation
      title: campaign.name,
      date: formatDate(campaign.date),
      location: campaign.location || t("location_tba"),
      description: campaign.description,
      price: campaign.rsvp_enabled ? t("rsvp_required") : t("free_event"),
      image: campaign.image_url || defaultImage,
      lat,
      lng,
      tag: getEventTag(campaign)
    };
  };

const Discover: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Fetch campaigns from Supabase
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: campaigns, error: fetchError } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching campaigns:", fetchError);
        setError(t("failed_to_load_events"));
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        setError(t("no_events_available"));
        return;
      }

      // Map campaigns to events and filter out past events and promotions
      const mappedEvents = campaigns
        .filter((campaign) => {
          // Only include events (not promotions)
          if (campaign.type !== "event") return false;

          // Filter out past events
          if (campaign.date) {
            const eventDate = new Date(campaign.date);
            const now = new Date();
            return eventDate >= now;
          }

          // Include events without dates
          return true;
        })
        .map(mapCampaignToEvent(t));

      setEvents(mappedEvents);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(t("unexpected_error_occurred"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Handle map pin click - only scroll carousel, don't move map
  const handleMapPinClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    // Don't animate map here, just update carousel
  }, []);

  // Handle carousel event change - animate map to location
  const handleEventChange = useCallback((event: Event) => {
    setSelectedEvent(event);

    // Use Mapbox's native flyTo for smooth animation with responsive zoom
    if (mapRef.current) {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      // Calculate offset center for mobile/tablet
      const offsetCenter = getOffsetCenter(
        event.lat,
        event.lng,
        isMobile,
        isTablet
      );

      mapRef.current.flyTo({
        center: [offsetCenter.lng, offsetCenter.lat],
        zoom: isMobile ? 14 : isTablet ? 15 : 16, // Responsive zoom level
        duration: 1500, // 1.5 seconds
        essential: true // Animation cannot be interrupted
      });
    }
  }, []);

  // Fetch campaigns when component mounts
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Detect mobile device for responsive settings
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11", // Dark theme
      center: [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat],
      zoom: isMobile ? 11 : isTablet ? 12 : 13, // More zoomed out on mobile
      attributionControl: false,
      logoPosition: "bottom-right"
    });

    // Wait for map to load before adding markers
    map.on("load", () => {
      // Create custom marker images using your original SVG
      const createSVGMarker = (color: string, isSelected: boolean) => {
        // Adjust marker size based on device - making them bigger
        const markerSize = isMobile ? 32 : isTablet ? 36 : 40;
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="${color}" width="${markerSize}px" height="${markerSize}px" viewBox="0 0 32 32" version="1.1" style="filter: ${
          isSelected
            ? "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))"
            : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
        };">
            <path d="M16.114-0.011c-6.559 0-12.114 5.587-12.114 12.204 0 6.93 6.439 14.017 10.77 18.998 0.017 0.020 0.717 0.797 1.579 0.797h0.076c0.863 0 1.558-0.777 1.575-0.797 4.064-4.672 10-12.377 10-18.998 0-6.618-4.333-12.204-11.886-12.204zM16.515 29.849c-0.035 0.035-0.086 0.074-0.131 0.107-0.046-0.032-0.096-0.072-0.133-0.107l-0.523-0.602c-4.106-4.71-9.729-11.161-9.729-17.055 0-5.532 4.632-10.205 10.114-10.205 6.829 0 9.886 5.125 9.886 10.205 0 4.474-3.192 10.416-9.485 17.657zM16.035 6.044c-3.313 0-6 2.686-6 6s2.687 6 6 6 6-2.687 6-6-2.686-6-6-6zM16.035 16.044c-2.206 0-4.046-1.838-4.046-4.044s1.794-4 4-4c2.207 0 4 1.794 4 4 0.001 2.206-1.747 4.044-3.954 4.044z"/>
          </svg>
        `;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const img = new Image();

        return new Promise<ImageData>((resolve) => {
          img.onload = () => {
            canvas.width = markerSize;
            canvas.height = markerSize;
            ctx.drawImage(img, 0, 0, markerSize, markerSize);
            resolve(ctx.getImageData(0, 0, markerSize, markerSize));
          };

          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          img.src = url;
        });
      };

      // Create both marker variations
      Promise.all([
        createSVGMarker("#EF4444", false), // Unselected - red
        createSVGMarker("#3B82F6", true) // Selected - blue
      ]).then(([unselectedImageData, selectedImageData]) => {
        map.addImage("custom-marker", unselectedImageData);
        map.addImage("custom-marker-selected", selectedImageData);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []); // Only run once when component mounts

  // Update map data when events or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !events.length) return;

    // Wait for map to be loaded
    const updateMapData = () => {
      // Detect device type for responsive settings
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      // Create GeoJSON data for markers
      const geojsonData = {
        type: "FeatureCollection" as const,
        features: events.map((event) => ({
          type: "Feature" as const,
          properties: {
            id: event.id,
            title: event.title,
            selected: selectedEvent?.id === event.id
          },
          geometry: {
            type: "Point" as const,
            coordinates: [event.lng, event.lat]
          }
        }))
      };

      // Check if source exists
      const source = map.getSource("events") as mapboxgl.GeoJSONSource;

      if (source) {
        // Update existing source
        source.setData(geojsonData);
      } else {
        // Create source and layers with clustering enabled
        map.addSource("events", {
          type: "geojson",
          data: geojsonData,
          cluster: true,
          clusterMaxZoom: isMobile ? 12 : isTablet ? 13 : 14, // Adjust clustering based on device
          clusterRadius: isMobile ? 60 : 50 // Larger cluster radius on mobile for better visibility
        });

        // Add cluster circles
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "events",
          filter: ["has", "point_count"],
          paint: {
            // Use step expressions with three steps to implement three types of circles:
            // * Blue, 20px circles when point count is less than 10
            // * Orange, 30px circles when point count is between 10 and 30
            // * Red, 40px circles when point count is greater than or equal to 30
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#667eea", // Blue for small clusters
              10,
              "#f59e0b", // Orange for medium clusters
              30,
              "#ef4444" // Red for large clusters
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              isMobile ? 24 : 20, // Larger on mobile
              10,
              isMobile ? 36 : 30, // Larger on mobile
              30,
              isMobile ? 48 : 40 // Larger on mobile
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
          }
        });

        // Add cluster count labels
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "events",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": isMobile ? 16 : 14, // Larger text on mobile
            "text-allow-overlap": true
          },
          paint: {
            "text-color": "#ffffff"
          }
        });

        // Add layer for unselected individual markers (when not clustered)
        map.addLayer({
          id: "event-markers",
          type: "symbol",
          source: "events",
          filter: [
            "all",
            ["!", ["has", "point_count"]],
            ["!=", ["get", "selected"], true]
          ],
          layout: {
            "icon-image": "custom-marker",
            "icon-size": isMobile ? 1.2 : isTablet ? 1.1 : 1.0, // Bigger marker size
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
          }
        });

        // Add layer for selected individual markers (when not clustered)
        map.addLayer({
          id: "event-markers-selected",
          type: "symbol",
          source: "events",
          filter: [
            "all",
            ["!", ["has", "point_count"]],
            ["==", ["get", "selected"], true]
          ],
          layout: {
            "icon-image": "custom-marker-selected",
            "icon-size": isMobile ? 1.4 : isTablet ? 1.3 : 1.2, // Bigger selected marker size
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
          }
        });

        // Add click event to clusters - zoom into cluster
        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"]
          });

          if (features && features[0]) {
            const clusterId = features[0].properties?.cluster_id;
            const source = map.getSource("events") as mapboxgl.GeoJSONSource;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const feature = features[0] as any;

            if (
              source.getClusterExpansionZoom &&
              feature.geometry?.coordinates
            ) {
              source.getClusterExpansionZoom(
                clusterId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (err: any, zoom: any) => {
                  if (err) return;

                  map.easeTo({
                    center: feature.geometry.coordinates,
                    zoom: Math.min(zoom || 15, isMobile ? 14 : 15), // Limit zoom on mobile
                    duration: 1000
                  });
                }
              );
            }
          }
        });

        // Add click event to individual markers
        map.on("click", "event-markers", (e) => {
          if (e.features && e.features[0]) {
            const eventId = e.features[0].properties?.id;
            const event = events.find((ev) => ev.id === eventId);
            if (event) {
              handleMapPinClick(event);
            }
          }
        });

        map.on("click", "event-markers-selected", (e) => {
          if (e.features && e.features[0]) {
            const eventId = e.features[0].properties?.id;
            const event = events.find((ev) => ev.id === eventId);
            if (event) {
              handleMapPinClick(event);
            }
          }
        });

        // Change cursor on hover for clusters
        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });

        // Change cursor on hover for individual markers
        map.on("mouseenter", "event-markers", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "event-markers", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "event-markers-selected", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "event-markers-selected", () => {
          map.getCanvas().style.cursor = "";
        });

        // After setting up markers, select first event and animate to it
        if (events.length > 0 && !selectedEvent) {
          const firstEvent = events[0];
          setSelectedEvent(firstEvent);

          // Smoothly animate to the first event location with responsive zoom
          setTimeout(() => {
            // Calculate offset center for mobile/tablet
            const offsetCenter = getOffsetCenter(
              firstEvent.lat,
              firstEvent.lng,
              isMobile,
              isTablet
            );

            map.flyTo({
              center: [offsetCenter.lng, offsetCenter.lat],
              zoom: isMobile ? 14 : isTablet ? 15 : 16, // Responsive zoom level
              duration: 2000, // 2 seconds for initial animation
              essential: true
            });
          }, 500); // Small delay to ensure everything is ready
        }
      }
    };

    if (map.loaded()) {
      updateMapData();
    } else {
      map.on("load", updateMapData);
    }
  }, [events, selectedEvent, handleMapPinClick]);

  return (
    <>
      {/* Skeleton loader animation */}
      <style>
        {`
          /* Ensure Mapbox canvas is dark before the style loads to avoid white flash */
          .mapboxgl-canvas {
            background-color: #0b0b0b !important;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
      <div
        style={{
          minHeight: "100vh",
          height: "100vh",
          backgroundColor: "#0a0a0a",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          overflow: "hidden",
          position: "relative"
        }}
      >
        <Background />
        <BackgroundBlobs />
        <Logo showAdminButton={false} />
        <Navbar />

        {/* Main Content Area */}
        <div
          style={{
            height: "100%",
            width: "100%",
            position: "relative",
            zIndex: 1
          }}
        >
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1
            }}
          />
        </div>

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              background: "rgba(255, 255, 255, 0.95)",
              padding: "2rem",
              borderRadius: "1rem",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              maxWidth: "400px"
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
            <div
              style={{
                color: "#e53e3e",
                fontWeight: "600",
                marginBottom: "0.5rem"
              }}
            >
              {t("oops_something_went_wrong")}
            </div>
            <div
              style={{
                color: "#666",
                marginBottom: "1.5rem",
                fontSize: "0.9rem"
              }}
            >
              {error}
            </div>
            <button
              onClick={fetchCampaigns}
              style={{
                background: "#667eea",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem"
              }}
            >
              {t("try_again")}
            </button>
          </div>
        )}

        {/* Skeleton Loader - show when loading */}
        {loading && <SkeletonLoader />}

        {/* Event Carousel - only show when events are loaded and not loading */}
        {!loading && !error && events.length > 0 && (
          <EventCarousel
            events={events}
            onEventChange={handleEventChange}
            selectedEventId={selectedEvent?.id}
          />
        )}
      </div>
    </>
  );
};

export default Discover;
