import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL environment variable. Please check your .env file."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file."
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(
    "Invalid VITE_SUPABASE_URL format. Please ensure it's a valid URL."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone_number: string;
          email: string | null;
          name: string | null;
          country: string | null;
          status: "active" | "inactive" | "blocked";
          created_at: string;
          last_contacted_at: string | null;
        };
        Insert: {
          id?: string;
          phone_number: string;
          email?: string | null;
          name?: string | null;
          country?: string | null;
          status?: "active" | "inactive" | "blocked";
          created_at?: string;
          last_contacted_at?: string | null;
        };
        Update: {
          id?: string;
          phone_number?: string;
          email?: string | null;
          name?: string | null;
          country?: string | null;
          status?: "active" | "inactive" | "blocked";
          created_at?: string;
          last_contacted_at?: string | null;
        };
      };
      message_templates: {
        Row: {
          id: string;
          short_id: string;
          name: string;
          type: "sms" | "email";
          subject: string | null;
          content: string;
          variables: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          short_id: string;
          name: string;
          type: "sms" | "email";
          subject?: string | null;
          content: string;
          variables?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          name?: string;
          type?: "sms" | "email";
          subject?: string | null;
          content?: string;
          variables?: string[];
          created_at?: string;
        };
      };
      bulk_messages: {
        Row: {
          id: string;
          type: "sms" | "email";
          template_id: string | null;
          subject: string | null;
          content: string;
          recipient_count: number;
          sent_count: number;
          status: "pending" | "sending" | "completed" | "failed";
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          type: "sms" | "email";
          template_id?: string | null;
          subject?: string | null;
          content: string;
          recipient_count: number;
          sent_count?: number;
          status?: "pending" | "sending" | "completed" | "failed";
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          type?: "sms" | "email";
          template_id?: string | null;
          subject?: string | null;
          content?: string;
          recipient_count?: number;
          sent_count?: number;
          status?: "pending" | "sending" | "completed" | "failed";
          created_at?: string;
          completed_at?: string | null;
        };
      };
      campaigns: {
        Row: {
          id: string;
          short_id: string;
          name: string;
          description: string;
          image_url: string | null;
          date: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          rsvp_enabled: boolean;
          type: "event" | "promotion";
          created_at: string;
        };
        Insert: {
          id?: string;
          short_id: string;
          name: string;
          description: string;
          image_url?: string | null;
          date?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rsvp_enabled?: boolean;
          type: "event" | "promotion";
          created_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          name?: string;
          description?: string;
          image_url?: string | null;
          date?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rsvp_enabled?: boolean;
          type?: "event" | "promotion";
          created_at?: string;
        };
      };
    };
  };
};
