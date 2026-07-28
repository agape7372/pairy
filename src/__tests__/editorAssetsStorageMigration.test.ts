import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('editor assets storage migration', () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260728000002_editor_assets_storage.sql'
    ),
    'utf8'
  )

  it('keeps public URL delivery without exposing storage object listings', () => {
    expect(sql).toMatch(
      /values\s*\(\s*'editor-assets',\s*'editor-assets',\s*true,/i
    )
    expect(sql).toContain(
      'drop policy if exists "editor assets public read" on storage.objects;'
    )
    expect(sql).not.toMatch(
      /create\s+policy\s+"editor assets public read"/i
    )
  })

  it('retains owner-scoped mutations', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"editor assets owner read metadata"[\s\S]*?for\s+select\s+to\s+authenticated[\s\S]*?owner_id\s*=\s*\(select auth\.uid\(\)\)::text[\s\S]*?\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i
    )
    expect(sql).toMatch(
      /create\s+policy\s+"editor assets owner insert"[\s\S]*?for\s+insert\s+to\s+authenticated[\s\S]*?\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i
    )
    expect(sql).toMatch(
      /create\s+policy\s+"editor assets owner delete"[\s\S]*?for\s+delete\s+to\s+authenticated[\s\S]*?owner_id\s*=\s*\(select auth\.uid\(\)\)::text[\s\S]*?\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i
    )
  })
})
