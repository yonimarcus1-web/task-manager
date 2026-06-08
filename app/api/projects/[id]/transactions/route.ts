import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT * FROM transactions WHERE project_id = ${id} ORDER BY transaction_date DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const { type, amount, description, category, transaction_date } = await req.json();
  const [row] = await sql`
    INSERT INTO transactions (project_id, type, amount, description, category, transaction_date)
    VALUES (${id}, ${type}, ${amount}, ${description}, ${category}, ${transaction_date || null})
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
