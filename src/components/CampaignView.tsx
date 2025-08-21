import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, CheckCircle, MapPin, Phone, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Campaign } from "../types";
import {
  detectCountryFromPhone,
  normalizePhoneNumber,
  validatePhoneNumber
} from "../utils/phoneValidation";
import Logo from "./Logo";

const CampaignView: React.FC = () => {
  const { token, shortId } = useParams<{ token?: string; shortId?: string }>();
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

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (token || shortId) {
      if (token) {
        verifyTokenAndFetchCampaign(token);
      } else if (shortId) {
        fetchCampaignByShortId(shortId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, shortId]);

  // Check if description content overflows on desktop
  useEffect(() => {
    if (campaign && window.innerWidth >= 1024) {
      const descriptionSection = document.getElementById("description-section");
      if (descriptionSection) {
        const checkOverflow = () => {
          const hasOverflow =
            descriptionSection.scrollHeight > descriptionSection.clientHeight;
          descriptionSection.classList.toggle("has-overflow", hasOverflow);
        };

        // Check after a short delay to ensure content is rendered
        const timer = setTimeout(checkOverflow, 100);

        // Also check on window resize
        window.addEventListener("resize", checkOverflow);

        return () => {
          clearTimeout(timer);
          window.removeEventListener("resize", checkOverflow);
        };
      }
    }
  }, [campaign]);

  const verifyTokenAndFetchCampaign = async (tokenValue: string) => {
    try {
      setLoading(true);

      // Find the campaign_recipient record by token and fetch related campaign and user data
      const { data: recipientData, error: recipientError } = await supabase
        .from("campaign_recipients")
        .select(
          `
          id,
          status,
          campaign_id,
          user_id,
          viewed_at,
          responded_at,
          unique_token,
          created_at,
          campaigns!inner(*),
          users!inner(*)
        `
        )
        .eq("unique_token", tokenValue)
        .single();

      if (recipientError) {
        if (recipientError.code === "PGRST116") {
          setError(t("campaignView.invalidLink"));
        } else {
          throw recipientError;
        }
        return;
      }

      // Set campaign and recipient data
      setCampaign(recipientData.campaigns as unknown as Campaign);
      setRecipientId(recipientData.id);
      setRsvpStatus(recipientData.status);

      // Update viewed status if not already responded
      if (recipientData.status === "sent") {
        await supabase
          .from("campaign_recipients")
          .update({
            status: "viewed",
            viewed_at: new Date().toISOString()
          })
          .eq("id", recipientData.id);

        setRsvpStatus("viewed");
      }
    } catch (err) {
      console.error("Error verifying token and fetching campaign:", err);
      setError(
        err instanceof Error ? err.message : t("campaignView.failedToLoad")
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignByShortId = async (shortIdValue: string) => {
    try {
      setLoading(true);

      // Find the campaign by short_id
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("short_id", shortIdValue)
        .single();

      if (campaignError) {
        if (campaignError.code === "PGRST116") {
          setError(t("campaignView.campaignNotFound"));
        } else {
          throw campaignError;
        }
        return;
      }

      // Set campaign data
      setCampaign(campaignData);

      // Show phone input only for events, promotions show call button directly
      if (campaignData.type === "event") {
        setShowPhoneInput(true);
      }
    } catch (err) {
      console.error("Error fetching campaign by short ID:", err);
      setError(
        err instanceof Error ? err.message : t("campaignView.failedToLoad")
      );
    } finally {
      setLoading(false);
    }
  };
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim() || !campaign) return;

    // Validate before proceeding
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneTouched(true);
      setSubmitMessage({
        type: "error",
        text:
          t("campaignView.invalidPhoneNumber") ||
          "Please enter a valid phone number in international format"
      });
      return;
    }

    try {
      setSubmitting(true);

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber.trim());

      // Check if user exists
      let userId;
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", normalizedPhone)
        .single();

      if (userError) {
        // User doesn't exist, create new user
        const country =
          detectCountryFromPhone(normalizedPhone) ||
          t("campaignView.unknownCountry");
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              phone_number: normalizedPhone,
              country,
              status: "active"
            }
          ])
          .select("id")
          .single();

        if (createError) throw createError;
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }

      // Check if recipient record exists
      const { data: existingRecipient, error: recipientError } = await supabase
        .from("campaign_recipients")
        .select("id, unique_token, status")
        .eq("campaign_id", campaign.id)
        .eq("user_id", userId)
        .single();

      if (recipientError) {
        // Create new recipient record
        const uniqueToken = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();

        const { error: createRecipientError } = await supabase
          .from("campaign_recipients")
          .insert([
            {
              campaign_id: campaign.id,
              user_id: userId,
              status: "viewed",
              viewed_at: new Date().toISOString(),
              unique_token: uniqueToken
            }
          ])
          .select("id")
          .single();

        if (createRecipientError) throw createRecipientError;

        // Redirect to the same page with token
        window.location.href = `${window.location.origin}/${uniqueToken}`;
      } else {
        // Recipient exists, update status if needed
        if (existingRecipient.status === "sent") {
          await supabase
            .from("campaign_recipients")
            .update({
              status: "viewed",
              viewed_at: new Date().toISOString()
            })
            .eq("id", existingRecipient.id);
        }

        // Redirect to the same page with token
        window.location.href = `${window.location.origin}/${existingRecipient.unique_token}`;
      }
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : t("campaignView.anErrorOccurred")
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRsvp = async (response: "accepted" | "declined") => {
    if (!recipientId) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("campaign_recipients")
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq("id", recipientId);

      if (error) throw error;

      setRsvpStatus(response);
      setSubmitMessage({
        type: "success",
        text:
          response === "accepted"
            ? t("campaignView.thankYouAccepting")
            : t("campaignView.thankYouResponse")
      });
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : t("campaignView.failedToUpdateRsvp")
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    const dateStr = date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    if (diffDays === 0) return `${t("campaignView.today")} ${timeStr}`;
    if (diffDays === 1) return `${t("campaignView.tomorrow")} ${timeStr}`;
    if (diffDays > 0 && diffDays <= 7) return `${dateStr} at ${timeStr}`;

    return `${dateStr} at ${timeStr}`;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        className="flex items-center justify-center p-4 w-full overflow-x-hidden"
      >
        <div className="text-center max-w-sm mx-auto w-full">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-white mx-auto mb-3 sm:mb-4"></div>
          <p className="text-white font-medium text-sm sm:text-base">
            {t("campaignView.loading")}
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            {t("campaignView.loadingSubtitle")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        className="flex items-center justify-center p-4 w-full overflow-x-hidden"
      >
        <div className="bg-gray-900/95 backdrop-blur-sm p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-gray-700/50 max-w-sm w-full text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">😕</div>
          <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
            {t("campaignView.campaignNotFound")}
          </h1>
          <p className="text-gray-300 mb-4 sm:mb-6 text-sm">
            {error || t("campaignView.invalidLinkExpired")}
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg sm:rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            {t("campaignView.goHome")}
          </button>
        </div>
      </div>
    );
  }

  // Show phone input if no recipient ID (shouldn't happen with token-based access)
  // Skip this for promotions as they don't need phone verification
  if (shortId && !recipientId && !showPhoneInput && campaign.type === "event") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        className="flex items-center justify-center p-4 w-full overflow-x-hidden"
      >
        <div className="bg-gray-900/95 backdrop-blur-sm p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-gray-700/50 max-w-sm w-full text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔐</div>
          <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
            {t("campaignView.accessRequired")}
          </h1>
          <p className="text-gray-300 mb-4 sm:mb-6 text-sm">
            {t("campaignView.verifyPhoneRequired")}
          </p>
          <button
            onClick={() => setShowPhoneInput(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg sm:rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            {t("campaignView.verifyPhoneNumber")}
          </button>
        </div>
      </div>
    );
  }

  // Get tag for campaign
  const getEventTag = (campaign: Campaign): string => {
    if (campaign.type === "promotion") {
      const createdDate = new Date(campaign.created_at);
      const now = new Date();
      const diffDays = Math.ceil(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 7) return t("campaignView.new");
      if (campaign.rsvp_enabled) return t("campaignView.limited");
      return t("campaignView.promo");
    }

    if (campaign.date) {
      const eventDate = new Date(campaign.date);
      const now = new Date();
      const diffTime = eventDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return t("campaignView.past");
      if (diffDays <= 7) return t("campaignView.thisWeek");
      if (diffDays <= 30) return t("campaignView.popular");
      return t("campaignView.upcoming");
    }

    return t("campaignView.new");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative"
      }}
      className="w-full overflow-x-hidden"
    >
      {/* Blurred Background Layer */}
      {campaign.image_url ? (
        <>
          <img
            src={campaign.image_url}
            alt=""
            aria-hidden="true"
            className="fixed inset-0 w-full h-full object-cover blur-xl sm:blur-2xl scale-110 z-0 select-none pointer-events-none"
          />
          <div className="fixed inset-0 bg-black/60 z-0" />
        </>
      ) : (
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#2d2d2d]" />
      )}
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

      {/* Main Content */}
      <motion.div
        className={`relative z-10 w-full pb-8 sm:pb-10 ${
          (!showPhoneInput && recipientId) ||
          campaign.type === "promotion" ||
          (showPhoneInput && campaign.type === "event")
            ? "pb-64 md:pb-10"
            : ""
        } ${
          showPhoneInput && campaign.type === "event"
            ? "mobile-content-padding md:pb-10"
            : ""
        } ${
          campaign.rsvp_enabled &&
          (rsvpStatus === "accepted" || rsvpStatus === "declined")
            ? "mobile-rsvp-padding md:pb-10"
            : ""
        } ${
          ((!showPhoneInput && recipientId) || campaign.type === "promotion") &&
          !(
            campaign.rsvp_enabled &&
            (rsvpStatus === "accepted" || rsvpStatus === "declined")
          )
            ? "mobile-action-padding md:pb-10"
            : ""
        }`}
        style={{ paddingTop: headerHeight }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Campaign Main Section - Modern Card Layout */}
          <div className="backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-700/60 transform transition-all duration-300 bg-black/40 hover:bg-black/50 w-full lg:max-h-[90vh]">
            <div className="flex flex-col lg:flex-row w-full">
              {/* Left Side - Image */}
              <div className="lg:w-1/2 relative w-full lg:max-h-[90vh]">
                <div className="h-[50vh] min-h-[260px] sm:h-80 md:h-96 lg:h-full w-full">
                  {campaign.image_url ? (
                    <img
                      src={campaign.image_url}
                      alt={campaign.name}
                      className="w-full h-full object-contain sm:object-cover object-center bg-black"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center ${
                        campaign.type === "event"
                          ? "bg-gradient-to-br from-blue-500 to-purple-600"
                          : "bg-gradient-to-br from-purple-500 to-pink-600"
                      }`}
                    >
                      {campaign.type === "event" ? (
                        <Calendar className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-white" />
                      ) : (
                        <div className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                          %
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                  {/* Campaign Tag */}
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                    <div className="bg-[#EBCF35] text-black text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                      {getEventTag(campaign)}
                    </div>
                  </div>

                  {/* Campaign Type */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <div
                      className={`text-white text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm border ${
                        campaign.type === "event"
                          ? "bg-blue-500/30 border-blue-500/50"
                          : "bg-purple-500/30 border-purple-500/50"
                      }`}
                    >
                      {campaign.type === "event"
                        ? t("campaigns.event")
                        : t("campaigns.promotion")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="lg:w-1/2 p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col w-full lg:max-h-[80vh] lg:overflow-hidden">
                {/* Title and Basic Info */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 leading-tight break-words">
                    {campaign.name}
                  </h1>

                  <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
                    {campaign.date && (
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold text-sm sm:text-base lg:text-lg break-words">
                            {formatDate(campaign.date)}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {t("campaignView.eventTime")}
                          </p>
                        </div>
                      </div>
                    )}

                    {(campaign.location ||
                      (campaign.latitude != null &&
                        campaign.longitude != null)) &&
                      (() => {
                        const mapsUrl =
                          campaign.latitude != null &&
                          campaign.longitude != null
                            ? `https://www.google.com/maps/search/?api=1&query=${campaign.latitude},${campaign.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                campaign.location as string
                              )}`;
                        return (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 sm:gap-4 group"
                            title="Open in Google Maps"
                          >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 group-hover:text-green-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-semibold text-sm sm:text-base lg:text-lg break-words group-hover:underline group-hover:decoration-dotted">
                                {campaign.location ??
                                  `${campaign.latitude}, ${campaign.longitude}`}
                              </p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                {t("campaignView.location")}
                              </p>
                            </div>
                          </a>
                        );
                      })()}
                  </div>
                </div>

                {/* Separator */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-4 sm:mb-6 lg:mb-8"></div>

                {/* Description with See More/Less - Scrollable on Desktop */}
                <div
                  className="flex-1 lg:min-h-0 lg:overflow-y-auto desktop-scrollbar scrollable-content"
                  id="description-section"
                >
                  <div className="lg:pr-2">
                    <h3 className="font-semibold text-white mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm sm:text-base lg:text-lg">
                        {t("campaignView.details")}
                      </span>
                    </h3>
                    <div className="text-gray-300 leading-relaxed">
                      <div
                        className={`whitespace-pre-wrap text-sm sm:text-base break-words ${
                          !showFullDescription
                            ? "line-clamp-3 sm:line-clamp-4 lg:line-clamp-none"
                            : ""
                        }`}
                      >
                        {campaign.description}
                      </div>
                      {/* Show See More/Less only on mobile since desktop has scrolling */}
                      {campaign.description.length > 150 && (
                        <button
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2 sm:mt-3 transition-colors hover:underline lg:hidden"
                        >
                          {showFullDescription
                            ? t("campaignView.seeLess")
                            : t("campaignView.seeMore")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-4 sm:my-6 lg:my-8"></div>

                {/* Phone Input Form or RSVP Status - Integrated */}
                <div className="space-y-4 sm:space-y-6">
                  {showPhoneInput ? (
                    <div className="space-y-4 sm:space-y-6 hidden md:block">
                      <div className="text-left">
                        <h4 className="text-lg sm:text-xl font-semibold text-white mb-2">
                          {t("campaignView.enterPhoneNumber")}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {t("campaignView.phoneVerificationDescription")}
                        </p>
                      </div>

                      <form
                        onSubmit={handlePhoneSubmit}
                        className="space-y-4 sm:space-y-6"
                      >
                        <div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            onBlur={() => setPhoneTouched(true)}
                            placeholder={t("campaignView.phonePlaceholder")}
                            className="w-full px-4 sm:px-6 py-3 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#EBCF35]/50 focus:border-[#EBCF35] text-left font-medium text-white placeholder-gray-400 transition-all duration-300 text-base shadow-sm hover:shadow-md"
                            required
                          />
                          {phoneTouched &&
                            !validatePhoneNumber(phoneNumber) && (
                              <p className="mt-2 text-sm text-red-400">
                                {t("campaignView.invalidPhoneNumber") ||
                                  "Invalid phone number. Use international format like +3598..."}
                              </p>
                            )}
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-[#EBCF35] hover:bg-[#D4B82A] text-black py-3 sm:py-3 rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-base shadow-lg hover:shadow-xl"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></div>
                              {t("campaignView.verifying")}
                            </>
                          ) : (
                            t("campaignView.continue")
                          )}
                        </button>
                      </form>
                    </div>
                  ) : campaign.type === "promotion" ? (
                    <div className="space-y-4 sm:space-y-6 hidden md:block">
                      <div className="text-left">
                        <h4 className="text-lg sm:text-xl font-semibold text-white mb-2">
                          {t("campaignView.getThisOffer")}
                        </h4>
                        <p className="text-gray-400">
                          {t("campaignView.contactToClaim")}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          (window.location.href = `tel:${t(
                            "campaignView.phoneNumber"
                          )}`)
                        }
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center text-base sm:text-lg shadow-lg hover:shadow-xl"
                      >
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                        {t("campaignView.callNow")}
                      </button>
                    </div>
                  ) : recipientId &&
                    campaign.rsvp_enabled &&
                    rsvpStatus !== "accepted" &&
                    rsvpStatus !== "declined" ? (
                    <div className="hidden md:block">
                      <div className="bg-transparent p-0">
                        <p className="text-white font-medium mb-4 text-base">
                          {t("campaignView.willYouAttend")}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleRsvp("accepted")}
                            disabled={submitting}
                            className="flex items-center justify-center py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-300 shadow-lg"
                          >
                            {submitting ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                {t("campaignView.accept")}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRsvp("declined")}
                            disabled={submitting}
                            className="flex items-center justify-center py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-300 shadow-lg"
                          >
                            {submitting ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 mr-2" />
                                {t("campaignView.decline")}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : recipientId &&
                    campaign.rsvp_enabled &&
                    (rsvpStatus === "accepted" || rsvpStatus === "declined") ? (
                    <div className="text-center hidden md:block">
                      <div
                        className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium ${
                          rsvpStatus === "accepted"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {rsvpStatus === "accepted" ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                        ) : (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                        )}
                        <span className="text-sm sm:text-base">
                          {rsvpStatus === "accepted"
                            ? t("campaignView.rsvpAccepted")
                            : t("campaignView.rsvpDeclined")}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {submitMessage && !showPhoneInput && (
            <div
              className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                submitMessage.type === "success"
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-red-500/20 border-red-500/30"
              }`}
            >
              <div className="flex items-center">
                {submitMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2 sm:mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-2 sm:mr-2" />
                )}
                <p
                  className={`text-sm font-medium ${
                    submitMessage.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {submitMessage.text}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile-only Floating Action Bar (prompt/actions) */}
      {((!showPhoneInput && recipientId) || campaign.type === "promotion") &&
        !(
          campaign.rsvp_enabled &&
          (rsvpStatus === "accepted" || rsvpStatus === "declined")
        ) && (
          <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 z-30 md:hidden w-[calc(100vw-2rem)] max-w-2xl mx-auto">
            {campaign.rsvp_enabled &&
            rsvpStatus !== "accepted" &&
            rsvpStatus !== "declined" ? (
              <div className="bg-black/60 backdrop-blur-xl backdrop-saturate-150 rounded-2xl p-4 sm:p-6 w-full shadow-2xl">
                <p className="text-center text-white font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                  {t("campaignView.willYouAttend")}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => handleRsvp("accepted")}
                    disabled={submitting}
                    className="flex items-center justify-center py-3 sm:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg sm:rounded-xl font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-300 shadow-lg text-sm sm:text-base"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        {t("campaignView.accept")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRsvp("declined")}
                    disabled={submitting}
                    className="flex items-center justify-center py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-300 shadow-lg text-sm sm:text-base"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        {t("campaignView.decline")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : campaign.type === "promotion" ? (
              <button
                onClick={() =>
                  (window.location.href = `tel:${t(
                    "campaignView.phoneNumber"
                  )}`)
                }
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center shadow-2xl text-sm sm:text-base"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                {t("campaignView.callNow")}
              </button>
            ) : (
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-2xl text-sm sm:text-base">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                {t("campaignView.callNow")}
              </button>
            )}
          </div>
        )}

      {/* Mobile-only RSVP Status Bar (glass style) */}
      {campaign.rsvp_enabled &&
        (rsvpStatus === "accepted" || rsvpStatus === "declined") && (
          <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
            <div
              className="bg-transparent rounded-t-2xl p-4"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)"
              }}
            >
              <div className="text-center w-full">
                <div
                  className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium border backdrop-blur-xl bg-white/10 border-white/15 ${
                    rsvpStatus === "accepted"
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                  style={{ WebkitBackdropFilter: "blur(12px)" }}
                >
                  {rsvpStatus === "accepted" ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  )}
                  <span className="text-sm sm:text-base">
                    {rsvpStatus === "accepted"
                      ? t("campaignView.rsvpAccepted")
                      : t("campaignView.rsvpDeclined")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Mobile-only Phone Verification Bar */}
      {showPhoneInput && campaign.type === "event" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
          <div
            className="bg-black/60 backdrop-blur-xl backdrop-saturate-150 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.6)] p-4 space-y-3"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)"
            }}
          >
            <div className="text-left">
              <h4 className="text-base font-semibold text-white mb-1">
                {t("campaignView.enterPhoneNumber")}
              </h4>
              <p className="text-gray-400 text-xs">
                {t("campaignView.phoneVerificationDescription")}
              </p>
            </div>
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                placeholder={t("campaignView.phonePlaceholder")}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#EBCF35]/50 focus:border-[#EBCF35] text-left font-medium text-white placeholder-gray-400 transition-all duration-300 text-base shadow-sm"
                required
              />
              {phoneTouched && !validatePhoneNumber(phoneNumber) && (
                <p className="mt-2 text-sm text-red-400">
                  {t("campaignView.invalidPhoneNumber") ||
                    "Invalid phone number. Use international format like +3598..."}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#EBCF35] hover:bg-[#D4B82A] text-black py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-base shadow-xl"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></div>
                    {t("campaignView.verifying")}
                  </>
                ) : (
                  t("campaignView.continue")
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
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
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%);
        }

        /* Line clamp utility */
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
        
        /* Custom scrollbar for desktop description section */
        .desktop-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .desktop-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .desktop-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(75 85 99);
          border-radius: 9999px;
        }
        
        .desktop-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgb(107 114 128);
        }
        
        /* Firefox scrollbar styling */
        .desktop-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(75 85 99) transparent;
        }
        
        /* Hide scrollbar when not needed */
        .desktop-scrollbar:not(.has-overflow)::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth scrolling for description section */
        .desktop-scrollbar {
          scroll-behavior: smooth;
        }
        
        /* Fade effect for scrollable content */
        .scrollable-content {
          position: relative;
        }
        
        .scrollable-content::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .scrollable-content.has-overflow::after {
          opacity: 1;
        }

        /* Mobile-specific improvements */
        @media (max-width: 640px) {
          .line-clamp-3 {
            -webkit-line-clamp: 4;
          }
          
          /* Better mobile typography */
          h1 {
            line-height: 1.2;
          }
          
          /* Improved mobile spacing */
          .space-y-4 > * + * {
            margin-top: 1rem;
          }
          
          /* Better mobile touch targets */
          button, input, select {
            min-height: 44px;
          }
          
          /* Ensure content is not hidden behind fixed phone input bar */
          .mobile-content-padding {
            padding-bottom: calc(env(safe-area-inset-bottom) + 360px);
          }
          
          /* Ensure content is not hidden behind fixed RSVP status bar */
          .mobile-rsvp-padding {
            padding-bottom: calc(env(safe-area-inset-bottom) + 120px);
          }
          
          /* Ensure content is not hidden behind floating action bar */
          .mobile-action-padding {
            padding-bottom: calc(env(safe-area-inset-bottom) + 140px);
          }
        }
        
        /* Additional mobile optimizations */
        @media (max-width: 640px) and (max-height: 700px) {
          /* For very short mobile screens, increase padding */
          .mobile-content-padding {
            padding-bottom: calc(env(safe-area-inset-bottom) + 400px);
          }
          
          .mobile-rsvp-padding {
            padding-bottom: calc(env(safe-area-inset-bottom) + 160px);
          }
          
          .mobile-action-padding {
            padding-bottom: calc(env(safe-area-inset-bottom) + 180px);
          }
        }
        
        /* Ensure desktop scrolling doesn't interfere with mobile */
        @media (max-width: 1023px) {
          .desktop-scrollbar {
            overflow: visible !important;
            max-height: none !important;
          }
          
          .scrollable-content::after {
            display: none;
          }
        }
        }

        /* Tablet-specific improvements */
        @media (min-width: 641px) and (max-width: 1024px) {
          .line-clamp-3 {
            -webkit-line-clamp: 5;
          }
        }
      `}</style>
    </div>
  );
};

export default CampaignView;
