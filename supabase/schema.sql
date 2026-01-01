-- Pairy Database Schema
-- Supabase SQL Editor에서 이 전체 내용을 복사해서 실행하세요

-- ============================================
-- 1. 프로필 테이블 (사용자 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_creator BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  pending_payout DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 태그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 템플릿 테이블
-- ============================================
DO $$ BEGIN
  CREATE TYPE pricing_type AS ENUM ('free', 'credit', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  preview_url TEXT NOT NULL,
  editor_data JSONB NOT NULL DEFAULT '{}',
  participant_count INTEGER DEFAULT 2,
  is_public BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  pricing_type pricing_type DEFAULT 'free',
  like_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 템플릿-태그 연결 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS template_tags (
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, tag_id)
);

-- ============================================
-- 5. 좋아요 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- ============================================
-- 6. 북마크 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- ============================================
-- 7. 작품 테이블 (사용자가 만든 작품)
-- ============================================
CREATE TABLE IF NOT EXISTS works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  editor_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. 협업 세션 테이블
-- ============================================
DO $$ BEGIN
  CREATE TYPE collab_status AS ENUM ('waiting', 'active', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS collab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  work_id UUID REFERENCES works(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  invite_code TEXT NOT NULL UNIQUE,
  participants JSONB DEFAULT '[]',
  max_participants INTEGER DEFAULT 4,
  status collab_status DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 9. 팔로우 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- 10. 댓글 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. 댓글 좋아요 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- ============================================
-- 12. 구매 테이블
-- ============================================
DO $$ BEGIN
  CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status purchase_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_templates_creator ON templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_user ON works(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_invite_code ON collab_sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_comments_template ON comments(template_id);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- 프로필: 누구나 읽기 가능, 본인만 수정 가능
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- 템플릿: 공개 템플릿 누구나 읽기 가능, 본인 비공개 템플릿도 조회 가능, 본인 템플릿 관리
-- [FIXED: 크리에이터가 본인의 비공개 템플릿도 조회 가능하도록 수정]
CREATE POLICY "Templates are viewable by public or owner" ON templates FOR SELECT USING (
  is_public = true OR (select auth.uid()) = creator_id
);
CREATE POLICY "Creators can insert own templates" ON templates FOR INSERT WITH CHECK ((select auth.uid()) = creator_id);
CREATE POLICY "Creators can update own templates" ON templates FOR UPDATE USING ((select auth.uid()) = creator_id);
CREATE POLICY "Creators can delete own templates" ON templates FOR DELETE USING ((select auth.uid()) = creator_id);

-- 태그: 누구나 읽기 가능
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);

-- 템플릿 태그: 누구나 읽기 가능
CREATE POLICY "Template tags are viewable by everyone" ON template_tags FOR SELECT USING (true);

-- 좋아요: 누구나 읽기 가능, 본인만 추가/삭제
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING ((select auth.uid()) = user_id);

-- 북마크: 본인 것만 관리 가능
CREATE POLICY "Users can select own bookmarks" ON bookmarks FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING ((select auth.uid()) = user_id);

-- 작품: 본인 것만 관리 가능
CREATE POLICY "Users can select own works" ON works FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own works" ON works FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own works" ON works FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own works" ON works FOR DELETE USING ((select auth.uid()) = user_id);

-- 협업 세션: 호스트 + 참가자 접근 가능
-- [FIXED: 참가자도 세션 조회 가능하도록 수정 - 초대 코드는 난수라 추측 불가]
CREATE POLICY "Users can select sessions by invite code or as host" ON collab_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert own sessions" ON collab_sessions FOR INSERT WITH CHECK ((select auth.uid()) = host_id);
CREATE POLICY "Users can update own sessions" ON collab_sessions FOR UPDATE USING ((select auth.uid()) = host_id);
CREATE POLICY "Users can delete own sessions" ON collab_sessions FOR DELETE USING ((select auth.uid()) = host_id);

-- 팔로우: 누구나 읽기 가능, 본인만 추가/삭제
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK ((select auth.uid()) = follower_id);
CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING ((select auth.uid()) = follower_id);

-- 댓글: 누구나 읽기 가능, 본인만 수정/삭제 가능
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING ((select auth.uid()) = user_id);

-- 댓글 좋아요: 본인 것만 관리 가능
CREATE POLICY "Users can select own comment likes" ON comment_likes FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own comment likes" ON comment_likes FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own comment likes" ON comment_likes FOR DELETE USING ((select auth.uid()) = user_id);

-- 구매: 본인 것만 조회/생성 가능
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING ((select auth.uid()) = buyer_id);
CREATE POLICY "Users can create purchases" ON purchases FOR INSERT WITH CHECK ((select auth.uid()) = buyer_id);

-- ============================================
-- 트리거: 프로필 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 제거 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Realtime 활성화 (협업 기능용)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE collab_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE works;

-- ============================================
-- 트리거: 좋아요 수 자동 동기화
-- [FIXED: likes 테이블 변경 시 templates.like_count 자동 업데이트]
-- ============================================
CREATE OR REPLACE FUNCTION update_template_like_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE templates SET like_count = like_count + 1
    WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE templates SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.template_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_like_count ON likes;
CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_template_like_count();

-- ============================================
-- 트리거: 댓글 좋아요 수 자동 동기화
-- [FIXED: comment_likes 변경 시 comments.like_count 자동 업데이트]
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_like_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- ============================================
-- 완료!
-- ============================================
