export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      finds: {
        Row: {
          caption: string
          created_at: string
          id: string
          images: string[]
          location_lat: number | null
          location_lng: number | null
          market_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption: string
          created_at?: string
          id?: string
          images?: string[]
          location_lat?: number | null
          location_lng?: number | null
          market_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          images?: string[]
          location_lat?: number | null
          location_lng?: number | null
          market_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      market_verifications: {
        Row: {
          created_at: string
          field_name: string
          field_value: string
          id: string
          market_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_value: string
          id?: string
          market_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_value?: string
          id?: string
          market_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_verifications_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          address: string
          city: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          gluten_free: boolean | null
          hours: string | null
          id: string
          is_open: boolean
          lat: number
          lng: number
          name: string
          organic: boolean | null
          osm_source_id: string | null
          phone: string | null
          state: string
          type: string
          updated_at: string
          vegan_friendly: boolean | null
          verification_count: number | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          city: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          gluten_free?: boolean | null
          hours?: string | null
          id?: string
          is_open?: boolean
          lat: number
          lng: number
          name: string
          organic?: boolean | null
          osm_source_id?: string | null
          phone?: string | null
          state?: string
          type?: string
          updated_at?: string
          vegan_friendly?: boolean | null
          verification_count?: number | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          gluten_free?: boolean | null
          hours?: string | null
          id?: string
          is_open?: boolean
          lat?: number
          lng?: number
          name?: string
          organic?: boolean | null
          osm_source_id?: string | null
          phone?: string | null
          state?: string
          type?: string
          updated_at?: string
          vegan_friendly?: boolean | null
          verification_count?: number | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          find_id: string | null
          id: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          find_id?: string | null
          id?: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          find_id?: string | null
          id?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_find_id_fkey"
            columns: ["find_id"]
            isOneToOne: false
            referencedRelation: "finds"
            referencedColumns: ["id"]
          },
        ]
      }
      osm_cache: {
        Row: {
          cache_key: string
          center_lat: number
          center_lng: number
          created_at: string | null
          id: number
          radius_m: number
          response_json: Json
        }
        Insert: {
          cache_key: string
          center_lat: number
          center_lng: number
          created_at?: string | null
          id?: number
          radius_m: number
          response_json: Json
        }
        Update: {
          cache_key?: string
          center_lat?: number
          center_lng?: number
          created_at?: string | null
          id?: number
          radius_m?: number
          response_json?: Json
        }
        Relationships: []
      }
      preferred_markets: {
        Row: {
          created_at: string
          id: string
          market_id: string | null
          market_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_id?: string | null
          market_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string | null
          market_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferred_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          display_name: string | null
          id: string
          radius_miles: number | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          radius_miles?: number | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          radius_miles?: number | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          market_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          market_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          market_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      thanks: {
        Row: {
          created_at: string
          find_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          find_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          find_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thanks_find_id_fkey"
            columns: ["find_id"]
            isOneToOne: false
            referencedRelation: "finds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
