'use client';
import { useState, useMemo } from 'react';
import { Task } from './TaskDetail';
import TaskDetail from './TaskDetail';

const statusColor: Record<string, string> = { pending: 'bg-slate-400', in_progress: 'bg-blue-500', done: 'bg-emerald-500' };
const statusLabel: Record<string, string> = { pending: 'ממתין', in_progress: 'בביצוע', done: 'הושלם' };

export default function TaskGantt({ tasks, projectId, onRefresh }: {
  tasks: Task[]; projectId: number; onRefresh: () => void;
}) {
  const [editTask, setEditTask] = useState<Task | null | 'new'>(null);
  const rootTasks = tasks.filter(t => t.parent_id === null && (t.start_date || t.due_date));
  const allTasks = tasks.filter(t => t.parent_id === null);

  const { days, startDate } = useMemo(() => {
    const dates = allTasks.flatMap(t => [t.start_date, t.due_date].filter(Boolean).map(d => new Date(d!)));
    if (dates.length === 0) {
      const now = new Date();
      return { days: 30, startDate: now };
    }
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 5);
    const days = Math.max(30, Math.ceil((max.getTime() - min.getTime()) / 86400000));
    return { days, startDate: min };
  }, [allTasks]);

  const daysPx = Math.max(24, Math.floor(800 / days));

  const getLeft = (date: string) => {
    const d = new Date(date);
    return Math.max(0, Math.ceil((d.getTime() - startDate.getTime()) / 86400000)) * daysPx;
  };

  const getWidth = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(daysPx, Math.ceil((e.getTime() - s.getTime()) / 86400000) * daysPx);
  };

  const today = new Date();
  const todayLeft = Math.ceil((today.getTime() - startDate.getTime()) / 86400000) * daysPx;

  // Generate month/week labels
  const labels: { label: string; left: number }[] = [];
  let cursor = new Date(startDate);
  while (cursor.getTime() < startDate.getTime() + days * 86400000) {
    if (cursor.getDate() === 1 || cursor.getTime() === startDate.getTime()) {
      labels.push({
        label: cursor.toLocaleDateString('he-IL', { month: 'short', year: cursor.getMonth() === 0 ? 'numeric' : undefined }),
        left: Math.ceil((cursor.getTime() - startDate.getTime()) / 86400000) * daysPx,
      });
    }
    cursor = new Date(cursor.getTime() + 86400000 * 7);
  }

  if (rootTasks.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-4xl">📅</p>
        <p className="text-slate-500 text-sm">אין משימות עם תאריכים להצגה בגאנט</p>
        <p className="text-slate-400 text-xs">הוסף תאריך התחלה ויעד למשימות כדי לראותן כאן</p>
        <button onClick={() => setEditTask('new')} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#2d5a9e]">+ משימה חדשה</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 text-xs text-slate-500">
          {Object.entries(statusLabel).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1"><span className={`w-3 h-3 rounded-sm ${statusColor[k]}`} />{v}</span>
          ))}
          <span className="flex items-center gap-1"><span className="w-1 h-4 bg-red-400" />היום</span>
        </div>
        <button onClick={() => setEditTask('new')} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#2d5a9e]">+ משימה</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: days * daysPx + 200 }}>
            {/* Month labels */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="w-48 shrink-0 px-4 py-2 border-l border-slate-200 text-xs font-semibold text-slate-600">משימה</div>
              <div className="flex-1 relative h-8">
                {labels.map((l, i) => (
                  <span key={i} className="absolute text-xs text-slate-500 top-2" style={{ right: l.left }}>
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Tasks */}
            {rootTasks.map(task => {
              const start = task.start_date || task.due_date;
              const end = task.due_date || task.start_date;
              const left = getLeft(start!);
              const width = getWidth(start!, end!);
              const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < today;

              return (
                <div key={task.id} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                  <div className="w-48 shrink-0 px-4 py-3 border-l border-slate-200">
                    <button onClick={() => setEditTask(task)} className="text-sm font-medium text-slate-800 hover:text-blue-600 text-right w-full truncate block">
                      {task.title}
                    </button>
                    <p className="text-xs text-slate-400 mt-0.5">{task.assigned_to || ''}</p>
                  </div>
                  <div className="flex-1 relative py-3 overflow-hidden" style={{ height: 56 }}>
                    {/* Today line */}
                    {todayLeft > 0 && <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-60 z-10" style={{ right: todayLeft }} />}
                    {/* Bar */}
                    <div
                      className={`absolute h-7 rounded-lg flex items-center px-2 cursor-pointer shadow-sm ${statusColor[task.status]} ${isOverdue ? 'ring-2 ring-red-400' : ''}`}
                      style={{ right: left, width: Math.max(width, 40), top: 12 }}
                      onClick={() => setEditTask(task)}
                    >
                      <span className="text-white text-xs font-medium truncate">{task.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editTask && (
        <TaskDetail task={editTask === 'new' ? null : editTask} projectId={projectId}
          onClose={() => setEditTask(null)} onSave={() => { setEditTask(null); onRefresh(); }} />
      )}
    </div>
  );
}
