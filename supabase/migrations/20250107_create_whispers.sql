-- ============================================
-- Sprint 35: Whisper(위스퍼) 시스템 테이블
-- 크리에이터가 구독자에게 보내는 은밀한 선물과 메시지
-- ============================================

-- Enum 타입 생성
CREATE TYPE whisper_type AS ENUM ('GIFT', 'NOTICE', 'SECRET_EVENT');
CREATE TYPE whisper_status AS ENUM ('PENDING', 'SENT', 'READ', 'CLAIMED', 'EXPIRED');
CREATE TYPE whisper_theme AS ENUM ('NIGHT', 'LOVE', 'GOLDEN', 'MYSTIC', 'SPRING');

-- Whispers 테이블
CREATE TABLE IF NOT EXISTS public.whispers (
  -- 기본 필드
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 발신자/수신자
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 위스퍼 정보
  whisper_type whisper_type NOT NULL DEFAULT 'GIFT',
  status whisper_status NOT NULL DEFAULT 'PENDING',
  theme whisper_theme NOT NULL DEFAULT 'NIGHT',

  -- 페이로드 (메시지, 선물 데이터 등)
  payload JSONB NOT NULL DEFAULT '{"message": ""}',

  -- 시간 관련
  scheduled_at TIMESTAMPTZ, -- 예약 발송 시간 (NULL이면 즉시)
  sent_at TIMESTAMPTZ, -- 실제 발송 시간
  read_at TIMESTAMPTZ, -- 읽은 시간
  claimed_at TIMESTAMPTZ, -- 선물 수령 시간
  expires_at TIMESTAMPTZ, -- 만료 시간 (선택)

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 제약 조건
  CONSTRAINT sender_not_receiver CHECK (sender_id != receiver_id),
  CONSTRAINT valid_payload CHECK (jsonb_typeof(payload) = 'object')
);

-- 인덱스
CREATE INDEX idx_whispers_receiver_id ON public.whispers(receiver_id);
CREATE INDEX idx_whispers_sender_id ON public.whispers(sender_id);
CREATE INDEX idx_whispers_status ON public.whispers(status);
CREATE INDEX idx_whispers_scheduled_at ON public.whispers(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_whispers_receiver_unread ON public.whispers(receiver_id)
  WHERE status IN ('SENT', 'READ') AND read_at IS NULL;

-- Updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_whispers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whispers_updated_at_trigger
  BEFORE UPDATE ON public.whispers
  FOR EACH ROW
  EXECUTE FUNCTION update_whispers_updated_at();

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;

-- 수신자는 자신의 위스퍼만 조회 가능
CREATE POLICY "수신자는 자신의 위스퍼 조회 가능"
  ON public.whispers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = receiver_id
    AND status != 'PENDING' -- 예약 대기 중인 건 보이지 않음
  );

-- 발신자(크리에이터)는 자신이 보낸 위스퍼 조회 가능
CREATE POLICY "발신자는 자신이 보낸 위스퍼 조회 가능"
  ON public.whispers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

-- 크리에이터만 위스퍼 생성 가능 (profiles.is_creator 체크)
CREATE POLICY "크리에이터만 위스퍼 생성 가능"
  ON public.whispers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_creator = true
    )
  );

-- 수신자는 자신의 위스퍼 상태 업데이트 가능 (읽음, 수령)
CREATE POLICY "수신자는 위스퍼 상태 업데이트 가능"
  ON public.whispers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id
    -- 상태 변경 제한: SENT -> READ -> CLAIMED만 가능
    AND (
      (status = 'READ' AND read_at IS NOT NULL)
      OR (status = 'CLAIMED' AND claimed_at IS NOT NULL)
    )
  );

-- 발신자는 예약 대기 중인 위스퍼만 삭제/수정 가능
CREATE POLICY "발신자는 대기중 위스퍼 수정 가능"
  ON public.whispers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = sender_id
    AND status = 'PENDING'
  );

CREATE POLICY "발신자는 대기중 위스퍼 삭제 가능"
  ON public.whispers
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender_id
    AND status = 'PENDING'
  );

-- ============================================
-- Realtime 구독 설정
-- ============================================

-- 위스퍼 테이블에 대한 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.whispers;

-- ============================================
-- 예약 발송을 위한 함수 (Edge Function에서 호출)
-- ============================================

CREATE OR REPLACE FUNCTION send_scheduled_whispers()
RETURNS INTEGER AS $$
DECLARE
  sent_count INTEGER;
BEGIN
  UPDATE public.whispers
  SET
    status = 'SENT',
    sent_at = now()
  WHERE
    status = 'PENDING'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();

  GET DIAGNOSTICS sent_count = ROW_COUNT;
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 미확인 위스퍼 카운트 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_unread_whisper_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.whispers
    WHERE receiver_id = user_id
      AND status = 'SENT'
      AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON TABLE public.whispers IS '크리에이터가 구독자에게 보내는 위스퍼(선물/메시지)';
COMMENT ON COLUMN public.whispers.payload IS 'JSON 구조: {message, gift?, ephemeral?, limitedQuantity?, claimedCount?}';
COMMENT ON COLUMN public.whispers.theme IS '위스퍼 카드의 시각적 테마';
COMMENT ON COLUMN public.whispers.scheduled_at IS 'NULL이면 즉시 발송, 값이 있으면 해당 시간에 발송';
