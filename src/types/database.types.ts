export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_creator: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_creator?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_creator?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          preview_url: string
          editor_data: Json
          participant_count: number
          is_public: boolean
          is_premium: boolean
          price: number
          like_count: number
          use_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          preview_url: string
          editor_data: Json
          participant_count?: number
          is_public?: boolean
          is_premium?: boolean
          price?: number
          like_count?: number
          use_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          preview_url?: string
          editor_data?: Json
          participant_count?: number
          is_public?: boolean
          is_premium?: boolean
          price?: number
          like_count?: number
          use_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      template_tags: {
        Row: {
          template_id: string
          tag_id: string
        }
        Insert: {
          template_id: string
          tag_id: string
        }
        Update: {
          template_id?: string
          tag_id?: string
        }
      }
      likes: {
        Row: {
          user_id: string
          template_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          template_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          template_id?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          user_id: string
          template_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          template_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          template_id?: string
          created_at?: string
        }
      }
      works: {
        Row: {
          id: string
          user_id: string
          template_id: string
          title: string
          editor_data: Json
          thumbnail_url: string | null
          is_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          title: string
          editor_data: Json
          thumbnail_url?: string | null
          is_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          title?: string
          editor_data?: Json
          thumbnail_url?: string | null
          is_complete?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Work = Database['public']['Tables']['works']['Row']

// Extended types with relations
export type TemplateWithTags = Template & {
  tags: Tag[]
  creator: Profile
}
