import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('collaboration Realtime authorization migration', () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260728000001_collab_realtime_authorization.sql'
    ),
    'utf8'
  )

  it('adds a durable capability key and rotates it at authorization boundaries', () => {
    expect(sql).toMatch(
      /add\s+column\s+if\s+not\s+exists\s+realtime_key\s+uuid\s+not\s+null\s+default\s+gen_random_uuid\(\)/i
    )
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.rotate_collab_realtime_key\(\)[\s\S]*?new\.participants\s+is\s+distinct\s+from\s+old\.participants[\s\S]*?new\.status\s+is\s+distinct\s+from\s+old\.status[\s\S]*?new\.realtime_key\s*:=\s*gen_random_uuid\(\)/i
    )
    expect(sql).toMatch(
      /drop\s+trigger\s+if\s+exists\s+rotate_collab_realtime_key_on_membership[\s\S]*?create\s+trigger\s+rotate_collab_realtime_key_on_membership\s+before\s+update\s+of\s+participants,\s*status/i
    )
  })

  it('is rerunnable after either a complete or partial application', () => {
    expect(sql).toMatch(
      /add\s+column\s+if\s+not\s+exists\s+realtime_key/i
    )
    expect(sql.match(/create\s+or\s+replace\s+function/gi)).toHaveLength(2)
    expect(sql).toMatch(
      /drop\s+trigger\s+if\s+exists\s+rotate_collab_realtime_key_on_membership/i
    )
    expect(sql).toMatch(
      /drop\s+policy\s+if\s+exists\s+"Pairy collab members can receive realtime"/i
    )
    expect(sql).toMatch(
      /drop\s+policy\s+if\s+exists\s+"Pairy collab members can send realtime"/i
    )
    expect(sql.trimStart()).toMatch(/^--[\s\S]*?\bbegin;/i)
    expect(sql.trimEnd()).toMatch(/\bcommit;[\s\S]*$/i)
  })

  it('allows only private broadcast reads on the id-and-key topic', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Pairy collab members can receive realtime"[\s\S]*?for\s+select\s+to\s+authenticated/i
    )
    expect(sql).toMatch(
      /realtime\.messages\.extension\s*=\s*'broadcast'/i
    )
    expect(sql).toMatch(
      /'collab-yjs:'::text[\s\S]*?session\.id::text[\s\S]*?session\.realtime_key::text[\s\S]*?realtime\.topic\(\)/i
    )
    expect(sql).not.toMatch(
      /create\s+policy[\s\S]*?for\s+insert\s+to\s+authenticated/i
    )
  })

  it('revalidates active membership on every server-side broadcast', () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.broadcast_collab_message\s*\(\s*p_session_id\s+uuid,\s*p_realtime_key\s+uuid,\s*p_event\s+text,\s*p_payload\s+jsonb\s*\)[\s\S]*?security\s+definer[\s\S]*?set\s+search_path\s*=\s*pg_catalog/i
    )
    expect(sql).toMatch(
      /session\.id\s*=\s*p_session_id[\s\S]*?session\.realtime_key\s*=\s*p_realtime_key[\s\S]*?session\.status\s+in\s*\(\s*'waiting',\s*'active'\s*\)[\s\S]*?session\.expires_at\s*>\s*now\(\)/i
    )
    expect(sql).toMatch(
      /session\.host_id\s*=\s*v_uid[\s\S]*?session\.participants[\s\S]*?jsonb_build_object\(\s*'id',\s*v_uid::text\s*\)/i
    )
  })

  it('rejects unsafe events and payloads, then overwrites the sender identity', () => {
    expect(sql).toMatch(
      /p_event\s+not\s+in\s*\(\s*'yjs-update',\s*'awareness-update',\s*'request-state',\s*'state-response'\s*\)/i
    )
    expect(sql).toMatch(
      /jsonb_typeof\(p_payload\)\s*<>\s*'object'/i
    )
    expect(sql).toMatch(
      /p_payload\s*\|\|\s*jsonb_build_object\(\s*'userId',\s*v_uid::text\s*\)/i
    )
    expect(sql).toMatch(
      /octet_length\(v_payload::text\)[\s\S]*?v_payload_size\s*>\s*262144/i
    )
  })

  it('sends only private database broadcasts and exposes only the guarded RPC', () => {
    expect(sql).toMatch(
      /perform\s+realtime\.send\s*\(\s*v_payload,\s*p_event,[\s\S]*?p_session_id::text[\s\S]*?v_current_key::text,\s*true\s*\)/i
    )
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.broadcast_collab_message\s*\([\s\S]*?\)\s+from\s+public/i
    )
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.broadcast_collab_message\s*\([\s\S]*?\)\s+from\s+anon/i
    )
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.broadcast_collab_message\s*\([\s\S]*?\)\s+to\s+authenticated/i
    )
  })
})
