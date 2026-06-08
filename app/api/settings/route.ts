import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT key, value FROM settings`;
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${String(value)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
  return NextResponse.json({ ok: true });
}
