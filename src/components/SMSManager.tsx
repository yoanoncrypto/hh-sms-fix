import {
  AlertCircle,
  CheckCircle,
  History,
  MessageSquare,
  Search,
  Send,
  TestTube,
  Users,
  X
} from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSMS } from "../hooks/useSMS";
import { useTemplates } from "../hooks/useTemplates";
import { useUsers } from "../hooks/useUsers";
import { supabase } from "../lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: "event" | "promotion";
  created_at: string;
  image_url?: string | null;
}

interface SendResult {
  success: boolean;
  error?: string;
  sentCount?: number;
  cost?: number;
  errors?: string[];
  invalidNumbers?: Array<{
    submitted_number: string;
    message: string;
  }>;
}

interface RecentSMSCampaign {
  id: string;
  type: string;
  recipient_count: number;
  sent_count: number;
  status: string;
  created_at: string;
  campaign_id?: string;
  campaigns?: {
    name: string;
  } | null;
}

interface RawSMSCampaign {
  id: string;
  type: string;
  recipient_count: number;
  sent_count: number;
  status: string;
  created_at: string;
  campaign_id?: string;
  campaigns?:
    | {
        name: string;
      }[]
    | null;
}

const SMSManager: React.FC = () => {
  const { t } = useTranslation();
  const { templates } = useTemplates();
  const { allUsers: users } = useUsers();
  const { sendSMS, testSMS, sending, progress } = useSMS();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sender] = useState("1511");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [recentSMSCampaigns, setRecentSMSCampaigns] = useState<
    RecentSMSCampaign[]
  >([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Fetch campaigns on component mount
  React.useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("id, name, description, type, created_at, image_url")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
  }, []);

  // Fetch recent SMS campaigns
  React.useEffect(() => {
    const fetchRecentSMSCampaigns = async () => {
      try {
        setLoadingRecent(true);
        const { data, error } = await supabase
          .from("bulk_messages")
          .select(
            `
            id,
            type,
            recipient_count,
            sent_count,
            status,
            created_at,
            campaign_id,
            campaigns(name)
          `
          )
          .eq("type", "sms")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // Transform the data to match our interface
        const transformedData: RecentSMSCampaign[] = (data || []).map(
          (item: RawSMSCampaign) => ({
            id: item.id,
            type: item.type,
            recipient_count: item.recipient_count,
            sent_count: item.sent_count,
            status: item.status,
            created_at: item.created_at,
            campaign_id: item.campaign_id,
            campaigns:
              item.campaigns && item.campaigns.length > 0
                ? { name: item.campaigns[0].name }
                : null
          })
        );

        setRecentSMSCampaigns(transformedData);
      } catch (error) {
        console.error("Error fetching recent SMS campaigns:", error);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecentSMSCampaigns();
  }, [sendResult]); // Refresh when a new SMS is sent

  const smsTemplates = templates.filter((t) => t.type === "sms");
  const activeUsersWithPhones = users.filter(
    (u) =>
      u.status === "active" &&
      u.phoneNumber &&
      u.phoneNumber.trim() &&
      u.phoneNumber !== "null" &&
      u.phoneNumber !== "undefined"
  );

  // Filter users based on search term
  const filteredUsersWithPhones = activeUsersWithPhones.filter((user) => {
    if (!userSearchTerm.trim()) return true;

    const searchLower = userSearchTerm.toLowerCase();
    const name = user.name || "";
    const phone = user.phoneNumber || "";
    const email = user.email || "";

    return (
      name.toLowerCase().includes(searchLower) ||
      phone.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  });

  const getRecipientCount = () => {
    switch (recipientFilter) {
      case "selected":
        return selectedUserIds.length;
      case "filtered":
        return filteredUsersWithPhones.length;
      default:
        return filteredUsersWithPhones.length;
    }
  };

  const recipientCount = getRecipientCount();

  const getCurrentMessage = () => {
    if (selectedTemplate) {
      const template = smsTemplates.find((t) => t.id === selectedTemplate);
      return template?.content || "";
    }
    return customMessage;
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredUsersWithPhones.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsersWithPhones.map((u) => u.id));
    }
  };

  const handleSend = async () => {
    const message = getCurrentMessage();
    if (!message.trim() || recipientCount === 0) return;

    setSendResult(null);

    // Get recipient phone numbers based on selection
    let recipients: string[] = [];

    switch (recipientFilter) {
      case "selected":
        recipients = filteredUsersWithPhones
          .filter((user) => selectedUserIds.includes(user.id))
          .map((user) => user.phoneNumber)
          .filter(
            (phone) =>
              phone && phone.trim() && phone !== "null" && phone !== "undefined"
          );
        break;
      case "filtered":
        recipients = filteredUsersWithPhones
          .map((user) => user.phoneNumber)
          .filter(
            (phone) =>
              phone && phone.trim() && phone !== "null" && phone !== "undefined"
          );
        break;
      default: // 'all'
        recipients = filteredUsersWithPhones
          .map((user) => user.phoneNumber)
          .filter(
            (phone) =>
              phone && phone.trim() && phone !== "null" && phone !== "undefined"
          );
        break;
    }

    if (recipients.length === 0) {
      setSendResult({
        success: false,
        error: t("sms.noValidRecipients")
      });
      return;
    }

    try {
      const smsFunction = isTestMode ? testSMS : sendSMS;
      const result = await smsFunction({
        recipients,
        message: message.trim(),
        sender: sender.trim() || "BulkComm",
        campaignId: selectedCampaign || undefined
      });

      setSendResult(result);

      // Clear message if successful and not in test mode
      if (result.success && !isTestMode) {
        setSelectedTemplate("");
        setCustomMessage("");
      }
    } catch (error) {
      console.error("SMS sending error:", error);
      setSendResult({
        success: false,
        error: error instanceof Error ? error.message : t("sms.smsSendError")
      });
    }
  };

  const messageLength = getCurrentMessage().length;
  const smsCount = Math.ceil(messageLength / 160);
  const estimatedCost = (recipientCount * 0.1).toFixed(2);

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
          {t("sms.title")}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              isTestMode
                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            <TestTube className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {isTestMode ? t("sms.testModeOn") : t("sms.testModeOff")}
            </span>
            <span className="sm:hidden">
              {isTestMode ? t("sms.testOn") : t("sms.testOff")}
            </span>
          </button>
        </div>
      </div>

      {/* Test Mode Notice */}
      {isTestMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <TestTube className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">
                {t("sms.testModeActive")}
              </h4>
              <p className="text-sm text-yellow-800 mt-1">
                {t("sms.testModeDescription")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Message Composer */}
        <div className="xl:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {t("sms.composeSms")}
            </h3>

            {/* Campaign Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("sms.linkToCampaign")}
              </label>
              <Select
                value={selectedCampaign || "none"}
                onValueChange={(v) =>
                  setSelectedCampaign(v === "none" ? "" : v)
                }
              >
                <SelectTrigger className="w-full px-3 h-16 sm:h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base overflow-hidden">
                  {(() => {
                    const sel = campaigns.find(
                      (c) => c.id === selectedCampaign
                    );
                    if (!sel) {
                      return (
                        <span className="text-gray-500">
                          {t("sms.noCampaignLink")}
                        </span>
                      );
                    }
                    return (
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-12 h-16 sm:w-16 sm:h-20 rounded-md overflow-hidden p-1 flex-shrink-0">
                          {sel.image_url ? (
                            <img
                              src={sel.image_url}
                              alt="campaign"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </span>
                        <span className="flex-1 truncate min-w-0">
                          {sel.name} ({sel.type})
                        </span>
                      </div>
                    );
                  })()}
                </SelectTrigger>
                <SelectContent className="w-[calc(100vw-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] sm:max-w-none max-h-[400px] overflow-auto">
                  <SelectItem value="none">
                    {t("sms.noCampaignLink")}
                  </SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-12 h-16 sm:w-16 sm:h-20 rounded-md overflow-hidden flex-shrink-0">
                          {campaign.image_url ? (
                            <img
                              src={campaign.image_url}
                              alt="campaign"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </span>
                        <span className="flex-1 truncate min-w-0">
                          {campaign.name} ({campaign.type})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCampaign && (
                <p className="text-xs text-blue-600 mt-1">
                  {t("sms.campaignLinkDescription")}
                </p>
              )}
            </div>

            {/* Message Input */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedTemplate ? t("sms.templatePreview") : t("sms.message")}
              </label>
              <textarea
                value={getCurrentMessage()}
                onChange={(e) =>
                  !selectedTemplate && setCustomMessage(e.target.value)
                }
                placeholder={t("sms.messagePlaceholder")}
                rows={4}
                disabled={!!selectedTemplate}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm sm:text-base resize-y"
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1">
                <span className="text-xs text-gray-500">
                  {t("sms.charactersCount", { length: messageLength })}
                </span>
                <span
                  className={`text-xs ${
                    messageLength > 160 ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {t("sms.smsPartsCount", { count: smsCount })}
                </span>
              </div>

              {/* Link Placeholder Info */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-blue-900">
                      {t("sms.dynamicLinkTitle")}
                    </h4>
                    <p className="text-sm text-blue-800 mt-1">
                      {t("sms.dynamicLinkDescription")}
                    </p>
                    <p className="text-xs text-blue-700 mt-2 break-words">
                      {t("sms.dynamicLinkExample")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Variables */}
            {selectedTemplate && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  {t("sms.availableVariables")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {smsTemplates
                    .find((t) => t.id === selectedTemplate)
                    ?.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Recipient Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("sms.recipients")}
              </label>
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="all-users"
                    name="recipients"
                    value="all"
                    checked={recipientFilter === "all"}
                    onChange={(e) => setRecipientFilter(e.target.value)}
                    className="mr-3 mt-1"
                  />
                  <label
                    htmlFor="all-users"
                    className="text-sm text-gray-700 flex-1"
                  >
                    {t("sms.allActiveUsers", {
                      count: filteredUsersWithPhones.length
                    })}
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="selected-users"
                    name="recipients"
                    value="selected"
                    checked={recipientFilter === "selected"}
                    onChange={(e) => setRecipientFilter(e.target.value)}
                    className="mr-3 mt-1"
                  />
                  <label
                    htmlFor="selected-users"
                    className="text-sm text-gray-700 flex-1"
                  >
                    {t("sms.selectedUsers", { count: selectedUserIds.length })}
                  </label>
                </div>
              </div>

              {/* User Selection List */}
              {recipientFilter === "selected" && (
                <div className="mt-4 border border-gray-200 rounded-lg">
                  {/* Search Input */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder={t("sms.searchUsersPlaceholder")}
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {userSearchTerm && (
                        <button
                          onClick={() => setUserSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {userSearchTerm && (
                      <p className="text-xs text-gray-600 mt-1">
                        {t("sms.foundUsersMatching", {
                          count: filteredUsersWithPhones.length,
                          searchTerm: userSearchTerm
                        })}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t("sms.selectUsers")}
                    </span>
                    <button
                      onClick={handleSelectAllUsers}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded self-start sm:self-auto"
                    >
                      {selectedUserIds.length === filteredUsersWithPhones.length
                        ? t("users.deselectAll")
                        : t("users.selectAll", {
                            count: filteredUsersWithPhones.length
                          })}
                    </button>
                  </div>
                  <div className="p-2 space-y-1 max-h-48 sm:max-h-64 overflow-y-auto">
                    {filteredUsersWithPhones.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {userSearchTerm
                            ? t("sms.noUsersFound")
                            : t("sms.noUsersAvailable")}
                        </p>
                      </div>
                    ) : (
                      filteredUsersWithPhones.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center p-2 sm:p-3 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(e) =>
                              handleUserSelection(user.id, e.target.checked)
                            }
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.name || t("users.noName")}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.phoneNumber}
                              {user.email && (
                                <span className="ml-2">• {user.email}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={
                sending || !getCurrentMessage().trim() || recipientCount === 0
              }
              className={`w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                isTestMode
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">
                    {isTestMode
                      ? t("sms.testingSms", { progress })
                      : t("sms.sendingSms", { progress })}
                  </span>
                  <span className="sm:hidden">
                    {isTestMode
                      ? t("sms.testing", { progress })
                      : t("sms.sending", { progress })}
                  </span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {isTestMode
                      ? t("sms.testSms", { count: recipientCount })
                      : t("sms.sendSms", { count: recipientCount })}
                  </span>
                  <span className="sm:hidden">
                    {isTestMode
                      ? t("sms.test", { count: recipientCount })
                      : t("sms.send", { count: recipientCount })}
                  </span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {sending && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isTestMode ? "bg-yellow-600" : "bg-blue-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Send Result */}
            {sendResult && (
              <div
                className={`mt-4 p-3 sm:p-4 rounded-lg ${
                  sendResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-start">
                  {sendResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium ${
                        sendResult.success ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {sendResult.success
                        ? isTestMode
                          ? t("sms.smsTestSuccessful")
                          : t("sms.smsSentSuccessfully")
                        : t("sms.smsSendingFailed")}
                    </h4>
                    {/* <p
                      className={`text-sm mt-1 ${
                        sendResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {sendResult.success
                        ? `${
                            isTestMode
                              ? t("sms.testValidated")
                              : t("sms.successfullySent")
                          } ${sendResult.sentCount || recipientCount} ${t(
                            "sms.smsPartsCount",
                            { count: sendResult.sentCount || recipientCount }
                          )}${
                            sendResult.cost
                              ? ` ${t("sms.costInfo", {
                                  cost: sendResult.cost.toFixed(4),
                                })}`
                              : ""
                          }.`
                        : sendResult.error || t("sms.smsSendError")}
                    </p> */}
                    {sendResult.errors && sendResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-red-700 font-medium">
                          {t("sms.individualErrors")}
                        </p>
                        <ul className="text-xs text-red-600 mt-1 max-h-20 overflow-y-auto">
                          {sendResult.errors
                            .slice(0, 5)
                            .map((error: string, index: number) => (
                              <li key={index}>• {error}</li>
                            ))}
                          {sendResult.errors.length > 5 && (
                            <li>
                              •{" "}
                              {t("sms.moreErrors", {
                                count: sendResult.errors.length - 5
                              })}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    {sendResult.invalidNumbers &&
                      sendResult.invalidNumbers.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-700 font-medium">
                            {t("sms.invalidNumbers")}
                          </p>
                          <ul className="text-xs text-red-600 mt-1">
                            {sendResult.invalidNumbers.map(
                              (invalid, index: number) => (
                                <li key={index}>
                                  • {invalid.submitted_number}:{" "}
                                  {invalid.message}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {t("sms.smsStats")}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    {t("sms.recipients")}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {recipientCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    {t("sms.estimatedCost")}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {t("sms.costAmount", { cost: estimatedCost })}
                </span>
              </div>
            </div>
          </div>

          {/* SMS Guidelines */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {t("sms.smsBestPractices")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• {t("sms.keepUnder160")}</li>
              <li>• {t("sms.useLink")}</li>
              <li>• {t("sms.includeOptOut")}</li>
              <li>• {t("sms.personalizeVariables")}</li>
              <li>• {t("sms.testBeforeSend")}</li>
              <li>• {t("sms.monitorDelivery")}</li>
              <li>• {t("sms.clearSender")}</li>
              <li>• {t("sms.respectTimeZones")}</li>
              <li>• {t("sms.complyRegulations")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent SMS Campaigns */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center">
            <History className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t("sms.recentSmsCampaigns")}
            </h3>
          </div>
        </div>

        {loadingRecent ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-600">{t("sms.loadingRecent")}</span>
          </div>
        ) : recentSMSCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {t("sms.noSmsCampaigns")}
            </h4>
            <p className="text-gray-600">{t("sms.noSmsCampaignsSubtitle")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                {/* Mobile-first responsive table */}
                <div className="block lg:hidden">
                  <div className="space-y-4">
                    {recentSMSCampaigns.map((campaign) => {
                      const unsuccessful =
                        campaign.recipient_count - campaign.sent_count;
                      const successRate =
                        campaign.recipient_count > 0
                          ? (
                              (campaign.sent_count / campaign.recipient_count) *
                              100
                            ).toFixed(1)
                          : "0";

                      return (
                        <div
                          key={campaign.id}
                          className="bg-gray-50 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 break-words">
                                {campaign.campaign_id &&
                                campaign.campaigns?.name
                                  ? campaign.campaigns.name
                                  : t("sms.directSms")}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  campaign.created_at
                                ).toLocaleDateString()}{" "}
                                • {t("sms.successRate", { rate: successRate })}
                              </p>
                            </div>
                            <span
                              className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                                campaign.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : campaign.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : campaign.status === "sending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {campaign.status === "completed"
                                ? t("sms.completed")
                                : campaign.status === "failed"
                                ? t("sms.failed")
                                : campaign.status === "sending"
                                ? t("sms.sendingStatus")
                                : campaign.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {campaign.recipient_count.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t("sms.sent")}
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-green-600">
                                {campaign.sent_count.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t("sms.successful")} ({successRate}%)
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-red-600">
                                {unsuccessful.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t("sms.unsuccessful")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop table */}
                <table className="hidden lg:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("sms.campaignName")}
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("sms.sent")}
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("sms.successful")}
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("sms.unsuccessful")}
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("sms.status")}
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("sms.date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSMSCampaigns.map((campaign) => {
                      const unsuccessful =
                        campaign.recipient_count - campaign.sent_count;
                      const successRate =
                        campaign.recipient_count > 0
                          ? (
                              (campaign.sent_count / campaign.recipient_count) *
                              100
                            ).toFixed(1)
                          : "0";

                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {campaign.campaign_id &&
                                campaign.campaigns?.name
                                  ? campaign.campaigns.name
                                  : t("sms.directSms")}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div className="text-sm text-gray-900 font-medium">
                              {campaign.recipient_count.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-green-600">
                                {campaign.sent_count.toLocaleString()}
                              </div>
                              <div className="ml-2 text-xs text-gray-500">
                                ({successRate}%)
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <div className="text-sm font-medium text-red-600">
                              {unsuccessful.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                campaign.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : campaign.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : campaign.status === "sending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {campaign.status === "completed"
                                ? t("sms.completed")
                                : campaign.status === "failed"
                                ? t("sms.failed")
                                : campaign.status === "sending"
                                ? t("sms.sendingStatus")
                                : campaign.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                            <div>
                              <div>
                                {new Date(
                                  campaign.created_at
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(
                                  campaign.created_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSManager;
