import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { generateUniqueShortId } from "../utils/shortId";
import { useStorageUpload } from "../hooks/useStorageUpload";
import {
  Plus,
  Calendar,
  MapPin,
  Eye,
  Trash2,
  ExternalLink,
  X,
  Image as ImageIcon,
  Edit,
  Search,
  AlertTriangle,
} from "lucide-react";
import LocationMapPicker from "./LocationMapPicker";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Campaign {
  id: string;
  short_id: string;
  name: string;
  description: string;
  image_url?: string;
  date?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  rsvp_enabled: boolean;
  type: "event" | "promotion";
  created_at: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  type?: string;
  image_url?: string;
  date?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
}

const CampaignManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { uploadState, uploadFile, clearUpload } = useStorageUpload();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    short_id: "",
    image_url: "",
    date: "",
    location: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    rsvp_enabled: false,
    type: "event" as "event" | "promotion",
  });
  const [dragActive, setDragActive] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(searchLower) ||
      campaign.description.toLowerCase().includes(searchLower) ||
      campaign.type.toLowerCase().includes(searchLower) ||
      (campaign.location &&
        campaign.location.toLowerCase().includes(searchLower))
    );
  });

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Name is required
    if (!newCampaign.name.trim()) {
      errors.name = t("campaigns.nameRequiredError");
    }

    // Description is required
    if (!newCampaign.description.trim()) {
      errors.description = t("campaigns.descriptionRequiredError");
    }

    // Type is required
    if (!newCampaign.type) {
      errors.type = t("campaigns.typeRequiredError");
    }

    // Image URL is required
    if (!newCampaign.image_url) {
      errors.image_url = t("campaigns.imageRequiredError");
    }

    // Date is required
    if (!newCampaign.date) {
      errors.date = t("campaigns.dateRequiredError");
    }

    // Location is required
    if (!newCampaign.location.trim()) {
      errors.location = t("campaigns.locationRequiredError");
    }

    // Latitude and longitude are required
    if (typeof newCampaign.latitude !== "number") {
      errors.latitude = t("campaigns.latitudeRequiredError");
    }

    if (typeof newCampaign.longitude !== "number") {
      errors.longitude = t("campaigns.longitudeRequiredError");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Generate unique short_id
      const checkShortIdExists = async (shortId: string): Promise<boolean> => {
        const { data } = await supabase
          .from("campaigns")
          .select("id")
          .eq("short_id", shortId)
          .limit(1);

        return data !== null && data.length > 0;
      };

      const shortId = await generateUniqueShortId(checkShortIdExists);

      // Normalize nullable fields to avoid empty strings in timestamp/nullable columns
      const payload = {
        name: newCampaign.name,
        description: newCampaign.description,
        short_id: shortId,
        image_url: newCampaign.image_url || null,
        date: newCampaign.date || null,
        location: newCampaign.location || null,
        latitude:
          typeof newCampaign.latitude === "number"
            ? newCampaign.latitude
            : null,
        longitude:
          typeof newCampaign.longitude === "number"
            ? newCampaign.longitude
            : null,
        rsvp_enabled: newCampaign.rsvp_enabled,
        type: newCampaign.type,
      };

      const { data, error } = await supabase
        .from("campaigns")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setCampaigns([data, ...campaigns]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (!validateForm()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .update({
          name: newCampaign.name,
          description: newCampaign.description,
          image_url: newCampaign.image_url || null,
          date: newCampaign.date || null,
          location: newCampaign.location || null,
          latitude: newCampaign.latitude || null,
          longitude: newCampaign.longitude || null,
          rsvp_enabled: newCampaign.rsvp_enabled,
          type: newCampaign.type,
        })
        .eq("id", editingCampaign.id)
        .select()
        .single();

      if (error) throw error;

      setCampaigns(
        campaigns.map((c) => (c.id === editingCampaign.id ? data : c))
      );
      setShowEditModal(false);
      setEditingCampaign(null);
      resetForm();
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);

    // Format date for datetime-local input
    const formattedDate = campaign.date
      ? new Date(campaign.date).toISOString().slice(0, 16)
      : "";

    setNewCampaign({
      name: campaign.name,
      description: campaign.description,
      short_id: campaign.short_id,
      image_url: campaign.image_url || "",
      date: formattedDate,
      location: campaign.location || "",
      latitude: campaign.latitude,
      longitude: campaign.longitude,
      rsvp_enabled: campaign.rsvp_enabled,
      type: campaign.type,
    });
    setShowEditModal(true);
  };
  const handleDeleteCampaign = async (id: string) => {
    setCampaignToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignToDelete);

      if (error) throw error;
      setCampaigns(campaigns.filter((c) => c.id !== campaignToDelete));
      setShowDeleteConfirmation(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const cancelDeleteCampaign = () => {
    setShowDeleteConfirmation(false);
    setCampaignToDelete(null);
  };

  const getPublicUrl = (campaignId: string) => {
    // Find the campaign to get its short_id
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign?.short_id) {
      return `${window.location.origin}/c/${campaign.short_id}`;
    }
    return `${window.location.origin}/c/${campaignId}`;
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setNewCampaign((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Clear any existing image before uploading new one
    if (newCampaign.image_url) {
      setNewCampaign({
        ...newCampaign,
        image_url: "",
      });
      clearUpload();
    }

    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      setNewCampaign({
        ...newCampaign,
        image_url: uploadedUrl,
      });
    }
  };

  const handleClearImage = () => {
    setNewCampaign({
      ...newCampaign,
      image_url: "",
    });
    clearUpload();
  };

  const resetForm = () => {
    setNewCampaign({
      name: "",
      description: "",
      short_id: "",
      image_url: "",
      date: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      rsvp_enabled: false,
      type: "event",
    });
    setValidationErrors({});
    clearUpload();
    setEditingCampaign(null);
  };

  const handleFieldChange = (
    field: keyof typeof newCampaign,
    value: string | boolean | number | undefined
  ) => {
    setNewCampaign((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("campaigns.title")}
          </h1>
          <p className="text-gray-600">{t("campaigns.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          style={{ minHeight: "44px" }}
        >
          <Plus className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">
            {t("campaigns.createCampaign")}
          </span>
          <span className="sm:hidden">{t("create")}</span>
        </button>
      </div>

      {/* Search Field */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder={t("campaigns.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ fontSize: "16px", minHeight: "44px" }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            {t("campaigns.foundResults", {
              count: filteredCampaigns.length,
              searchTerm,
            })}
          </p>
        )}
      </div>
      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("campaigns.noCampaigns")}
          </h3>
          <p className="text-gray-600 mb-6">
            {t("campaigns.noCampaignsSubtitle")}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            style={{ minHeight: "44px" }}
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("campaigns.createCampaign")}
          </button>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("campaigns.noResults")}
          </h3>
          <p className="text-gray-600 mb-6">
            {t("campaigns.noResultsSubtitle")}
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            style={{ minHeight: "44px" }}
          >
            <X className="h-5 w-5 mr-2" />
            {t("campaigns.clearSearch")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
            >
              {campaign.image_url && (
                <img
                  src={campaign.image_url}
                  alt={campaign.name}
                  className="w-full h-32 sm:h-48 object-cover"
                />
              )}
              <div className="p-3 sm:p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                    {campaign.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                      campaign.type === "event"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {campaign.type}
                  </span>
                </div>

                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                  {campaign.description}
                </p>

                {campaign.date && (
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(campaign.date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {campaign.location && (
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">{campaign.location}</span>
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 w-full">
                    <button
                      onClick={() =>
                        navigate(`/admin/campaigns/${campaign.id}`)
                      }
                      className="flex items-center justify-center w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
                      style={{ minHeight: "32px" }}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">{t("view")}</span>
                      <span className="sm:hidden">View</span>
                    </button>

                    <button
                      onClick={() => openEditModal(campaign)}
                      className="flex items-center justify-center w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors duration-200"
                      style={{ minHeight: "32px" }}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">{t("edit")}</span>
                      <span className="sm:hidden">Edit</span>
                    </button>

                    <a
                      href={getPublicUrl(campaign.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200"
                      style={{ minHeight: "32px" }}
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">
                        {t("campaigns.public")}
                      </span>
                      <span className="sm:hidden">Public</span>
                    </a>

                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="flex items-center justify-center w-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
                      style={{ minHeight: "32px" }}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">{t("delete")}</span>
                      <span className="sm:hidden">Del</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && editingCampaign && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{
            marginTop: 0,
          }}
          onClick={() => {
            setShowEditModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("campaigns.editCampaign")}
                </h2>
                <button
                  type="button"
                  aria-label={t("close")}
                  title={t("close")}
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.nameRequired")}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.descriptionRequired")}
                  </label>
                  <textarea
                    required
                    value={newCampaign.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px" }}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.typeRequired")}
                  </label>
                  <Select
                    value={newCampaign.type}
                    onValueChange={(value) =>
                      handleFieldChange("type", value as "event" | "promotion")
                    }
                  >
                    <SelectTrigger
                      className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ minHeight: "44px" }}
                    >
                      <SelectValue placeholder={t("campaigns.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">
                        {t("campaigns.event")}
                      </SelectItem>
                      <SelectItem value="promotion">
                        {t("campaigns.promotion")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.type && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("campaigns.image")}
                  </label>

                  {/* Image Preview or Upload Area */}
                  {newCampaign.image_url ? (
                    /* Image Preview */
                    <div className="relative">
                      <img
                        src={newCampaign.image_url}
                        alt={t("campaigns.image")}
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <div className="absolute top-2 right-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Area */
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                        dragActive
                          ? "border-blue-400 bg-blue-50"
                          : uploadState.error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="text-center">
                        {uploadState.uploading ? (
                          <div className="space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-blue-600">
                              {t("campaigns.uploadingImage")}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadState.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label
                                htmlFor="edit-image-upload"
                                className="cursor-pointer"
                              >
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  {t("campaigns.dropImage")}{" "}
                                  <span className="text-blue-600">
                                    {t("campaigns.browse")}
                                  </span>
                                </span>
                                <input
                                  id="edit-image-upload"
                                  name="edit-image-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleFileSelect}
                                />
                              </label>
                              <p className="mt-1 text-xs text-gray-500">
                                {t("campaigns.imageFormats")}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadState.error && !newCampaign.image_url && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {uploadState.error}
                      </p>
                    </div>
                  )}

                  {/* Manual URL Input - only show when no image is present */}
                  {!newCampaign.image_url && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("campaigns.enterImageUrl")}
                      </label>
                      <input
                        type="url"
                        value={newCampaign.image_url}
                        onChange={(e) =>
                          handleFieldChange("image_url", e.target.value)
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: "16px", minHeight: "44px" }}
                      />
                      {validationErrors.image_url && (
                        <p className="text-xs text-red-600 mt-1">
                          {validationErrors.image_url}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {t("campaigns.imageUrlOverride")}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.date")}
                  </label>
                  <input
                    type="datetime-local"
                    value={newCampaign.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {validationErrors.date && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.location")}
                  </label>
                  <input
                    type="text"
                    value={newCampaign.location}
                    onChange={(e) =>
                      handleFieldChange("location", e.target.value)
                    }
                    placeholder={t("campaigns.locationPlaceholder")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {validationErrors.location && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("campaigns.mapLocation")}
                  </label>
                  <LocationMapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={newCampaign.latitude}
                    initialLng={newCampaign.longitude}
                  />
                  {(validationErrors.latitude ||
                    validationErrors.longitude) && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.latitude || validationErrors.longitude}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_rsvp_enabled"
                    checked={newCampaign.rsvp_enabled}
                    onChange={(e) =>
                      handleFieldChange("rsvp_enabled", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="edit_rsvp_enabled"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {t("campaigns.enableRsvp")}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                    style={{ minHeight: "44px" }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={uploadState.uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: "44px" }}
                  >
                    {uploadState.uploading
                      ? t("campaigns.uploadingImage")
                      : t("campaigns.editCampaign")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{
            marginTop: 0,
          }}
          onClick={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("campaigns.createNew")}
                </h2>
                <button
                  type="button"
                  aria-label={t("close")}
                  title={t("close")}
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.nameRequired")}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.descriptionRequired")}
                  </label>
                  <textarea
                    required
                    value={newCampaign.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px" }}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.typeRequired")}
                  </label>
                  <Select
                    value={newCampaign.type}
                    onValueChange={(value) =>
                      handleFieldChange("type", value as "event" | "promotion")
                    }
                  >
                    <SelectTrigger
                      className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ minHeight: "44px" }}
                    >
                      <SelectValue placeholder={t("campaigns.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">
                        {t("campaigns.event")}
                      </SelectItem>
                      <SelectItem value="promotion">
                        {t("campaigns.promotion")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.type && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("campaigns.image")}
                  </label>

                  {/* Image Preview or Upload Area */}
                  {newCampaign.image_url ? (
                    /* Image Preview */
                    <div className="relative">
                      <img
                        src={newCampaign.image_url}
                        alt={t("campaigns.image")}
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <div className="absolute top-2 right-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Area */
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                        dragActive
                          ? "border-blue-400 bg-blue-50"
                          : uploadState.error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="text-center">
                        {uploadState.uploading ? (
                          <div className="space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-blue-600">
                              {t("campaigns.uploadingImage")}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadState.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label
                                htmlFor="image-upload"
                                className="cursor-pointer"
                              >
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  {t("campaigns.dropImage")}{" "}
                                  <span className="text-blue-600">
                                    {t("campaigns.browse")}
                                  </span>
                                </span>
                                <input
                                  id="image-upload"
                                  name="image-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleFileSelect}
                                />
                              </label>
                              <p className="mt-1 text-xs text-gray-500">
                                {t("campaigns.imageFormats")}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadState.error && !newCampaign.image_url && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {uploadState.error}
                      </p>
                    </div>
                  )}

                  {/* Manual URL Input - only show when no image is present */}
                  {!newCampaign.image_url && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("campaigns.enterImageUrl")}
                      </label>
                      <input
                        type="url"
                        value={newCampaign.image_url}
                        onChange={(e) =>
                          handleFieldChange("image_url", e.target.value)
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ fontSize: "16px", minHeight: "44px" }}
                      />
                      {validationErrors.image_url && (
                        <p className="text-xs text-red-600 mt-1">
                          {validationErrors.image_url}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {t("campaigns.imageUrlOverride")}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.date")}
                  </label>
                  <input
                    type="datetime-local"
                    value={newCampaign.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {validationErrors.date && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("campaigns.location")}
                  </label>
                  <input
                    type="text"
                    value={newCampaign.location}
                    onChange={(e) =>
                      handleFieldChange("location", e.target.value)
                    }
                    placeholder={t("campaigns.locationPlaceholder")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {validationErrors.location && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("campaigns.mapLocation")}
                  </label>
                  <LocationMapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={newCampaign.latitude}
                    initialLng={newCampaign.longitude}
                  />
                  {(validationErrors.latitude ||
                    validationErrors.longitude) && (
                    <p className="text-xs text-red-600 mt-1">
                      {validationErrors.latitude || validationErrors.longitude}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rsvp_enabled"
                    checked={newCampaign.rsvp_enabled}
                    onChange={(e) =>
                      handleFieldChange("rsvp_enabled", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="rsvp_enabled"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {t("campaigns.enableRsvp")}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                    style={{ minHeight: "44px" }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={uploadState.uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: "44px" }}
                  >
                    {uploadState.uploading
                      ? t("campaigns.uploadingImage")
                      : t("campaigns.createCampaign")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && campaignToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={cancelDeleteCampaign}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("campaigns.deleteConfirmTitle")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("campaigns.deleteConfirmMessage", {
                  name:
                    campaigns.find((c) => c.id === campaignToDelete)?.name ||
                    campaignToDelete,
                })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteCampaign}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteCampaign}
                  className="flex-1"
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;
