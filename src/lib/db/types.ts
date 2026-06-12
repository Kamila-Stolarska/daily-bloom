export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          body: number
          created_at: string
          date: string
          day: number
          delight: number
          embedding: string | null
          embedding_source: string | null
          emotions: number
          energy: number
          id: string
          meaning: number
          search_tsv: unknown
          something_good: boolean
          something_hard: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          body: number
          created_at?: string
          date: string
          day: number
          delight: number
          embedding?: string | null
          embedding_source?: string | null
          emotions: number
          energy: number
          id?: string
          meaning: number
          search_tsv?: unknown
          something_good?: boolean
          something_hard?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: number
          created_at?: string
          date?: string
          day?: number
          delight?: number
          embedding?: string | null
          embedding_source?: string | null
          emotions?: number
          energy?: number
          id?: string
          meaning?: number
          search_tsv?: unknown
          something_good?: boolean
          something_hard?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entry_photos: {
        Row: {
          created_at: string
          date: string
          height: number | null
          id: string
          note_id: string
          order_index: number
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          date: string
          height?: number | null
          id?: string
          note_id: string
          order_index?: number
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          height?: number | null
          id?: string
          note_id?: string
          order_index?: number
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_photos_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string
          date: string
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credit_cents: number
          flower_seed: string
          name: string | null
          tokens_used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_cents?: number
          flower_seed: string
          name?: string | null
          tokens_used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credit_cents?: number
          flower_seed?: string
          name?: string | null
          tokens_used?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      hybrid_search_entries: {
        Args: {
          p_k?: number
          p_query: string
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          bm_rank: number
          body: number
          date: string
          day: number
          delight: number
          embedding_source: string
          emotions: number
          energy: number
          id: string
          meaning: number
          score: number
          something_good: boolean
          something_hard: boolean
          vec_rank: number
        }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export const Constants = {
  public: { Enums: {} },
} as const
