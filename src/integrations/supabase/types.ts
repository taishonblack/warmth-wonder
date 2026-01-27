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
      markets: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          hours: string | null
          id: string
          is_open: boolean
          lat: number
          lng: number
          name: string
          phone: string | null
          state: string
          type: string
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          is_open?: boolean
          lat: number
          lng: number
          name: string
          phone?: string | null
          state?: string
          type?: string
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          is_open?: boolean
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          state?: string
          type?: string
          updated_at?: string
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
          market_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_name?: string
          user_id?: string
        }
        Relationships: []
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
