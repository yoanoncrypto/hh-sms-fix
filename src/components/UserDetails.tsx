import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { User, Campaign, CampaignRecipient } from "../types";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Calendar,
  Users,
  MessageSquare,
  Eye,
  ExternalLink,
  Trash2,
  CheckCircle,
  AlertCircle,
  Ban,
} from "lucide-react";
import {
  validatePhoneNumber,
  normalizePhoneNumber,
  detectCountryFromPhone,
} from "../utils/phoneValidation";
import { countries } from "../data/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface UserCampaign extends CampaignRecipient {
  campaign: Campaign;
}

const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [userCampaigns, setUserCampaigns] = useState<UserCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    phoneNumber: "",
    email: "",
    name: "",
    country: "",
    status: "active" as "active" | "inactive" | "blocked",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);

      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (userError) throw userError;

      const formattedUser: User = {
        id: userData.id,
        phoneNumber: userData.phone_number,
        email: userData.email || undefined,
        name: userData.name || undefined,
        country: userData.country || "Unknown",
        status: userData.status,
        createdAt: new Date(userData.created_at),
        lastContactedAt: userData.last_contacted_at
          ? new Date(userData.last_contacted_at)
          : undefined,
      };

      setUser(formattedUser);

      // Set edit form with current user data
      setEditForm({
        phoneNumber: formattedUser.phoneNumber,
        email: formattedUser.email || "",
        name: formattedUser.name || "",
        country: formattedUser.country,
        status: formattedUser.status,
      });

      // Fetch user's campaigns
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaign_recipients")
        .select(
          `
          *,
          campaign:campaigns(*)
        `
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      if (campaignError) throw campaignError;

      setUserCampaigns(campaignData || []);
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load user details"
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!editForm.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!validatePhoneNumber(editForm.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    if (
      editForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizePhoneNumber(editForm.phoneNumber);
      const detectedCountry =
        detectCountryFromPhone(normalizedPhone) ||
        editForm.country ||
        "Unknown";

      const { data, error } = await supabase
        .from("users")
        .update({
          phone_number: normalizedPhone,
          email: editForm.email.trim() || null,
          name: editForm.name.trim() || null,
          country: detectedCountry,
          status: editForm.status,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedUser: User = {
        id: data.id,
        phoneNumber: data.phone_number,
        email: data.email || undefined,
        name: data.name || undefined,
        country: data.country || "Unknown",
        status: data.status,
        createdAt: new Date(data.created_at),
        lastContactedAt: data.last_contacted_at
          ? new Date(data.last_contacted_at)
          : undefined,
      };

      setUser(updatedUser);
      setIsEditing(false);
      setFormErrors({});
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : "Failed to update user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("users").delete().eq("id", user.id);

      if (error) throw error;

      navigate("/admin/users");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const getCountryFlag = (countryCode: string) => {
    return countries.find((c) => c.code === countryCode)?.flag || "🌍";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "blocked":
        return <Ban className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "viewed":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">{t("userDetails.loadingDetails")}</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t("userDetails.userNotFound")}
          </h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <p className="text-red-800">
            {error || t("userDetails.userNotFound")}
          </p>
          <Link
            to="/admin/users"
            className="mt-4 inline-flex items-center text-red-600 hover:text-red-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("userDetails.backToUsers")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {user.name || t("userDetails.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t("userDetails.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("userDetails.editUser")}
              </button>
              <button
                onClick={handleDeleteUser}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("delete")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveUser}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("userDetails.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("userDetails.saveChanges")}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormErrors({});
                  // Reset form to original values
                  setEditForm({
                    phoneNumber: user.phoneNumber,
                    email: user.email || "",
                    name: user.name || "",
                    country: user.country,
                    status: user.status,
                  });
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("userDetails.userInformation")}
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          {!isEditing ? (
            /* View Mode */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("users.name")}
                    </p>
                    <p className="text-sm text-gray-600 break-words">
                      {user.name || "No name provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("users.phoneNumber")}
                    </p>
                    <p className="text-sm text-gray-600 break-all">
                      {user.phoneNumber}
                    </p>
                  </div>
                </div>

                {user.email && (
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {t("users.email")}
                      </p>
                      <p className="text-sm text-gray-600 break-all">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">
                    {getCountryFlag(user.country)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("users.country")}
                    </p>
                    <p className="text-sm text-gray-600">{user.country}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(user.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("users.status")}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {getStatusIcon(user.status)}
                      <span className="ml-1">{user.status}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t("users.created")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {user.lastContactedAt && (
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {t("users.lastContacted")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {user.lastContactedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              {formErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.phoneNumber")} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.phoneNumber
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.name")}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.email")}
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    style={{ fontSize: "16px", minHeight: "44px" }}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("users.status")} *
                  </label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
                        status: value as "active" | "inactive" | "blocked",
                      })
                    }
                  >
                    <SelectTrigger
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ minHeight: "44px" }}
                    >
                      <SelectValue placeholder={t("users.selectAStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("users.active")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("users.inactive")}
                      </SelectItem>
                      <SelectItem value="blocked">
                        {t("users.blocked")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign History */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("userDetails.campaignHistory")}
          </h2>
          <span className="text-sm text-gray-600">
            {t("userDetails.campaignCount", { count: userCampaigns.length })}
          </span>
        </div>

        {userCampaigns.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("userDetails.noCampaigns")}
            </h3>
            <p className="text-gray-600">
              {t("userDetails.noCampaignsSubtitle")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile/Tablet Card View */}
            <div className="block sm:hidden">
              {userCampaigns.map((userCampaign) => (
                <div
                  key={userCampaign.id}
                  className="border-b border-gray-200 p-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {userCampaign.campaign.name}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {userCampaign.campaign.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Link
                        to={`/admin/campaigns/${userCampaign.campaign.id}`}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title={t("viewCampaign")}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {userCampaign.unique_token && (
                        <a
                          href={`${window.location.origin}/${userCampaign.unique_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 p-1"
                          title={t("viewUserCampaignLink")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userCampaign.campaign.type === "event"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {userCampaign.campaign.type}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(
                        userCampaign.status
                      )}`}
                    >
                      {userCampaign.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                    {userCampaign.campaign.date && (
                      <span>
                        Date:{" "}
                        {new Date(
                          userCampaign.campaign.date
                        ).toLocaleDateString()}
                      </span>
                    )}
                    {userCampaign.viewed_at && (
                      <span>
                        Viewed:{" "}
                        {new Date(userCampaign.viewed_at).toLocaleDateString()}
                      </span>
                    )}
                    {userCampaign.responded_at && (
                      <span>
                        Responded:{" "}
                        {new Date(
                          userCampaign.responded_at
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="w-full min-w-[640px] hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Viewed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userCampaigns.map((userCampaign) => (
                  <tr key={userCampaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userCampaign.campaign.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {userCampaign.campaign.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userCampaign.campaign.type === "event"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {userCampaign.campaign.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(
                          userCampaign.status
                        )}`}
                      >
                        {userCampaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {userCampaign.campaign.date
                        ? new Date(
                            userCampaign.campaign.date
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {userCampaign.viewed_at
                        ? new Date(userCampaign.viewed_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {userCampaign.responded_at
                        ? new Date(
                            userCampaign.responded_at
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/campaigns/${userCampaign.campaign.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View campaign"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {userCampaign.unique_token && (
                          <a
                            href={`${window.location.origin}/${userCampaign.unique_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 p-1"
                            title="View user's campaign link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{ marginTop: "0px" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("users.confirmDeletion")}
                </h2>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-800 mb-4">
                {t("users.deleteUserConfirm", {
                  name: user.name || user.phoneNumber,
                })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
