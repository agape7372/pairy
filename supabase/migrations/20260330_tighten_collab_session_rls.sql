-- ============================================
-- Collab 세션 RLS 정책 강화
-- 기존: USING(true) - 모든 사용자가 모든 세션 조회 가능
-- 변경: 호스트 또는 참가자만 세션 조회 가능
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can select sessions by invite code or as host" ON collab_sessions;

-- 강화된 정책: 호스트 또는 참가자만 조회 가능
CREATE POLICY "Users can select own or participated sessions" ON collab_sessions
  FOR SELECT USING (
    (select auth.uid()) = host_id
    OR participants @> jsonb_build_array(jsonb_build_object('id', (select auth.uid())::text))
  );

-- 초대 코드로 세션 조회를 위한 보안 함수 (RLS 우회)
-- 인증되지 않은 사용자도 초대 코드로 세션에 참여할 수 있도록 함
CREATE OR REPLACE FUNCTION lookup_session_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  invite_code TEXT,
  status collab_status,
  max_participants INTEGER,
  host_id UUID,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.invite_code, s.status, s.max_participants, s.host_id, s.created_at, s.expires_at
  FROM collab_sessions s
  WHERE s.invite_code = code
    AND s.status IN ('waiting', 'active')
    AND s.expires_at > NOW();
$$;
