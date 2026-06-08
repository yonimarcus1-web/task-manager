import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) return NextResponse.json([]);
  const sql = getDb();
  const pattern = `%${q}%`;
  const results = await sql`
    SELECT t.id, t.title, t.status, t.priority, t.due_date,
           p.id as project_id, p.name as project_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.parent_id IS NULL
      AND (t.title ILIKE ${pattern} OR t.description ILIKE ${pattern} OR t.assigned_to ILIKE ${pattern})
    ORDER BY t.created_at DESC LIMIT 20
  `;
  return NextResponse.json(results);
}
