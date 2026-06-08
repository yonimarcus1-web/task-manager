'use client';
import { useState } from 'react';
import { Task } from './TaskDetail';
import TaskDetail from './TaskDetail';

const columns = [
  { id: 'pending', label: 'ממתין', color: 'bg-slate-50 border-slate-200', header: 'bg-slate-100 text-slate-700' },
  { id: 'in_progress', label: 'בביצוע', color: 'bg-blue-50 border-blue-200', header: 'bg-blue-100 text-blue-700' },
  { id: 'done', label: 'הושלם', color: 'bg-green-50 border-green-200', header: 'bg-green-100 text-green-700' },
];
const priorityDot: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
const typeIcon: Record<string, string> = { meeting: '🤝', approval: '📋', contractor: '🔨', site_visit: '🏗️', general: '📌' };

export default function TaskKanban({ tasks, projectId, onRefresh }: {
  tasks: Task[]; projectId: number; onRefresh: () => void;
}) {
  const [editTask, setEditTask] = useState<Task | null | 'new'>(null);
  const rootTasks = tasks.filter(t => t.parent_id === null);

  const changeStatus = async (task: Task, newStatus: string) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: newStatus }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditTask('new')} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2d5a9e] transition">
          + משימה
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = rootTasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={`rounded-2xl border ${col.color} min-h-64`}>
              {/* Column header */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.header}`}>
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="text-xs font-bold opacity-70">{colTasks.length}</span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2">
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">אין משימות</p>
                )}
                {colTasks.map(task => {
                  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
                  return (
                    <div key={task.id}
                      onClick={() => setEditTask(task)}
                      className={`bg-white rounded-xl border shadow-sm p-3 cursor-pointer hover:shadow-md transition ${isOverdue ? 'border-red-300' : 'border-slate-200'}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm shrink-0">{typeIcon[task.task_type] || '📌'}</span>
                        <p className={`text-sm font-medium flex-1 leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <span className="shrink-0 text-sm">{priorityDot[task.priority]}</span>
                      </div>

                      {(task.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(task.tags ?? []).slice(0, 2).map(t => (
                            <span key={t} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{t}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                        <span>{task.assigned_to && `👤 ${task.assigned_to}`}</span>
                        <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                          {task.due_date && `📅 ${new Date(task.due_date).toLocaleDateString('he-IL')}`}
                        </span>
                      </div>

                      {task.subtask_count > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                            <span>תת-משימות</span><span>{task.subtask_done}/{task.subtask_count}</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${task.subtask_count > 0 ? (task.subtask_done / task.subtask_count) * 100 : 0}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Move buttons */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                        {columns.filter(c => c.id !== col.id).map(c => (
                          <button key={c.id} onClick={() => changeStatus(task, c.id)}
                            className="flex-1 text-xs py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition text-slate-600">
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => setEditTask('new')}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition">
                  + הוסף
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editTask && (
        <TaskDetail task={editTask === 'new' ? null : editTask} projectId={projectId}
          onClose={() => setEditTask(null)} onSave={() => { setEditTask(null); onRefresh(); }} />
      )}
    </div>
  );
}
