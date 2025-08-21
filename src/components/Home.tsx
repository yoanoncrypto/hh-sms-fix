import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, MapPin, Star } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { supabase } from "../lib/supabase";
import Background from "./Background";
import BackgroundBlobs from "./BackgroundBlobs";
import Logo from "./Logo";
import Navbar from "./Navbar";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

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

interface EventItem {
  id: string;
  short_id: string; // Add short_id for navigation
  title: string;
  date: string;
  location?: string;
  description?: string;
  image: string;
  tag?: string;
  price?: string;
  attendees?: number;
  rating?: number;
  isPast?: boolean;
}

// Function to map Campaign to EventItem interface
const mapCampaignToEventItem =
  (t: (key: string) => string) =>
  (campaign: Campaign): EventItem => {
    // Format date for display
    const formatDate = (dateString?: string | null): string => {
      if (!dateString) return t("date_tba");

      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
      } catch {
        return t("date_tba");
      }
    };

    // Check if event is past
    const isPastEvent = (dateString?: string | null): boolean => {
      if (!dateString) return false;
      try {
        const eventDate = new Date(dateString);
        const now = new Date();
        return eventDate < now;
      } catch {
        return false;
      }
    };

    // Determine tag based on campaign type and dates
    const getEventTag = (campaign: Campaign): string => {
      if (campaign.type === "promotion") {
        // For promotions, check if recently created
        const createdDate = new Date(campaign.created_at);
        const now = new Date();
        const diffDays = Math.ceil(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays <= 7) return t("tag_new");
        if (campaign.rsvp_enabled) return t("tag_limited");
        return t("tag_promo");
      }

      // For events, check timing
      if (campaign.date) {
        const eventDate = new Date(campaign.date);
        const now = new Date();
        const diffTime = eventDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return t("tag_past");
        if (diffDays <= 7) return t("tag_this_week");
        if (diffDays <= 30) return t("tag_popular");
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
      date:
        campaign.type === "promotion"
          ? t("special_offer")
          : formatDate(campaign.date),
      location: campaign.location || undefined,
      image: campaign.image_url || defaultImage,
      tag: getEventTag(campaign),
      description: campaign.description || undefined,
      price: undefined,
      attendees: undefined,
      rating: undefined,
      isPast: campaign.type === "event" ? isPastEvent(campaign.date) : false
    };
  };

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Framer Motion scroll utilities
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 80],
    ["rgba(0, 0, 0, 0)", "rgba(17, 24, 39, 0.18)"]
  );
  const backdropFilter = useTransform(
    scrollY,
    [0, 80],
    ["blur(0px)", "blur(6px)"]
  );
  const borderBottom = useTransform(
    scrollY,
    [0, 80],
    ["1px solid transparent", "1px solid transparent"]
  );
  const headerHeight = useTransform(scrollY, [0, 120], [120, 64]);
  const logoWidth = useTransform(scrollY, [0, 120], [200, 120]);
  const shadowOpacity = useTransform(scrollY, [0, 120], [0, 0.2]);
  const boxShadow = useTransform(
    shadowOpacity,
    (o: number) => `0 8px 24px rgba(0,0,0,${o})`
  );

  // State for campaigns
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [activePromotions, setActivePromotions] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError("Failed to load campaigns. Please try again later.");
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        // If no campaigns, show empty arrays but don't treat as error
        setUpcomingEvents([]);
        setActivePromotions([]);
        return;
      }

      // Split campaigns by type and map to EventItem
      const events = campaigns
        .filter((campaign) => campaign.type === "event")
        .map(mapCampaignToEventItem(t))
        .sort((a, b) => {
          // If both have dates, sort by date
          if (
            a.date &&
            b.date &&
            a.date !== t("date_tba") &&
            b.date !== t("date_tba")
          ) {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const now = new Date();

            // Check if both are past events
            const isPastA = dateA < now;
            const isPastB = dateB < now;

            // If one is past and one is future, future comes first
            if (isPastA && !isPastB) return 1;
            if (!isPastA && isPastB) return -1;

            // If both are past, sort by date (most recent past first)
            if (isPastA && isPastB) {
              return dateB.getTime() - dateA.getTime();
            }

            // If both are future, sort by date (earliest first)
            return dateA.getTime() - dateB.getTime();
          }

          // If one has a date and the other doesn't, the one with date comes first
          if (
            a.date &&
            a.date !== t("date_tba") &&
            (!b.date || b.date === t("date_tba"))
          )
            return -1;
          if (
            b.date &&
            b.date !== t("date_tba") &&
            (!a.date || a.date === t("date_tba"))
          )
            return 1;

          // If neither has a date, keep original order
          return 0;
        });

      const promotions = campaigns
        .filter((campaign) => campaign.type === "promotion")
        .map(mapCampaignToEventItem(t));

      setUpcomingEvents(events);
      setActivePromotions(promotions);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(t("oops_something_went_wrong"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch campaigns when component mounts
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const EventCard: React.FC<{
    event: EventItem;
    showRating?: boolean;
    variant?: "centered" | "landing" | "peek";
  }> = ({ event, showRating = false, variant = "centered" }) => {
    const handleCardClick = () => {
      // Don't navigate if event is past
      if (event.isPast) return;
      // Navigate to campaign view using the campaign short_id
      navigate(`/c/${event.short_id}`);
    };
    const getCardClasses = () => {
      const baseClasses =
        "backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 h-full flex flex-col";
      const disabledClasses = event.isPast
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer group";

      switch (variant) {
        case "landing":
          return `${baseClasses} ${disabledClasses} ${
            !event.isPast
              ? "hover:border-blue-500/50 hover:shadow-blue-500/20"
              : ""
          }`;
        case "peek":
          return `${baseClasses} ${disabledClasses} ${
            !event.isPast ? "hover:border-gray-500/50" : ""
          }`;
        default:
          return `${baseClasses} ${disabledClasses} ${
            !event.isPast ? "hover:border-gray-600/50" : ""
          }`;
      }
    };

    const getImageHeight = () => {
      switch (variant) {
        case "landing":
          return "h-64";
        case "peek":
          return "h-32";
        default:
          return "h-72";
      }
    };

    return (
      <div className={getCardClasses()} onClick={handleCardClick}>
        <div className={`relative ${getImageHeight()}`}>
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {event.isPast && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-lg font-semibold mb-1">
                  {t("event_ended")}
                </div>
                <div className="text-gray-300 text-sm">
                  {t("event_already_taken_place")}
                </div>
              </div>
            </div>
          )}
          {event.tag && (
            <div
              className={`absolute top-3 left-3 text-black text-xs font-bold px-2 py-1 rounded-full ${
                variant === "landing" ? "bg-[#EBCF35]" : "bg-[#EBCF35]"
              }`}
            >
              {event.tag}
            </div>
          )}
          {showRating && event.rating && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {event.rating}
            </div>
          )}
        </div>
        <div
          className={`${
            variant === "landing" ? "p-6" : "p-4"
          } relative flex-1 flex flex-col`}
        >
          {/* Blurred image background for content area */}
          <div
            className="absolute inset-0 -z-10 blur-2xl"
            style={{
              backgroundImage: `url(${event.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "rotate(180deg) scale(1.1)",
              transformOrigin: "center"
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 -z-10 bg-black/60"
            aria-hidden="true"
          />
          <h3
            className={`text-white font-semibold mb-2 line-clamp-2 ${
              variant === "landing"
                ? "text-lg"
                : variant === "peek"
                ? "text-xs"
                : "text-sm"
            }`}
          >
            {event.title}
          </h3>
          <div
            className={`space-y-1 text-gray-300 flex-1 flex flex-col ${
              variant === "landing" ? "text-sm" : "text-xs"
            }`}
          >
            <div className="flex items-center gap-1">
              <Calendar
                className={`text-blue-400 ${
                  variant === "peek" ? "w-2 h-2" : "w-3 h-3"
                }`}
              />
              <span>{event.date}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin
                  className={`text-blue-400 ${
                    variant === "peek" ? "w-2 h-2" : "w-3 h-3"
                  }`}
                />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            {event.description && (
              <div className="flex-1 pt-2">
                <span
                  className={`${
                    variant === "peek" ? "line-clamp-2" : "line-clamp-3"
                  } text-gray-400`}
                >
                  {event.description}
                </span>
              </div>
            )}
            {event.price && (
              <div
                className={`text-green-400 font-semibold mt-auto pt-2 ${
                  variant === "landing"
                    ? "text-base"
                    : variant === "peek"
                    ? "text-xs"
                    : "text-sm"
                }`}
              >
                {event.price}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Centered Carousel removed – using LandingCarousel for consistent visuals

  // Landing style carousel
  const LandingCarousel: React.FC<{
    title: string;
    events: EventItem[];
  }> = ({ title, events }) => {
    return (
      <div className="mb-12">
        <h2 className="text-white text-2xl font-bold mb-8 px-4">{title}</h2>
        <Swiper
          centeredSlides={true}
          slidesPerView={1.05}
          spaceBetween={16}
          speed={0}
          pagination={{
            clickable: true,
            dynamicBullets: false
          }}
          modules={[Pagination]}
          className="landing-carousel"
          breakpoints={{
            640: {
              slidesPerView: 2.1,
              spaceBetween: 20
            },
            1024: {
              slidesPerView: 3.1,
              spaceBetween: 24,
              centeredSlides: false,
              slidesOffsetBefore: 0
            }
          }}
        >
          {events.map((event) => (
            <SwiperSlide key={event.id}>
              <EventCard event={event} variant="centered" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: "auto",
        position: "relative"
      }}
    >
      <Background />
      <BackgroundBlobs />
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 w-full flex items-center"
        style={{
          backgroundColor,
          backdropFilter,
          borderBottom,
          height: headerHeight,
          boxShadow
        }}
      >
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <motion.div style={{ width: logoWidth }}>
            <Logo variant="inline" showAdminButton={false} />
          </motion.div>
        </div>
      </motion.div>
      <Navbar />

      {/* Main Content */}
      <motion.div className="pb-32" style={{ paddingTop: headerHeight }}>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <div className="text-white font-medium">
                {t("loading_campaigns")}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="text-6xl mb-4">😔</div>
              <div className="text-white font-semibold mb-2">
                {t("oops_something_went_wrong")}
              </div>
              <div className="text-gray-300 mb-6 text-sm">{error}</div>
              <button
                onClick={fetchCampaigns}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                {t("try_again")}
              </button>
            </div>
          </div>
        )}

        {/* Content - Show carousels when data is available */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* Upcoming Events Carousel */}
            {upcomingEvents.length > 0 && (
              <LandingCarousel
                title={t("upcoming_events")}
                events={upcomingEvents}
              />
            )}

            {/* Active Promotions Carousel */}
            {activePromotions.length > 0 && (
              <LandingCarousel
                title={t("active_promotions")}
                events={activePromotions}
              />
            )}

            {/* Empty State - when no campaigns exist */}
            {upcomingEvents.length === 0 && activePromotions.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md mx-auto px-4">
                  <div className="text-6xl mb-4">📅</div>
                  <div className="text-white font-semibold mb-2">
                    {t("no_campaigns_available")}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {t("check_back_later")}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Custom Styles */}
      <style>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Centered Carousel - Now left-aligned */
        .centered-carousel {
          padding-left: 16px;
          padding-right: 16px;
        }

        .centered-carousel .swiper-slide {
          transition: none;
          height: auto;
          display: flex;
          overflow: visible;
        }

        .centered-carousel .swiper-slide > div {
          width: 100%;
        }

        /* Never re-enable transitions to fully remove animations */

        .centered-carousel .swiper-pagination {
          bottom: -40px;
          left: 16px;
          text-align: left;
        }

        .centered-carousel .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.3);
          opacity: 1;
          margin: 0 4px 0 0;
        }

        .centered-carousel .swiper-pagination-bullet-active {
          background: white;
          transform: none;
        }

        /* Landing Carousel */
        .landing-carousel {
          padding-left: 16px;
          padding-right: 16px;
        }

        @media (min-width: 1024px) {
          .landing-carousel {
            padding-left: 12px;
            padding-right: 12px;
          }
          .landing-carousel .swiper-pagination {
            left: 12px;
          }
        }

        .landing-carousel .swiper-slide {
          transition: none;
          height: auto;
          display: flex;
        }

        .landing-carousel .swiper-slide > div {
          width: 100%;
        }

        .landing-carousel .swiper-pagination {
          bottom: -50px;
          left: 16px;
          text-align: left;
        }

        .swiper-pagination-bullet-large {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transition: none;
          opacity: 1;
          margin: 0 6px 0 0;
        }

        .swiper-pagination-bullet-large-active {
          background: white;
          transform: none;
        }

        /* Apple-like scrollbar styling */
        ::-webkit-scrollbar {
          display: none;
        }

        /* Smooth scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }

        /* Overscroll color */
        html {
          overscroll-behavior: contain;
        }

        body {
          overscroll-behavior: contain;
        }

        /* Timeline specific styles */
        .timeline-item:last-child .timeline-line {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Home;
