'use client';
import { useState } from 'react';

export type Task = {
  id: number; project_id: number; parent_id: number | null;
  title: string; description: string; status: string; priority: string;
  task_type: string; assigned_to: string; due_date: string;
  completed_at: string; subtask_count: number; subtask_done: number;
};

const taskTypes = [
  { value: 'general', label: 'כללי' },
  { value: 'meeting', label: '🤝 פגישה / ישיבה' },
  { value: 'approval', label: '📋 אישור / רגולציה' },
  { value: 'contractor', label: '🔨 קבלן' },
  { value: 'finding', label: '🔍 ממצא / ליקוי' },
];

export default function TaskForm({ projectId, parentId, onClose, onSave, initial }: {
  projectId: number; parentId?: number | null; onClose: () => void; onSave: () => void; initial?: Task;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    priority: initial?.priority || 'medium',
    task_type: initial?.task_type || 'general',
    assigned_to: initial?.assigned_to || '',
    due_date: initial?.due_date?.slice(0, 10) || '',
    parent_id: parentId ?? initial?.parent_id ?? null,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (initial) {
      await fetch(`/api/tasks/${initial.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initial, ...form }),
      });
    } else {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">{initial ? 'עריכת משימה' : parentId ? 'תת-משימה' : 'משימה חדשה'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={lbl}>כותרת *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} className={inp} placeholder="תיאור המשימה" />
          </div>
          {!parentId && (
            <div>
              <label className={lbl}>סוג</label>
              <div className="grid grid-cols-2 gap-2">
                {taskTypes.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => set('task_type', t.value)}
                    className={`py-2 px-3 rounded-xl border text-sm text-right transition ${form.task_type === t.value ? 'bg-blue-700 text-white border-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'}`}
                  >{t.label}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className={lbl}>פרטים</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inp} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>עדיפות</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inp}>
                <option value="high">🔴 גבוהה</option>
                <option value="medium">🟡 בינונית</option>
                <option value="low">🟢 נמוכה</option>
              </select>
            </div>
            <div>
              <label className={lbl}>אחראי</label>
              <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className={inp} placeholder="שם" />
            </div>
          </div>
          <div>
            <label className={lbl}>תאריך יעד</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={inp} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 active:scale-95">
              {saving ? 'שומר...' : initial ? 'עדכן' : 'הוסף'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const lbl = 'block text-sm font-medium text-slate-700 mb-1';
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50';
