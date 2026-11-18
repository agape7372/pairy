import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// 어뷰징 점검 후속(2026-11-18) 마이그레이션 회귀: 문면이 풀리면 실패한다.
// 주석(되돌리기 SQL 예시 포함)은 빼고 실행되는 문장만 본다.
const sql = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '20260729000001_abuse_hardening_1118.sql'),
  'utf8'
)
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

describe('abuse hardening migration 20260729000001', () => {
  it('결제 부여 함수는 anon·authenticated 직접 EXECUTE 를 회수하고 service_role 에만 준다', () => {
    for (const sig of ['grant_subscription\\(uuid, integer\\)', 'confirm_payment_and_grant\\(uuid, text\\)']) {
      expect(sql).toMatch(
        new RegExp(`revoke all on function public\\.${sig}\\s+from public, anon, authenticated;`)
      )
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${sig}\\s+to service_role;`))
      expect(sql).not.toMatch(
        new RegExp(`^\\s*grant execute on function public\\.${sig}\\s+to[^;]*(anon|authenticated)`, 'm')
      )
    }
  })

  it('works select 정책은 public 만, unlisted 는 RPC 로만', () => {
    expect(sql).toMatch(
      /create policy "Shared works are viewable by everyone" on public\.works\s+for select using \(share_status = 'public'\);/
    )
    expect(sql).toMatch(
      /create or replace function public\.get_shared_work\(p_share_id text\)[\s\S]*?security definer[\s\S]*?set search_path = public[\s\S]*?where share_id = p_share_id[\s\S]*?limit 1;/
    )
    expect(sql).toMatch(/grant execute on function public\.get_shared_work\(text\) to anon, authenticated;/)
  })

  it('works·templates 버킷 쓰기는 첫 폴더 = auth.uid()', () => {
    for (const name of ['works owner write', 'works owner update', 'templates owner write']) {
      expect(sql).toMatch(
        new RegExp(`create policy "${name}"[\\s\\S]*?\\(storage\\.foldername\\(name\\)\\)\\[1\\] = \\(select auth\\.uid\\(\\)\\)::text`)
      )
    }
    // 종전의 무조건 쓰기 정책은 지워진다
    expect(sql).toContain('drop policy if exists "works auth write" on storage.objects;')
    expect(sql).toContain('drop policy if exists "works auth update" on storage.objects;')
    expect(sql).toContain('drop policy if exists "templates auth write" on storage.objects;')
    expect(sql).not.toMatch(/create policy "(works|templates) auth /)
  })

  it('resources 버킷에 크기·MIME 상한, 실행 파일·HTML·SVG 는 허용 목록에 없다', () => {
    expect(sql).toMatch(/update storage\.buckets[\s\S]*?file_size_limit = 20971520[\s\S]*?allowed_mime_types = array\[/)
    const list = sql.slice(sql.indexOf('allowed_mime_types = array['), sql.indexOf("where id = 'resources'"))
    expect(list).toContain("'application/zip'")
    for (const banned of ['text/html', 'image/svg+xml', 'application/x-msdownload', 'application/octet-stream']) {
      expect(list).not.toContain(banned)
    }
  })

  it('환불 회수 RPC 는 service_role 전용', () => {
    expect(sql).toMatch(/revoke all on function public\.revoke_payment_and_grant\(text\) from public, anon, authenticated;/)
    expect(sql).toMatch(/grant execute on function public\.revoke_payment_and_grant\(text\) to service_role;/)
    expect(sql).toContain("set status = 'refunded'")
  })
})
