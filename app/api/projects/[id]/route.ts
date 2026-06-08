import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const [project] = await sql`SELECT * FROM projects WHERE id = ${id}`;
  if (!project) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { name, description, status, location, developer, start_date, end_date } = await req.json();
  const [project] = await sql`
    UPDATE projects SET name=${name}, description=${description}, status=${status},
    location=${location}, developer=${developer},
    start_date=${start_date || null}, end_date=${end_date || null}
    WHERE id=${id} RETURNING *
  `;
  return NextResponse.json(project);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
