export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_winner_settings: {
        Row: {
          created_at: string
          game_id: string
          id: string
          prize_type: Database["public"]["Enums"]["prize_type"]
          ticket_number: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          prize_type: Database["public"]["Enums"]["prize_type"]
          ticket_number: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          prize_type?: Database["public"]["Enums"]["prize_type"]
          ticket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_winner_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_at: string
          game_id: string
          id: string
          player_name: string
          player_phone: string | null
          ticket_id: number
        }
        Insert: {
          booked_at?: string
          game_id: string
          id?: string
          player_name: string
          player_phone?: string | null
          ticket_id: number
        }
        Update: {
          booked_at?: string
          game_id?: string
          id?: string
          player_name?: string
          player_phone?: string | null
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          current_number: number | null
          ended_at: string | null
          host_id: string
          host_phone: string | null
          id: string
          max_tickets: number | null
          number_calling_delay: number | null
          numbers_called: number[] | null
          selected_prizes: string[] | null
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          ticket_set: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_number?: number | null
          ended_at?: string | null
          host_id: string
          host_phone?: string | null
          id?: string
          max_tickets?: number | null
          number_calling_delay?: number | null
          numbers_called?: number[] | null
          selected_prizes?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          ticket_set?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_number?: number | null
          ended_at?: string | null
          host_id?: string
          host_phone?: string | null
          id?: string
          max_tickets?: number | null
          number_calling_delay?: number | null
          numbers_called?: number[] | null
          selected_prizes?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
          ticket_set?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          subscription_expires_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          subscription_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          subscription_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string
          id: number
          numbers: number[]
          row1: number[]
          row2: number[]
          row3: number[]
          ticket_number: number
        }
        Insert: {
          created_at?: string
          id?: number
          numbers: number[]
          row1: number[]
          row2: number[]
          row3: number[]
          ticket_number: number
        }
        Update: {
          created_at?: string
          id?: number
          numbers?: number[]
          row1?: number[]
          row2?: number[]
          row3?: number[]
          ticket_number?: number
        }
        Relationships: []
      }
      winners: {
        Row: {
          claimed_at: string | null
          created_at: string
          game_id: string
          id: string
          prize_type: Database["public"]["Enums"]["prize_type"]
          ticket_id: number
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          game_id: string
          id?: string
          prize_type: Database["public"]["Enums"]["prize_type"]
          ticket_id: number
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          game_id?: string
          id?: string
          prize_type?: Database["public"]["Enums"]["prize_type"]
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "winners_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
      game_status: "waiting" | "active" | "paused" | "ended"
      prize_type:
        | "top_line"
        | "middle_line"
        | "bottom_line"
        | "full_house"
        | "early_five"
        | "corners"
        | "half_sheet"
        | "full_sheet"
      user_role: "host" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      game_status: ["waiting", "active", "paused", "ended"],
      prize_type: [
        "top_line",
        "middle_line",
        "bottom_line",
        "full_house",
        "early_five",
        "corners",
        "half_sheet",
        "full_sheet",
      ],
      user_role: ["host", "admin"],
    },
  },
} as const
