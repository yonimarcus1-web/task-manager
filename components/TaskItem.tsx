'use client';
import { useState } from 'react';
import { Task } from './TaskForm';
import TaskForm from './TaskForm';

const priorityColor: Record<string, string> = { high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500' };
const priorityDot: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
const typeIcon: Record<string, string> = { meeting: '🤝', approval: '📋', contractor: '🔨', finding: '🔍', general: '📌' };
const statusOptions = [{ value: 'pending', label: 'ממתין' }, { value: 'in_progress', label: 'בביצוע' }, { value: 'done', label: 'הושלם' }];

export default function TaskItem({ task, subtasks, projectId, onRefresh }: {
  task: Task; subtasks: Task[]; projectId: number; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editTask, setEditTask] = useState(false);
  const [addSub, setAddSub] = useState(false);

  const updateStatus = async (status: string) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status }),
    });
    onRefresh();
  };

  const deleteTask = async () => {
    if (!confirm(`למחוק "${task.title}"?`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    onRefresh();
  };

  const isDone = task.status === 'done';
  const isOverdue = task.due_date && !isDone && new Date(task.due_date) < new Date();

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isDone ? 'border-slate-100' : 'border-slate-200'}`}>
      <div className="p-4">
        <div className="flex gap-3">
          {/* Status selector */}
          <div className="shrink-0 pt-0.5">
            <button
              onClick={() => updateStatus(isDone ? 'pending' : task.status === 'pending' ? 'in_progress' : 'done')}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${isDone ? 'bg-emerald-500 border-emerald-500' : task.status === 'in_progress' ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}
            >
              {isDone && <span className="text-white text-xs">✓</span>}
              {task.status === 'in_progress' && <span className="text-blue-400 text-xs">●</span>}
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <span className="text-base">{typeIcon[task.task_type] || '📌'}</span>
              <p className={`flex-1 font-medium text-sm leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.title}
              </p>
              <span className={`shrink-0 text-sm ${priorityColor[task.priority]}`}>{priorityDot[task.priority]}</span>
            </div>
            {task.description && <p className="text-xs text-slate-500 mt-1 mr-6">{task.description}</p>}

            <div className="flex flex-wrap gap-2 mt-2 mr-6">
              {task.assigned_to && <span className="text-xs text-slate-400">👤 {task.assigned_to}</span>}
              {task.due_date && (
                <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                  📅 {new Date(task.due_date).toLocaleDateString('he-IL')}{isOverdue ? ' ⚠️' : ''}
                </span>
              )}
              {subtasks.length > 0 && (
                <button onClick={() => setExpanded(e => !e)} className="text-xs text-blue-500">
                  📋 {task.subtask_done}/{subtasks.length} {expanded ? '▲' : '▼'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status dropdown + actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
          <select
            value={task.status}
            onChange={e => updateStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:outline-none"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setAddSub(true)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1.5">+ תת-משימה</button>
          <button onClick={() => setEditTask(true)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5">ערוך</button>
          <button onClick={deleteTask} className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 mr-auto">מחק</button>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && subtasks.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 space-y-2">
          {subtasks.map(sub => <SubItem key={sub.id} task={sub} onRefresh={onRefresh} />)}
        </div>
      )}

      {addSub && <TaskForm projectId={projectId} parentId={task.id} onClose={() => setAddSub(false)} onSave={() => { setAddSub(false); onRefresh(); }} />}
      {editTask && <TaskForm projectId={projectId} onClose={() => setEditTask(false)} onSave={() => { setEditTask(false); onRefresh(); }} initial={task} />}
    </div>
  );
}

function SubItem({ task, onRefresh }: { task: Task; onRefresh: () => void }) {
  const isDone = task.status === 'done';
  const toggle = async () => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: isDone ? 'pending' : 'done' }),
    });
    onRefresh();
  };
  const del = async () => { await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' }); onRefresh(); };
  return (
    <div className="flex items-center gap-2 py-1">
      <input type="checkbox" checked={isDone} onChange={toggle} className="w-4 h-4 rounded accent-blue-600" />
      <span className={`flex-1 text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
      {task.assigned_to && <span className="text-xs text-slate-400">{task.assigned_to}</span>}
      <button onClick={del} className="text-red-300 hover:text-red-500 text-sm">✕</button>
    </div>
  );
}
