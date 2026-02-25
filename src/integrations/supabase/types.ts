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
      chart_analyses: {
        Row: {
          analysis_result: string | null
          analysis_type: string | null
          birth_data: Json
          chart_data: Json
          chart_hash: string
          created_at: string | null
          id: string
          payment_id: string | null
          user_id: string
        }
        Insert: {
          analysis_result?: string | null
          analysis_type?: string | null
          birth_data: Json
          chart_data: Json
          chart_hash: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          user_id: string
        }
        Update: {
          analysis_result?: string | null
          analysis_type?: string | null
          birth_data?: Json
          chart_data?: Json
          chart_hash?: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_analyses_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_checks: {
        Row: {
          chi_1: string
          chi_2: string
          created_at: string | null
          id: string
          level: string | null
          result: Json | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          chi_1: string
          chi_2: string
          created_at?: string | null
          id?: string
          level?: string | null
          result?: Json | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          chi_1?: string
          chi_2?: string
          created_at?: string | null
          id?: string
          level?: string | null
          result?: Json | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      day_analyses: {
        Row: {
          analysis: Json | null
          created_at: string | null
          day_quality: string | null
          id: string
          lunar_date: Json | null
          solar_date: string
          user_id: string | null
        }
        Insert: {
          analysis?: Json | null
          created_at?: string | null
          day_quality?: string | null
          id?: string
          lunar_date?: Json | null
          solar_date: string
          user_id?: string | null
        }
        Update: {
          analysis?: Json | null
          created_at?: string | null
          day_quality?: string | null
          id?: string
          lunar_date?: Json | null
          solar_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "day_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      minted_nfts: {
        Row: {
          birth_data_hash: string
          chart_data: Json | null
          created_at: string | null
          id: string
          image_uri: string | null
          metadata_uri: string
          session_id: string | null
          token_id: number
          tx_hash: string
          wallet_address: string
        }
        Insert: {
          birth_data_hash: string
          chart_data?: Json | null
          created_at?: string | null
          id?: string
          image_uri?: string | null
          metadata_uri: string
          session_id?: string | null
          token_id: number
          tx_hash: string
          wallet_address: string
        }
        Update: {
          birth_data_hash?: string
          chart_data?: Json | null
          created_at?: string | null
          id?: string
          image_uri?: string | null
          metadata_uri?: string
          session_id?: string | null
          token_id?: number
          tx_hash?: string
          wallet_address?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          feature_unlocked: string | null
          id: string
          notes: string | null
          payment_type: string | null
          plan: string
          status: string | null
          transaction_id: string | null
          transfer_content: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          feature_unlocked?: string | null
          id?: string
          notes?: string | null
          payment_type?: string | null
          plan: string
          status?: string | null
          transaction_id?: string | null
          transfer_content?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          feature_unlocked?: string | null
          id?: string
          notes?: string | null
          payment_type?: string | null
          plan?: string
          status?: string | null
          transaction_id?: string | null
          transfer_content?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      pending_mints: {
        Row: {
          birth_data: Json
          chart_data: Json
          created_at: string | null
          expires_at: string | null
          id: string
          metadata_uri: string | null
          payment_status: string | null
          session_id: string
          stripe_session_id: string | null
          token_id: number | null
          tx_hash: string | null
          wallet_address: string
        }
        Insert: {
          birth_data: Json
          chart_data: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata_uri?: string | null
          payment_status?: string | null
          session_id: string
          stripe_session_id?: string | null
          token_id?: number | null
          tx_hash?: string | null
          wallet_address: string
        }
        Update: {
          birth_data?: Json
          chart_data?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata_uri?: string | null
          payment_status?: string | null
          session_id?: string
          stripe_session_id?: string | null
          token_id?: number | null
          tx_hash?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_premium: boolean | null
          premium_expires_at: string | null
          premium_plan: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_premium?: boolean | null
          premium_expires_at?: string | null
          premium_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_premium?: boolean | null
          premium_expires_at?: string | null
          premium_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tuvi_readings: {
        Row: {
          birth_date: string
          birth_hour: number
          can_nam: string | null
          chart_data: Json | null
          chi_nam: string | null
          created_at: string | null
          cuc_so: number | null
          cung_menh: number | null
          cung_than: number | null
          gender: string
          id: string
          interpretation: Json | null
          lunar_day: number | null
          lunar_month: number | null
          lunar_year: number | null
          nap_am: string | null
          ngu_hanh: string | null
          shared: boolean | null
          user_id: string | null
        }
        Insert: {
          birth_date: string
          birth_hour: number
          can_nam?: string | null
          chart_data?: Json | null
          chi_nam?: string | null
          created_at?: string | null
          cuc_so?: number | null
          cung_menh?: number | null
          cung_than?: number | null
          gender: string
          id?: string
          interpretation?: Json | null
          lunar_day?: number | null
          lunar_month?: number | null
          lunar_year?: number | null
          nap_am?: string | null
          ngu_hanh?: string | null
          shared?: boolean | null
          user_id?: string | null
        }
        Update: {
          birth_date?: string
          birth_hour?: number
          can_nam?: string | null
          chart_data?: Json | null
          chi_nam?: string | null
          created_at?: string | null
          cuc_so?: number | null
          cung_menh?: number | null
          cung_than?: number | null
          gender?: string
          id?: string
          interpretation?: Json | null
          lunar_day?: number | null
          lunar_month?: number | null
          lunar_year?: number | null
          nap_am?: string | null
          ngu_hanh?: string | null
          shared?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tuvi_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_features: {
        Row: {
          expires_at: string | null
          feature: string
          id: string
          payment_ref: string | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          feature: string
          id?: string
          payment_ref?: string | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          feature?: string
          id?: string
          payment_ref?: string | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          birth_date: string | null
          birth_hour: number | null
          created_at: string | null
          display_name: string | null
          email: string | null
          gender: string | null
          id: string
          is_premium: boolean | null
          readings_count: number | null
          zodiac_chi: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_hour?: number | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_premium?: boolean | null
          readings_count?: number | null
          zodiac_chi?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_hour?: number | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_premium?: boolean | null
          readings_count?: number | null
          zodiac_chi?: string | null
        }
        Relationships: []
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
