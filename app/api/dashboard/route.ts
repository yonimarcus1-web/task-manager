import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();

  const settings = await sql`SELECT key, value FROM settings`;
  const s: Record<string, string> = {};
  for (const row of settings) s[row.key] = row.value;

  const urgentCount = parseInt(s.urgent_tasks_count ?? '10');
  const weekAheadDays = parseInt(s.week_ahead_days ?? '7');
  const activityDays = parseInt(s.activity_log_days ?? '7');
  const redDays = parseInt(s.alert_red_days ?? '1');
  const yellowDays = parseInt(s.alert_yellow_days ?? '3');

  // Urgent + overdue tasks
  const urgentTasks = await sql`
    SELECT t.id, t.title, t.status, t.priority, t.due_date, t.assigned_to,
           p.id as project_id, p.name as project_name
    FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.parent_id IS NULL AND t.status != 'done'
      AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC
    LIMIT ${urgentCount}
  `;

  // Week ahead (not overdue, due within N days)
  const weekAhead = await sql`
    SELECT t.id, t.title, t.status, t.priority, t.due_date, t.assigned_to,
           p.id as project_id, p.name as project_name
    FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.parent_id IS NULL AND t.status != 'done'
      AND t.due_date >= CURRENT_DATE
      AND t.due_date <= CURRENT_DATE + ${weekAheadDays} * INTERVAL '1 day'
    ORDER BY t.due_date ASC
  `;

  // Recent activity
  const activity = await sql`
    SELECT h.*, t.title as task_title, p.name as project_name, p.id as project_id
    FROM task_history h
    JOIN tasks t ON t.id = h.task_id
    JOIN projects p ON p.id = t.project_id
    WHERE h.created_at >= NOW() - ${activityDays} * INTERVAL '1 day'
    ORDER BY h.created_at DESC LIMIT 20
  `;

  // Stats
  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE t.status != 'done' AND t.parent_id IS NULL)::int AS open_tasks,
      COUNT(*) FILTER (WHERE t.status = 'in_progress' AND t.parent_id IS NULL)::int AS in_progress,
      COUNT(*) FILTER (WHERE t.status = 'done' AND t.parent_id IS NULL)::int AS done_tasks,
      COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'done' AND t.parent_id IS NULL)::int AS overdue
    FROM tasks t
  `;

  return NextResponse.json({
    urgentTasks,
    weekAhead,
    activity,
    stats: stats[0],
    config: { redDays, yellowDays, weekAheadDays },
  });
}
