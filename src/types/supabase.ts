// ✅ Supabase TypeScript Definitions
// Make sure this file is located at: src/types/supabase.ts
// This ensures proper typing for your Supabase client everywhere in the app.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ✅ Main database type definition
export type Database = {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          title: string;
          location: string | null;
          basePrice: number | null;
          type: string | null;
          state: string | null;
          city: string | null;
          zip: string | null;
          description: string | null;
          address_line1: string | null;
          address_line2: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          pickup_instructions: string | null;
          demo_mode: boolean | null;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          location?: string | null;
          basePrice?: number | null;
          type?: string | null;
          state?: string | null;
          city?: string | null;
          zip?: string | null;
          description?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          pickup_instructions?: string | null;
          demo_mode?: boolean | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };

      profiles: {
        Row: {
          id: string;
          email: string | null;
          is_subscribed: boolean | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          is_subscribed?: boolean | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      bookings: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          amount_paid: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          amount_paid: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
    };
  };
};
