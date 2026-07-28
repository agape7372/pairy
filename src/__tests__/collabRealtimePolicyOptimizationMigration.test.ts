import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('collaboration Realtime policy optimization migration', () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260728000003_optimize_collab_realtime_authorization.sql'
    ),
    'utf8'
  )

  it('uses a stable security-definer helper with a fixed search path', () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.can_subscribe_collab_topic\s*\(\s*p_topic\s+text\s*\)[\s\S]*?returns\s+boolean[\s\S]*?stable[\s\S]*?security\s+definer[\s\S]*?set\s+search_path\s*=\s*pg_catalog/i
    )
    expect(sql).not.toMatch(
      /can_subscribe_collab_topic\s*\(\s*p_topic\s+text\s*,/i
    )
  })

  it('rejects malformed topics before casting both capability segments', () => {
    expect(sql).toMatch(
      /length\(p_topic\)\s*>\s*128[\s\S]*?left\(p_topic,\s*length\(v_prefix\)\)\s*<>\s*v_prefix/i
    )
    expect(sql).toMatch(
      /string_to_array\s*\([\s\S]*?array_length\(v_parts,\s*1\)[\s\S]*?<>\s*2/i
    )
    expect(sql).toMatch(
      /v_session_id\s*:=\s*v_parts\[1\]::uuid[\s\S]*?v_realtime_key\s*:=\s*v_parts\[2\]::uuid[\s\S]*?when\s+invalid_text_representation\s+then\s+return\s+false/i
    )
  })

  it('authorizes only the current member on the parsed id and key', () => {
    expect(sql).toMatch(
      /v_uid\s+uuid\s*:=\s*auth\.uid\(\)/i
    )
    expect(sql).toMatch(
      /from\s+public\.collab_sessions\s+as\s+session[\s\S]*?session\.id\s*=\s*v_session_id[\s\S]*?session\.realtime_key\s*=\s*v_realtime_key/i
    )
    expect(sql).toMatch(
      /session\.status\s+in\s*\(\s*'waiting',\s*'active'\s*\)[\s\S]*?session\.expires_at\s*>\s*now\(\)/i
    )
    expect(sql).toMatch(
      /session\.host_id\s*=\s*v_uid[\s\S]*?jsonb_build_object\(\s*'id',\s*v_uid::text\s*\)/i
    )
  })

  it('exposes the helper only to authenticated users', () => {
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.can_subscribe_collab_topic\(text\)\s+from\s+public/i
    )
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.can_subscribe_collab_topic\(text\)\s+from\s+anon/i
    )
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.can_subscribe_collab_topic\(text\)\s+to\s+authenticated/i
    )
  })

  it('keeps Realtime receive-only and delegates the policy check', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Pairy collab members can receive realtime"[\s\S]*?for\s+select\s+to\s+authenticated[\s\S]*?realtime\.messages\.extension\s*=\s*'broadcast'[\s\S]*?public\.can_subscribe_collab_topic\s*\([\s\S]*?realtime\.topic\(\)/i
    )
    expect(sql).not.toMatch(
      /create\s+policy[\s\S]*?for\s+insert\s+to\s+authenticated/i
    )
  })

  it('is safe to reapply after a partial attempt', () => {
    expect(sql).toMatch(
      /drop\s+policy\s+if\s+exists\s+"Pairy collab members can receive realtime"/i
    )
    expect(sql.trimStart()).toMatch(/^--[\s\S]*?\bbegin;/i)
    expect(sql.trimEnd()).toMatch(/\bcommit;$/i)
  })
})
