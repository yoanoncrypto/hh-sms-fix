export interface User {
  phone_number?: string;
  id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  country: string;
  status: "active" | "inactive" | "blocked";
  createdAt: Date;
  lastContactedAt?: Date;
}

export interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    phone: string;
    username?: string;
    error: string;
  }>;
  created: number;
  updated: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: "sms" | "email";
  subject?: string;
  content: string;
  variables: string[];
}

export interface BulkMessage {
  id: string;
  type: "sms" | "email";
  templateId: string;
  recipients: string[];
  status: "pending" | "sending" | "completed" | "failed";
  sentCount: number;
  totalCount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  user_id: string;
  status: "sent" | "viewed" | "accepted" | "declined";
  viewed_at?: string;
  responded_at?: string;
  unique_token: string;
  created_at: string;
  user?: User;
}

export interface Campaign {
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

export interface Country {
  code: string;
  name: string;
  flag: string;
}
