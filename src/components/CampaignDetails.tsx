import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Users,
  XCircle
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Campaign, CampaignRecipient, User } from "../types";

const CampaignDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<
    (CampaignRecipient & { user: User })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
    }
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      // Fetch campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch recipients with user details
      const { data: recipientsData, error: recipientsError } = await supabase
        .from("campaign_recipients")
        .select(
          `
          *,
          user:users(*)
        `
        )
        .eq("campaign_id", id);

      if (recipientsError) throw recipientsError;
      console.log(recipientsData);
      setRecipients(recipientsData || []);
    } catch (error) {
      console.error("Error fetching campaign details:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyPublicLink = async () => {
    if (!campaign?.short_id) {
      alert(t("campaignDetails.shortIdNotFound"));
      return;
    }

    const publicUrl = `${window.location.origin}/c/${campaign.short_id}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "viewed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4 text-green-600" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "viewed":
        return <Eye className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          {t("campaignDetails.campaignNotFound")}
        </h3>
        <p className="text-gray-600">
          {t("campaignDetails.campaignNotFoundSubtitle")}
        </p>
        <Link
          to="/admin/campaigns"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("campaignDetails.backToCampaigns")}
        </Link>
      </div>
    );
  }

  const acceptedCount = recipients.filter(
    (r) => r.status === "accepted"
  ).length;
  const declinedCount = recipients.filter(
    (r) => r.status === "declined"
  ).length;
  const viewedCount = recipients.filter((r) => r.viewed_at).length;
  const publicUrl = campaign?.short_id
    ? `${window.location.origin}/c/${campaign.short_id}`
    : null;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/campaigns"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {campaign.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t("campaignDetails.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                {t("campaignDetails.total")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {recipients.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                {t("campaignDetails.accepted")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {acceptedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                {t("campaignDetails.declined")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {declinedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                {t("campaignDetails.viewed")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {viewedCount}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Campaign Image */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("campaignDetails.campaignImage")}
        </h3>
        {campaign.image_url ? (
          <img
            src={campaign.image_url}
            alt={campaign.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">
              {t("campaignDetails.noImageUploaded")}
            </span>
          </div>
        )}
      </div>
      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("campaignDetails.campaignInformation")}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("campaigns.description")}
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {campaign.description}
              </p>
            </div>
            {campaign.date && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("campaigns.date")}
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(campaign.date).toLocaleDateString()}
                </p>
              </div>
            )}
            {campaign.location && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("campaigns.location")}
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {campaign.location}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t("campaignDetails.type")}
              </p>
              <p className="text-sm text-gray-900 mt-1 capitalize">
                {campaign.type}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("campaignDetails.publicLink")}
          </h3>
          {publicUrl ? (
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
                <button
                  onClick={copyPublicLink}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{t("copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>{t("copy")}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t("campaignDetails.openLink")}
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t("campaignDetails.publicLinkDescription")}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                {t("campaignDetails.shortIdNotAvailable")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("campaignDetails.recipientsCount", { count: recipients.length })}
        </h3>

        {recipients.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("campaignDetails.noRecipients")}
            </h3>
            <p className="text-gray-600">
              {t("campaignDetails.noRecipientsSubtitle")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile/Tablet Card View */}
            <div className="block sm:hidden">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="border-b border-gray-200 p-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {recipient.user.name || t("campaignDetails.noName")}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {recipient.user.phone_number}
                      </p>
                      {recipient.user.email && (
                        <p className="text-sm text-gray-500 truncate">
                          {recipient.user.email}
                        </p>
                      )}
                    </div>
                    <div className="ml-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          recipient.status
                        )}`}
                      >
                        {getStatusIcon(recipient.status)}
                        <span className="ml-1">{recipient.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                    {recipient.viewed_at && (
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {t("campaignDetails.viewedDate", {
                          date: new Date(
                            recipient.viewed_at
                          ).toLocaleDateString()
                        })}
                      </span>
                    )}
                    {recipient.responded_at && (
                      <span className="flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        {t("campaignDetails.respondedDate", {
                          date: new Date(
                            recipient.responded_at
                          ).toLocaleDateString()
                        })}
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
                    {t("campaignDetails.recipient")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("campaignDetails.contact")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("campaignDetails.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("campaignDetails.viewed")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("campaignDetails.responded")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {recipient.user.name || t("campaignDetails.noName")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {recipient.user.phone_number}
                      </div>
                      {recipient.user.email && (
                        <div className="text-sm text-gray-500">
                          {recipient.user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          recipient.status
                        )}`}
                      >
                        {getStatusIcon(recipient.status)}
                        <span className="ml-1">{recipient.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.viewed_at
                        ? new Date(recipient.viewed_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.responded_at
                        ? new Date(recipient.responded_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;
