export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' };
  public: {
    Tables: {
      entries: {
        Row: {
          body: number;
          created_at: string;
          date: string;
          day: number;
          delight: number;
          emotions: number;
          energy: number;
          id: string;
          meaning: number;
          something_good: boolean;
          something_hard: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: number;
          created_at?: string;
          date: string;
          day: number;
          delight: number;
          emotions: number;
          energy: number;
          id?: string;
          meaning: number;
          something_good?: boolean;
          something_hard?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['entries']['Insert']>;
        Relationships: [];
      };
      notes: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['notes']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          flower_seed: string;
          name: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          flower_seed: string;
          name?: string | null;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
