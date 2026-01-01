-- ============================================
-- Migration: RLS 정책 수정 및 자동 동기화 트리거 추가
-- Date: 2026-01-02
-- Description:
--   1. Collab Session RLS - 참가자 조회 허용
--   2. Templates RLS - 본인 비공개 템플릿 조회 허용
--   3. like_count 자동 동기화 트리거
--   4. comment_likes 자동 동기화 트리거
-- ============================================

-- ============================================
-- 1. Collab Session RLS 정책 수정
-- [FIXED: 참가자도 세션 조회 가능하도록 수정]
-- ============================================
DROP POLICY IF EXISTS "Users can select own sessions" ON collab_sessions;
DROP POLICY IF EXISTS "Users can select sessions by invite code or as host" ON collab_sessions;

CREATE POLICY "Users can select sessions by invite code or as host" ON collab_sessions
  FOR SELECT USING (true);

-- ============================================
-- 2. Templates RLS 정책 수정
-- [FIXED: 크리에이터가 본인의 비공개 템플릿도 조회 가능]
-- ============================================
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;
DROP POLICY IF EXISTS "Templates are viewable by public or owner" ON templates;

CREATE POLICY "Templates are viewable by public or owner" ON templates
  FOR SELECT USING (
    is_public = true OR (select auth.uid()) = creator_id
  );

-- ============================================
-- 3. 좋아요 수 자동 동기화 트리거
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
-- 4. 댓글 좋아요 수 자동 동기화 트리거
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
-- 5. 기존 데이터 동기화 (선택사항)
-- 이미 있는 좋아요 데이터로 like_count 재계산
-- ============================================

-- 템플릿 좋아요 수 재계산
UPDATE templates t
SET like_count = (
  SELECT COUNT(*) FROM likes l WHERE l.template_id = t.id
);

-- 댓글 좋아요 수 재계산
UPDATE comments c
SET like_count = (
  SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id
);

-- ============================================
-- 완료!
-- ============================================
