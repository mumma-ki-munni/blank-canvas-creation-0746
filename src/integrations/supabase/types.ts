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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          body: Json
          created_at: string
          edited_at: string | null
          id: string
          notepad_id: string
          response_to_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          body: Json
          created_at?: string
          edited_at?: string | null
          id?: string
          notepad_id: string
          response_to_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          body?: Json
          created_at?: string
          edited_at?: string | null
          id?: string
          notepad_id?: string
          response_to_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_notepad_id_fkey"
            columns: ["notepad_id"]
            isOneToOne: false
            referencedRelation: "notepads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_response_to_id_fkey"
            columns: ["response_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_threads: {
        Row: {
          anchor_data: Json
          anchor_type: string
          created_at: string
          id: string
          notepad_id: string
          resolved_at: string | null
        }
        Insert: {
          anchor_data: Json
          anchor_type: string
          created_at?: string
          id?: string
          notepad_id: string
          resolved_at?: string | null
        }
        Update: {
          anchor_data?: Json
          anchor_type?: string
          created_at?: string
          id?: string
          notepad_id?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_threads_notepad_id_fkey"
            columns: ["notepad_id"]
            isOneToOne: false
            referencedRelation: "notepads"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: Json
          created_at: string
          edited_at: string | null
          id: string
          thread_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          body: Json
          created_at?: string
          edited_at?: string | null
          id?: string
          thread_id: string
          user_id: string
          user_name: string
        }
        Update: {
          body?: Json
          created_at?: string
          edited_at?: string | null
          id?: string
          thread_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "comment_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      note_tags: {
        Row: {
          created_at: string
          notepad_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          notepad_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          notepad_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_notepad_id_fkey"
            columns: ["notepad_id"]
            isOneToOne: false
            referencedRelation: "notepads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notepad_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          notepad_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          notepad_id: string
          role: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          notepad_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "notepad_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notepad_invites_notepad_id_fkey"
            columns: ["notepad_id"]
            isOneToOne: false
            referencedRelation: "notepads"
            referencedColumns: ["id"]
          },
        ]
      }
      notepad_members: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          notepad_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          notepad_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          notepad_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notepad_members_notepad_id_fkey"
            columns: ["notepad_id"]
            isOneToOne: false
            referencedRelation: "notepads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notepad_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notepad_updates: {
        Row: {
          created_at: string
          id: number
          notepad_id: string
          update: string
        }
        Insert: {
          created_at?: string
          id?: never
          notepad_id: string
          update: string
        }
        Update: {
          created_at?: string
          id?: never
          notepad_id?: string
          update?: string
        }
        Relationships: [
          {
            foreignKeyName: "notepad_updates_notepad_id_fkey"
            columns: ["notepad_id"]
            isOneToOne: false
            referencedRelation: "notepads"
            referencedColumns: ["id"]
          },
        ]
      }
      notepads: {
        Row: {
          allow_guest_access: boolean
          content: Json
          created_at: string
          deleted_at: string | null
          folder_id: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_guest_access?: boolean
          content?: Json
          created_at?: string
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          allow_guest_access?: boolean
          content?: Json
          created_at?: string
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notepads_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
        }
        Insert: {
          avatar_color?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
        }
        Update: {
          avatar_color?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
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
    Enums: {},
  },
} as const
