import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Eye } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export interface Event {
  id: string;
  short_id: string; // Add short_id for navigation
  title: string;
  date: string;
  location: string;
  description: string;
  price: string;
  image: string;
  lat: number;
  lng: number;
  tag: string;
}

interface EventCarouselProps {
  events: Event[];
  onEventChange: (event: Event) => void;
  selectedEventId?: string;
}

const EventCarousel: React.FC<EventCarouselProps> = ({
  events,
  onEventChange,
  selectedEventId,
}) => {
  const navigate = useNavigate();
  const swiperRef = useRef<{ swiper: SwiperType } | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (selectedEventId && swiperRef.current) {
      const index = events.findIndex((event) => event.id === selectedEventId);
      if (index !== -1) {
        swiperRef.current.swiper.slideTo(index);
      }
    }
  }, [selectedEventId, events]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!swiperRef.current) return;

      const swiper = swiperRef.current.swiper;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          swiper.slidePrev();
          break;
        case "ArrowRight":
          event.preventDefault();
          swiper.slideNext();
          break;
        case "Home":
          event.preventDefault();
          swiper.slideTo(0);
          break;
        case "End":
          event.preventDefault();
          swiper.slideTo(events.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [events.length]);

  const handleSlideChange = (swiper: SwiperType) => {
    const activeIndex = swiper.activeIndex;
    if (events[activeIndex]) {
      onEventChange(events[activeIndex]);
    }
  };

  const handleCardClick = (event: Event) => {
    // Find the index of the clicked event
    const eventIndex = events.findIndex((e) => e.id === event.id);
    if (eventIndex !== -1 && swiperRef.current) {
      // Slide to the clicked event
      swiperRef.current.swiper.slideTo(eventIndex);
      // Trigger the event change
      onEventChange(event);
    }
  };

  const handleViewEvent = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Navigate to campaign detail page using short_id
    navigate(`/c/${event.short_id}`);
  };

  const handlePrevClick = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const handleNextClick = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slideNext();
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent pb-8">
      <div className="w-full px-4 relative">
        <Swiper
          ref={swiperRef}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView="auto"
          spaceBetween={20}
          navigation={false} // Disable default navigation
          modules={[Navigation]}
          className="event-swiper"
          onSlideChange={handleSlideChange}
          initialSlide={0}
          breakpoints={{
            320: {
              slidesPerView: 1.2,
              spaceBetween: 16,
              centeredSlides: true,
            },
            640: {
              slidesPerView: "auto",
              spaceBetween: 20,
              centeredSlides: true,
            },
          }}
        >
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;
            return (
              <SwiperSlide
                key={event.id}
                className="w-80 sm:w-96 md:w-[480px] lg:w-[520px]"
              >
                <div className="relative w-full">
                  <div
                    className={`backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 transform transition-all duration-300 cursor-pointer ${
                      isSelected ? "" : ""
                    }`}
                    onClick={() => handleCardClick(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick(event);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t("select")} ${event.title} ${t("event")}`}
                  >
                    <div className="flex flex-col sm:flex-row h-auto sm:h-56">
                      {/* Image Section */}
                      <div className="relative w-full sm:w-1/2">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-40 sm:h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback = target.nextElementSibling;
                            if (fallback) {
                              fallback.classList.remove("hidden");
                              fallback.classList.add(
                                "flex",
                                "items-center",
                                "justify-center"
                              );
                            }
                          }}
                        />
                        <div className="absolute inset-0  hidden">
                          <div className="text-white text-center">
                            <div className="text-lg font-bold">
                              {event.title}
                            </div>
                            <div className="text-xs opacity-90">
                              {event.date}
                            </div>
                          </div>
                        </div>

                        {/* Event Tag */}
                        <div className="absolute top-3 right-3 bg-[#EBCF35] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          {event.tag}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="w-full sm:w-1/2 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                            {event.title}
                          </h3>

                          <div className="space-y-2 text-xs text-gray-300 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#EBCF35]" />
                              <span className="line-clamp-1">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#EBCF35]" />
                              <span className="line-clamp-1">
                                {event.location}
                              </span>
                            </div>
                          </div>

                          {/* Description - Hidden on mobile */}
                          <p className="text-gray-400 text-xs leading-relaxed mb-3 hidden xl:line-clamp-3">
                            {event.description}
                          </p>
                        </div>

                        {/* Bottom Section */}
                        <div className="flex items-center justify-between">
                          {/* View Event Button */}
                          <button
                            onClick={(e) => handleViewEvent(event, e)}
                            className="flex items-center justify-center gap-1 bg-[#EBCF35] hover:bg-[#D4B82A] text-black text-xs px-2 py-1 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#EBCF35]/50 w-full h-7 min-h-0"
                            aria-label={`Learn more about ${event.title} event`}
                          >
                            <Eye className="w-3 h-3 text-black" />
                            <span>{t("learn_more")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fade Overlay for non-active slides */}
                  <div className="fade-overlay absolute inset-0 bg-black/40 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Custom Navigation Buttons - Centered to card height */}
        <button
          onClick={handlePrevClick}
          className="absolute top-[calc(50%-24px)] -translate-y-1/2 left-1 sm:left-2 z-10 bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Previous event"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={handleNextClick}
          className="absolute top-[calc(50%-24px)] -translate-y-1/2 right-1 sm:right-2 z-10 bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Next event"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Custom Styles */}
      <style>{`
        .event-swiper {
          width: 100%;
          overflow: visible;
        }
        
        .swiper-slide {
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
        }
        
        .swiper-slide-active {
          transform: scale(1.05);
        }
        
        .swiper-slide-active .fade-overlay {
          opacity: 0;
          visibility: hidden;
        }
        
        .swiper-slide-prev,
        .swiper-slide-next {
          transform: scale(0.95);
        }
        
        .swiper-slide-prev .fade-overlay,
        .swiper-slide-next .fade-overlay {
          opacity: 1;
          visibility: visible;
        }
        
        .swiper-slide:not(.swiper-slide-active):not(.swiper-slide-prev):not(.swiper-slide-next) .fade-overlay {
          opacity: 1;
          visibility: visible;
        }
        
        .fade-overlay {
          opacity: 1;
          visibility: visible;
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 639px) {
          .swiper-slide {
            width: 320px !important;
            flex-shrink: 0;
          }
          
          .swiper-slide-active {
            transform: scale(1.02);
          }
          
          .swiper-slide-prev,
          .swiper-slide-next {
            transform: scale(0.92);
          }
          
          .event-swiper .swiper-wrapper {
            padding: 0 10px;
          }
          .event-swiper {
            margin-bottom: 70px;
          }
        }
        
        /* Desktop-specific adjustments */
        @media (min-width: 640px) {
          .event-swiper {
            padding: 20px 60px;
          }
          
          .swiper-slide-active {
            transform: scale(1.05);
          }
          
          .swiper-slide-prev,
          .swiper-slide-next {
            transform: scale(0.95);
          }
        }
        
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
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        

      `}</style>
    </div>
  );
};

export default EventCarousel;
