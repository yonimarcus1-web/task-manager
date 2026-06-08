import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT * FROM task_comments WHERE task_id = ${id} ORDER BY created_at ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { content, user_name } = await req.json();
  const [row] = await sql`
    INSERT INTO task_comments (task_id, content, user_name)
    VALUES (${id}, ${content}, ${user_name ?? 'מנהל'}) RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { comment_id } = await req.json();
  await sql`DELETE FROM task_comments WHERE id = ${comment_id} AND task_id = ${id}`;
  return NextResponse.json({ ok: true });
}
