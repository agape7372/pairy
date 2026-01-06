export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'creator' | 'admin' | 'super_admin'

// ============================================
// 캐릭터 관련 타입 정의
// ============================================

/** 캐릭터 간 관계 유형 */
export type CharacterRelationType =
  | 'lover'      // 연인
  | 'spouse'     // 배우자
  | 'crush'      // 짝사랑
  | 'friend'     // 친구
  | 'bestfriend' // 절친
  | 'rival'      // 라이벌
  | 'enemy'      // 적
  | 'sibling'    // 형제자매
  | 'parent'     // 부모
  | 'child'      // 자녀
  | 'partner'    // 파트너
  | 'mentor'     // 스승
  | 'student'    // 제자
  | 'colleague'  // 동료
  | 'other'      // 기타

/** 공유 상태 */
export type ShareStatus = 'private' | 'unlisted' | 'public'

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
          role: UserRole
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
          role?: UserRole
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
          role?: UserRole
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
      /** 캐릭터 프로필 테이블 */
      characters: {
        Row: {
          id: string
          user_id: string
          /** 캐릭터 이름 (최대 50자) */
          name: string
          /** 테마 색상 (HEX) */
          color: string
          /** 아바타 이미지 URL */
          avatar_url: string | null
          /** 캐릭터 설명/소개 */
          description: string | null
          /** 확장 메타데이터 (MBTI, 생일 등) */
          metadata: Json
          /** 세계관/그룹 분류명 */
          world_name: string | null
          /** 정렬 순서 (드래그 재정렬용) */
          sort_order: number
          /** 즐겨찾기 여부 */
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          avatar_url?: string | null
          description?: string | null
          metadata?: Json
          world_name?: string | null
          sort_order?: number
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          avatar_url?: string | null
          description?: string | null
          metadata?: Json
          world_name?: string | null
          sort_order?: number
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'characters_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      /** 캐릭터 관계 테이블 */
      character_relationships: {
        Row: {
          id: string
          user_id: string
          /** 관계의 주체 캐릭터 */
          character_a_id: string
          /** 관계의 대상 캐릭터 */
          character_b_id: string
          /** 관계 유형 */
          relation_type: CharacterRelationType
          /** 커스텀 관계 라벨 (예: "소꿉친구", "전 연인") */
          relation_label: string | null
          /** 관계 설명 */
          description: string | null
          /** 양방향 관계 여부 */
          is_mutual: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_a_id: string
          character_b_id: string
          relation_type: CharacterRelationType
          relation_label?: string | null
          description?: string | null
          is_mutual?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          character_a_id?: string
          character_b_id?: string
          relation_type?: CharacterRelationType
          relation_label?: string | null
          description?: string | null
          is_mutual?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'character_relationships_character_a_fkey'
            columns: ['character_a_id']
            referencedRelation: 'characters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'character_relationships_character_b_fkey'
            columns: ['character_b_id']
            referencedRelation: 'characters'
            referencedColumns: ['id']
          }
        ]
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
      /** 작품(작업물) 테이블 */
      works: {
        Row: {
          id: string
          user_id: string
          template_id: string
          title: string
          editor_data: Json
          thumbnail_url: string | null
          is_complete: boolean
          // === 공유 기능 필드 ===
          /** 공유 상태 */
          share_status: ShareStatus
          /** 공유용 짧은 ID (nanoid, 8자) */
          share_id: string | null
          /** OG 미리보기 이미지 URL */
          og_image_url: string | null
          /** 조회수 */
          view_count: number
          // === 캐릭터 연동 ===
          /** 작품에 사용된 캐릭터 ID 배열 */
          character_ids: Json
          // === 타임스탬프 ===
          created_at: string
          updated_at: string
          /** 공개 발행 시점 */
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          title: string
          editor_data: Json
          thumbnail_url?: string | null
          is_complete?: boolean
          share_status?: ShareStatus
          share_id?: string | null
          og_image_url?: string | null
          view_count?: number
          character_ids?: Json
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          title?: string
          editor_data?: Json
          thumbnail_url?: string | null
          is_complete?: boolean
          share_status?: ShareStatus
          share_id?: string | null
          og_image_url?: string | null
          view_count?: number
          character_ids?: Json
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'works_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'works_template_id_fkey'
            columns: ['template_id']
            referencedRelation: 'templates'
            referencedColumns: ['id']
          }
        ]
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

// ============================================
// 캐릭터 관련 헬퍼 타입
// ============================================

/** 캐릭터 기본 타입 */
export type Character = Database['public']['Tables']['characters']['Row']
export type CharacterInsert = Database['public']['Tables']['characters']['Insert']
export type CharacterUpdate = Database['public']['Tables']['characters']['Update']

/** 캐릭터 관계 타입 */
export type CharacterRelationship = Database['public']['Tables']['character_relationships']['Row']
export type CharacterRelationshipInsert = Database['public']['Tables']['character_relationships']['Insert']

/**
 * 캐릭터 메타데이터 인터페이스
 * JSON 필드로 저장되는 확장 가능한 캐릭터 정보
 */
export interface CharacterMetadata {
  /** 머리색 (HEX) */
  hairColor?: string
  /** 눈색 (HEX) */
  eyeColor?: string
  /** 메인 컬러/테마색 (HEX) */
  mainColor?: string
  /** 생일 (MM-DD 또는 YYYY-MM-DD 형식) */
  birthday?: string
  /** 키 */
  height?: string
  /** 나이/연령대 */
  age?: string
  /** 성별 */
  gender?: string
  /** 취미 목록 */
  hobbies?: string[]
  /** 성격 키워드 */
  personality?: string[]
  /** 좋아하는 것 */
  likes?: string[]
  /** 싫어하는 것 */
  dislikes?: string[]
  /** 특기 */
  specialties?: string[]
  /** 직업/역할 */
  occupation?: string
  /** 추가 커스텀 필드 */
  custom?: Record<string, string>
}

/** 관계 정보가 포함된 캐릭터 */
export type CharacterWithRelations = Character & {
  relationships: Array<{
    id: string
    relatedCharacter: Character
    relationType: CharacterRelationType
    relationLabel: string | null
    isMutual: boolean
  }>
}

/** 캐릭터 + 메타데이터 타입 가드 */
export type CharacterWithMetadata = Omit<Character, 'metadata'> & {
  metadata: CharacterMetadata
}

// ============================================
// 작품 공유 관련 헬퍼 타입
// ============================================

/** 작품 기본 타입 (확장) */
export type WorkInsert = Database['public']['Tables']['works']['Insert']
export type WorkUpdate = Database['public']['Tables']['works']['Update']

/** 공유된 작품 (사용자 정보 포함) */
export type SharedWork = Work & {
  user: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'username'>
  template: Pick<Template, 'id' | 'title' | 'preview_url'> | null
  characters?: Character[]
}

/** OG 메타데이터 인터페이스 */
export interface WorkOGMetadata {
  title: string
  description: string
  image: string
  imageWidth: number
  imageHeight: number
  url: string
  siteName: string
  type: 'article'
  author?: string
  publishedTime?: string
}

/** 공유 링크 생성 결과 */
export interface ShareLinkResult {
  success: boolean
  shareId: string | null
  shareUrl: string | null
  ogImageUrl: string | null
  error?: string
}

// ============================================
// 유효성 검증용 상수
// ============================================

/** 캐릭터 이름 최대 길이 */
export const CHARACTER_NAME_MAX_LENGTH = 50

/** 캐릭터 설명 최대 길이 */
export const CHARACTER_DESCRIPTION_MAX_LENGTH = 500

/** 세계관 이름 최대 길이 */
export const WORLD_NAME_MAX_LENGTH = 30

/** 공유 ID 길이 */
export const SHARE_ID_LENGTH = 8

/** 사용자당 최대 캐릭터 수 (무료) */
export const MAX_CHARACTERS_FREE = 10

/** 사용자당 최대 캐릭터 수 (프리미엄) */
export const MAX_CHARACTERS_PREMIUM = 100

// ============================================
// 관계 유형 라벨 매핑
// ============================================

export const RELATION_TYPE_LABELS: Record<CharacterRelationType, string> = {
  lover: '연인',
  spouse: '배우자',
  crush: '짝사랑',
  friend: '친구',
  bestfriend: '절친',
  rival: '라이벌',
  enemy: '적',
  sibling: '형제자매',
  parent: '부모',
  child: '자녀',
  partner: '파트너',
  mentor: '스승',
  student: '제자',
  colleague: '동료',
  other: '기타',
}

/** 공유 상태 라벨 매핑 */
export const SHARE_STATUS_LABELS: Record<ShareStatus, string> = {
  private: '비공개',
  unlisted: '링크 공유',
  public: '전체 공개',
}
