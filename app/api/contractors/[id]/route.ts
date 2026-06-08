import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { name, company, role, phone, email, notes } = await req.json();
  const [row] = await sql`
    UPDATE contractors SET name=${name}, company=${company}, role=${role},
    phone=${phone}, email=${email}, notes=${notes} WHERE id=${id} RETURNING *
  `;
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM contractors WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
