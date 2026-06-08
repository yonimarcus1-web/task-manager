import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT * FROM contractors WHERE project_id = ${id} ORDER BY name`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { name, company, role, phone, email, notes } = await req.json();
  const [row] = await sql`
    INSERT INTO contractors (project_id, name, company, role, phone, email, notes)
    VALUES (${id}, ${name}, ${company}, ${role}, ${phone}, ${email}, ${notes})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
