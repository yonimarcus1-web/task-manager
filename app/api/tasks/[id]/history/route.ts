import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM task_history WHERE task_id = ${id} ORDER BY created_at DESC LIMIT 100
  `;
  return NextResponse.json(rows);
}
