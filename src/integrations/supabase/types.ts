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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_access: {
        Row: {
          active_device: string | null
          active_label: string | null
          last_payment_ref: string | null
          paid_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_device?: string | null
          active_label?: string | null
          last_payment_ref?: string | null
          paid_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_device?: string | null
          active_label?: string | null
          last_payment_ref?: string | null
          paid_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          reason: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          reason?: string
        }
        Relationships: []
      }
      app_sessions: {
        Row: {
          id: string
          last_seen: string
          started_at: string
          user_id: string
        }
        Insert: {
          id: string
          last_seen?: string
          started_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          category: string
          created_at: string
          done: boolean
          duration_minutes: number
          household_task: boolean
          id: string
          location: string | null
          notes: string | null
          repeat_daily: boolean
          starts_at: string
          task_kind: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          done?: boolean
          duration_minutes?: number
          household_task?: boolean
          id?: string
          location?: string | null
          notes?: string | null
          repeat_daily?: boolean
          starts_at: string
          task_kind?: string | null
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          done?: boolean
          duration_minutes?: number
          household_task?: boolean
          id?: string
          location?: string | null
          notes?: string | null
          repeat_daily?: boolean
          starts_at?: string
          task_kind?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      camera_invitations: {
        Row: {
          created_at: string
          end_time: string
          id: string
          owner_email: string
          owner_id: string | null
          start_time: string
          status: string
          viewer_id: string
          viewer_name: string
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          owner_email: string
          owner_id?: string | null
          start_time?: string
          status?: string
          viewer_id?: string
          viewer_name: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          owner_email?: string
          owner_id?: string | null
          start_time?: string
          status?: string
          viewer_id?: string
          viewer_name?: string
        }
        Relationships: []
      }
      camera_signals: {
        Row: {
          created_at: string
          id: string
          invitation_id: string
          kind: string
          payload: Json
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_id: string
          kind: string
          payload?: Json
          sender_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_id?: string
          kind?: string
          payload?: Json
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camera_signals_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "camera_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: Json
          user_id?: string
        }
        Relationships: []
      }
      community_photos: {
        Row: {
          approved_at: string | null
          caption: string | null
          category: string
          created_at: string
          first_name: string
          id: string
          recipe_key: string
          recipe_markdown: string | null
          recipe_title: string
          share_consent: boolean
          status: string
          storage_path: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          caption?: string | null
          category?: string
          created_at?: string
          first_name?: string
          id?: string
          recipe_key: string
          recipe_markdown?: string | null
          recipe_title: string
          share_consent?: boolean
          status?: string
          storage_path: string
          user_id?: string
        }
        Update: {
          approved_at?: string | null
          caption?: string | null
          category?: string
          created_at?: string
          first_name?: string
          id?: string
          recipe_key?: string
          recipe_markdown?: string | null
          recipe_title?: string
          share_consent?: boolean
          status?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_admin: {
        Row: {
          canceled_at: string | null
          gift_sent: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          gift_sent?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          gift_sent?: boolean
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_events: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      device_switches: {
        Row: {
          created_at: string
          email: string | null
          id: string
          new_device: string
          new_label: string | null
          old_device: string | null
          old_label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          new_device: string
          new_label?: string | null
          old_device?: string | null
          old_label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          new_device?: string
          new_label?: string | null
          old_device?: string | null
          old_label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dietary_restrictions: {
        Row: {
          notes: string | null
          preference: string | null
          restrictions: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          notes?: string | null
          preference?: string | null
          restrictions?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          notes?: string | null
          preference?: string | null
          restrictions?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          camera_allowed: boolean
          created_at: string
          email: string
          id: string
          name: string
          owner_id: string
          relation: string | null
        }
        Insert: {
          camera_allowed?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          owner_id?: string
          relation?: string | null
        }
        Update: {
          camera_allowed?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          owner_id?: string
          relation?: string | null
        }
        Relationships: []
      }
      household_preferences: {
        Row: {
          blocked_dates: string[]
          daily_minutes: number
          end_hour: number
          start_hour: number
          user_id: string
        }
        Insert: {
          blocked_dates?: string[]
          daily_minutes?: number
          end_hour?: number
          start_hour?: number
          user_id?: string
        }
        Update: {
          blocked_dates?: string[]
          daily_minutes?: number
          end_hour?: number
          start_hour?: number
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          charge_id: string
          id: string
          paid_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          charge_id: string
          id?: string
          paid_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          charge_id?: string
          id?: string
          paid_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          category: string
          created_at: string
          id: string
          level: string | null
          markdown: string
          minutes: number | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          level?: string | null
          markdown: string
          minutes?: number | null
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          level?: string | null
          markdown?: string
          minutes?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          checked: boolean
          created_at: string
          estimated_price: number | null
          id: string
          name: string
          quantity: string | null
          sector: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          estimated_price?: number | null
          id?: string
          name: string
          quantity?: string | null
          sector?: string
          user_id?: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          estimated_price?: number | null
          id?: string
          name?: string
          quantity?: string | null
          sector?: string
          user_id?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          source: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          source?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          source?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      access_status: { Args: { _device: string }; Returns: string }
      admin_approve_photo: {
        Args: { _caption: string; _id: string }
        Returns: undefined
      }
      admin_cancel_subscription: { Args: { _user: string }; Returns: undefined }
      admin_grant_access: {
        Args: { _days: number; _user: string }
        Returns: undefined
      }
      admin_set_gift: {
        Args: { _notes: string; _sent: boolean; _user: string }
        Returns: undefined
      }
      app_heartbeat: { Args: { _session: string }; Returns: undefined }
      camera_allowed: { Args: { invitation: string }; Returns: boolean }
      camera_decide: {
        Args: {
          allowed_end?: string
          allowed_start?: string
          decision: string
          invitation: string
        }
        Returns: undefined
      }
      claim_device: { Args: { _device: string }; Returns: undefined }
      claim_device_first: {
        Args: { _device: string; _label: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_attempt: {
        Args: { _email: string; _reason: string }
        Returns: undefined
      }
      switch_device: {
        Args: { _device: string; _label: string }
        Returns: string
      }
      track_visit: {
        Args: { _path: string; _source: string; _visitor: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
