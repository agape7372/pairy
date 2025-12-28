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
          follower_count: number
          following_count: number
          total_earnings: number
          pending_payout: number
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
          follower_count?: number
          following_count?: number
          total_earnings?: number
          pending_payout?: number
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
          follower_count?: number
          following_count?: number
          total_earnings?: number
          pending_payout?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          pricing_type: 'free' | 'credit' | 'paid'
          like_count: number
          use_count: number
          purchase_count: number
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
          pricing_type?: 'free' | 'credit' | 'paid'
          like_count?: number
          use_count?: number
          purchase_count?: number
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
          pricing_type?: 'free' | 'credit' | 'paid'
          like_count?: number
          use_count?: number
          purchase_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      collab_sessions: {
        Row: {
          id: string
          host_id: string
          work_id: string | null
          template_id: string | null
          invite_code: string
          participants: Json
          max_participants: number
          status: 'waiting' | 'active' | 'completed' | 'expired'
          created_at: string
          expires_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          host_id: string
          work_id?: string | null
          template_id?: string | null
          invite_code: string
          participants?: Json
          max_participants?: number
          status?: 'waiting' | 'active' | 'completed' | 'expired'
          created_at?: string
          expires_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          host_id?: string
          work_id?: string | null
          template_id?: string | null
          invite_code?: string
          participants?: Json
          max_participants?: number
          status?: 'waiting' | 'active' | 'completed' | 'expired'
          created_at?: string
          expires_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          template_id: string
          user_id: string
          parent_id: string | null
          content: string
          like_count: number
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          user_id: string
          parent_id?: string | null
          content: string
          like_count?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          like_count?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          comment_id?: string
          created_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          buyer_id: string | null
          template_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id?: string | null
          template_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string | null
          template_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          created_at?: string
          updated_at?: string
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
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Work = Database['public']['Tables']['works']['Row']
export type CollabSession = Database['public']['Tables']['collab_sessions']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentLike = Database['public']['Tables']['comment_likes']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']

// Extended types with relations
export type TemplateWithTags = Template & {
  tags: Tag[]
  creator: Profile
}

// Comment with user info
export type CommentWithUser = Comment & {
  user: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
  replies?: CommentWithUser[]
  isLiked?: boolean
}
