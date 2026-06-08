import { NextRequest, NextResponse } from 'next/server';
import { getDb, logHistory } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const tasks = await sql`
    SELECT t.*,
      (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id)::int AS subtask_count,
      (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.status = 'done')::int AS subtask_done
    FROM tasks t WHERE t.project_id = ${id} ORDER BY t.created_at ASC
  `;
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const body = await req.json();
  const { parent_id, title, description, priority, task_type, assigned_to, start_date, due_date } = body;

  // Ensure columns exist before inserting
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'general'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignees JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence JSONB`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'`;

  const [task] = await sql`
    INSERT INTO tasks (project_id, parent_id, title, description, priority, task_type, assigned_to, start_date, due_date)
    VALUES (${id}, ${parent_id || null}, ${title}, ${description ?? ''}, ${priority ?? 'medium'}, ${task_type ?? 'general'}, ${assigned_to ?? ''}, ${start_date || null}, ${due_date || null})
    RETURNING *
  `;
  await logHistory(task.id, 'יצירה', undefined, undefined, title);
  return NextResponse.json(task, { status: 201 });
}
