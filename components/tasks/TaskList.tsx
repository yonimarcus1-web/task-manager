'use client';
import { useState } from 'react';
import { Task } from './TaskDetail';
import TaskDetail from './TaskDetail';

const priorityColor: Record<string, string> = { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-green-100 text-green-700 border-green-200' };
const priorityLabel: Record<string, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const statusStyle: Record<string, string> = { pending: 'border-slate-200', in_progress: 'border-blue-300', done: 'border-green-300 opacity-60' };
const typeIcon: Record<string, string> = { meeting: '🤝', approval: '📋', contractor: '🔨', site_visit: '🏗️', general: '📌' };

export default function TaskList({ tasks, projectId, onRefresh, openTaskId }: {
  tasks: Task[]; projectId: number; onRefresh: () => void; openTaskId?: number;
}) {
  const [editTask, setEditTask] = useState<Task | null | 'new'>(() =>
    openTaskId ? tasks.find(t => t.id === openTaskId) ?? null : null
  );
  const [sortBy, setSortBy] = useState<'created' | 'due' | 'priority'>('created');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');

  const rootTasks = tasks.filter(t => t.parent_id === null);

  const sorted = [...rootTasks].sort((a, b) => {
    if (sortBy === 'due') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1);
    }
    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
  });

  const filtered = sorted.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (search && !t.title.includes(search) && !(t.assigned_to ?? '').includes(search)) return false;
    return true;
  });

  const isOverdue = (t: Task) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();

  const delTask = async (id: number) => {
    if (!confirm('למחוק משימה זו?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 חיפוש..." className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={sel}>
          <option value="all">כל הסטטוסים</option>
          <option value="pending">ממתין</option>
          <option value="in_progress">בביצוע</option>
          <option value="done">הושלם</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={sel}>
          <option value="all">כל העדיפויות</option>
          <option value="high">גבוהה</option>
          <option value="medium">בינונית</option>
          <option value="low">נמוכה</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className={sel}>
          <option value="created">לפי תאריך יצירה</option>
          <option value="due">לפי תאריך יעד</option>
          <option value="priority">לפי עדיפות</option>
        </select>
        <div className="mr-auto">
          <button onClick={() => setEditTask('new')}
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2d5a9e] transition">
            + משימה
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400">{filtered.length} משימות{filtered.length !== rootTasks.length ? ` (מתוך ${rootTasks.length})` : ''}</p>

      {/* Task rows */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-slate-500 text-sm">{rootTasks.length === 0 ? 'אין משימות עדיין' : 'אין תוצאות לסינון הנוכחי'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const overdue = isOverdue(task);
            const daysLeft = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000) : null;
            return (
              <div key={task.id}
                className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition cursor-pointer ${statusStyle[task.status]} ${overdue ? 'border-r-4 border-r-red-500' : ''}`}
                onClick={() => setEditTask(task)}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 shrink-0">{typeIcon[task.task_type] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-lg border font-medium ${priorityColor[task.priority]}`}>
                          {priorityLabel[task.priority]}
                        </span>
                      </div>
                      {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>}

                      {/* Tags */}
                      {(task.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(task.tags ?? []).map(t => (
                            <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">🏷️ {t}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {task.assigned_to && <span>👤 {task.assigned_to}</span>}
                        {task.due_date && (
                          <span className={overdue ? 'text-red-500 font-semibold' : daysLeft !== null && daysLeft <= 3 ? 'text-orange-500 font-medium' : ''}>
                            📅 {new Date(task.due_date).toLocaleDateString('he-IL')}
                            {overdue ? ` (${Math.abs(daysLeft!)} ימים באיחור ⚠️)` : daysLeft === 0 ? ' (היום)' : daysLeft === 1 ? ' (מחר)' : ''}
                          </span>
                        )}
                        {task.subtask_count > 0 && <span>📋 {task.subtask_done}/{task.subtask_count}</span>}
                        {(task.checklist ?? []).length > 0 && <span>✅ {task.checklist.filter(c => c.done).length}/{task.checklist.length}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-t border-slate-100 rounded-b-2xl" onClick={e => e.stopPropagation()}>
                  <select value={task.status}
                    onChange={async e => {
                      await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status: e.target.value }) });
                      onRefresh();
                    }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                    <option value="pending">ממתין</option>
                    <option value="in_progress">בביצוע</option>
                    <option value="done">הושלם</option>
                  </select>
                  <button onClick={() => delTask(task.id)} className="text-xs text-red-400 hover:text-red-600 mr-auto">מחק</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editTask && (
        <TaskDetail
          task={editTask === 'new' ? null : editTask}
          projectId={projectId}
          onClose={() => setEditTask(null)}
          onSave={() => { setEditTask(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

const sel = 'border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';
