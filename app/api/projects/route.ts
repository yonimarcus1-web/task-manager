import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const projects = await sql`
    SELECT p.*,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND parent_id IS NULL)::int AS task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done' AND parent_id IS NULL)::int AS done_count,
      (SELECT COUNT(*) FROM findings WHERE project_id = p.id AND status = 'open')::int AS open_findings,
      (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE project_id = p.id AND type = 'income') AS total_income,
      (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE project_id = p.id AND type = 'expense') AS total_expense
    FROM projects p ORDER BY p.created_at DESC
  `;
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { name, description, status, location, developer, start_date, end_date } = await req.json();
  const [project] = await sql`
    INSERT INTO projects (name, description, status, location, developer, start_date, end_date)
    VALUES (${name}, ${description}, ${status ?? 'active'}, ${location}, ${developer}, ${start_date || null}, ${end_date || null})
    RETURNING *
  `;
  return NextResponse.json(project, { status: 201 });
}
