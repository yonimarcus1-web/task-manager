import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { title, description, status, priority, assigned_to, found_date, resolved_date } = await req.json();
  const [row] = await sql`
    UPDATE findings SET title=${title}, description=${description}, status=${status},
    priority=${priority}, assigned_to=${assigned_to}, found_date=${found_date || null},
    resolved_date=${resolved_date || null} WHERE id=${id} RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM findings WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
