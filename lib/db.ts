import postgres from 'postgres';

let sql: ReturnType<typeof postgres>;

export function getDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL לא מוגדר ב-.env.local');
    sql = postgres(url, { ssl: 'require' });
  }
  return sql;
}

export async function initSchema() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      location TEXT,
      developer TEXT,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      parent_id INT REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      task_type TEXT DEFAULT 'general',
      assigned_to TEXT,
      assignees JSONB DEFAULT '[]',
      tags JSONB DEFAULT '[]',
      checklist JSONB DEFAULT '[]',
      start_date DATE,
      due_date DATE,
      recurrence JSONB,
      dependencies JSONB DEFAULT '[]',
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS task_history (
      id SERIAL PRIMARY KEY,
      task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL DEFAULT 'מנהל',
      action TEXT NOT NULL,
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS task_comments (
      id SERIAL PRIMARY KEY,
      task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL DEFAULT 'מנהל',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  // Add missing columns to existing tasks table (safe to run multiple times)
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'general'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignees JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence JSONB`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'`;

  // Insert default settings if not exist
  const defaults: Record<string, string> = {
    business_name: 'מנהל פרויקטים',
    default_assignee: '',
    alert_yellow_days: '3',
    alert_red_days: '1',
    inactive_days: '14',
    activity_log_days: '7',
    urgent_tasks_count: '10',
    week_ahead_days: '7',
    health_yellow_progress: '50',
    health_red_progress: '25',
    health_red_overdue: '3',
    show_urgent: 'true',
    show_week_ahead: 'true',
    show_activity: 'true',
    show_health: 'true',
    show_search: 'true',
  };

  for (const [key, value] of Object.entries(defaults)) {
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING`;
  }
}

export async function logHistory(
  taskId: number,
  action: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  userName = 'מנהל'
) {
  const sql = getDb();
  await sql`
    INSERT INTO task_history (task_id, user_name, action, field_name, old_value, new_value)
    VALUES (${taskId}, ${userName}, ${action}, ${fieldName ?? null}, ${oldValue ?? null}, ${newValue ?? null})
  `;
}
