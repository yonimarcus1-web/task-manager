import { NextRequest, NextResponse } from 'next/server';
import { getDb, logHistory } from '@/lib/db';

const fieldLabels: Record<string, string> = {
  title: 'כותרת', description: 'תיאור', status: 'סטטוס',
  priority: 'עדיפות', assigned_to: 'אחראי', due_date: 'תאריך יעד',
  start_date: 'תאריך התחלה', task_type: 'סוג', tags: 'תגיות',
};
const statusLabels: Record<string, string> = { pending: 'ממתין', in_progress: 'בביצוע', done: 'הושלם' };
const priorityLabels: Record<string, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };

function humanize(field: string, val: unknown): string {
  if (!val) return '—';
  if (field === 'status') return statusLabels[String(val)] ?? String(val);
  if (field === 'priority') return priorityLabels[String(val)] ?? String(val);
  if (field === 'tags' || field === 'assignees') {
    const arr = Array.isArray(val) ? val : JSON.parse(String(val));
    return arr.length ? arr.join(', ') : '—';
  }
  return String(val);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const [task] = await sql`
    SELECT t.*,
      (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id)::int AS subtask_count,
      (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.status = 'done')::int AS subtask_done
    FROM tasks t WHERE t.id = ${id}
  `;
  if (!task) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const body = await req.json();

  // Get current task for diff
  const [current] = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  if (!current) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });

  const { title, description, status, priority, task_type, assigned_to, assignees,
    tags, checklist, start_date, due_date, recurrence, dependencies } = body;

  const completedAt = status === 'done' && current.status !== 'done' ? new Date().toISOString() :
    status !== 'done' ? null : current.completed_at;

  const [task] = await sql`
    UPDATE tasks SET
      title = ${title}, description = ${description}, status = ${status},
      priority = ${priority}, task_type = ${task_type}, assigned_to = ${assigned_to},
      assignees = ${JSON.stringify(assignees ?? [])},
      tags = ${JSON.stringify(tags ?? [])},
      checklist = ${JSON.stringify(checklist ?? [])},
      start_date = ${start_date || null}, due_date = ${due_date || null},
      recurrence = ${recurrence ? JSON.stringify(recurrence) : null},
      dependencies = ${JSON.stringify(dependencies ?? [])},
      completed_at = ${completedAt}
    WHERE id = ${id} RETURNING *
  `;

  // Log changes
  const watchFields = ['title','description','status','priority','assigned_to','due_date','start_date','task_type','tags'];
  for (const field of watchFields) {
    const oldVal = String(current[field] ?? '');
    const newVal = String(body[field] ?? '');
    if (oldVal !== newVal) {
      await logHistory(Number(id), 'עדכון שדה', fieldLabels[field] ?? field,
        humanize(field, current[field]), humanize(field, body[field]));
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
