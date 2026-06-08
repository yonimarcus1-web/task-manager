import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT * FROM findings WHERE project_id = ${id} ORDER BY found_date DESC, created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { title, description, priority, assigned_to, found_date } = await req.json();
  const [row] = await sql`
    INSERT INTO findings (project_id, title, description, priority, assigned_to, found_date)
    VALUES (${id}, ${title}, ${description}, ${priority ?? 'medium'}, ${assigned_to}, ${found_date || null})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
