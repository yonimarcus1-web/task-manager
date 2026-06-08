'use client';
import { useState, useEffect } from 'react';

export type Task = {
  id: number; project_id: number; parent_id: number | null;
  title: string; description: string; status: string; priority: string;
  task_type: string; assigned_to: string; assignees: string[];
  tags: string[]; checklist: { text: string; done: boolean }[];
  start_date: string; due_date: string; recurrence: unknown;
  dependencies: number[]; completed_at: string;
  subtask_count: number; subtask_done: number;
  created_at?: string;
};
type HistoryItem = { id: number; action: string; field_name: string; old_value: string; new_value: string; user_name: string; created_at: string };
type Comment = { id: number; content: string; user_name: string; created_at: string };

const statusOptions = [{ v: 'pending', l: 'ממתין', c: 'bg-slate-100 text-slate-600' }, { v: 'in_progress', l: 'בביצוע', c: 'bg-blue-100 text-blue-700' }, { v: 'done', l: 'הושלם', c: 'bg-green-100 text-green-700' }];
const priorityOptions = [{ v: 'high', l: '🔴 גבוהה' }, { v: 'medium', l: '🟡 בינונית' }, { v: 'low', l: '🟢 נמוכה' }];
const typeOptions = [{ v: 'general', l: '📌 כללי' }, { v: 'meeting', l: '🤝 פגישה' }, { v: 'approval', l: '📋 אישור' }, { v: 'contractor', l: '🔨 קבלן' }, { v: 'site_visit', l: '🏗️ ביקור שטח' }];
const recurrenceTypes = [{ v: '', l: 'ללא' }, { v: 'daily', l: 'יומי' }, { v: 'weekly', l: 'שבועי' }, { v: 'biweekly', l: 'כל שבועיים' }, { v: 'monthly', l: 'חודשי' }];

export default function TaskDetail({ task, onClose, onSave, projectId }: {
  task: Task | null; onClose: () => void; onSave: () => void; projectId: number;
}) {
  const isNew = !task;
  const [form, setForm] = useState<Partial<Task>>(() => task ?? {
    title: '', description: '', status: 'pending', priority: 'medium', task_type: 'general',
    assigned_to: '', assignees: [], tags: [], checklist: [], start_date: '', due_date: '',
    recurrence: null, dependencies: [],
  });
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'subtasks' | 'comments' | 'history'>('details');
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Task, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!task) return;
    // Fetch subtasks
    fetch(`/api/projects/${task.project_id}/tasks`)
      .then(r => r.json())
      .then(tasks => setSubtasks(tasks.filter((t: Task) => t.parent_id === task.id)));
    fetch(`/api/tasks/${task.id}/history`).then(r => r.json()).then(setHistory);
    fetch(`/api/tasks/${task.id}/comments`).then(r => r.json()).then(setComments);
  }, [task]);

  const save = async () => {
    setSaving(true);
    if (isNew) {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
    } else {
      await fetch(`/api/tasks/${task!.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
    }
    setSaving(false);
    onSave();
  };

  const addComment = async () => {
    if (!newComment.trim() || !task) return;
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newComment }),
    });
    setNewComment('');
    fetch(`/api/tasks/${task.id}/comments`).then(r => r.json()).then(setComments);
  };

  const addSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
    await fetch(`/api/projects/${task.project_id}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubtask, parent_id: task.id, priority: 'medium' }),
    });
    setNewSubtask('');
    fetch(`/api/projects/${task.project_id}/tasks`).then(r => r.json())
      .then(tasks => setSubtasks(tasks.filter((t: Task) => t.parent_id === task.id)));
  };

  const toggleSubtask = async (sub: Task) => {
    const newStatus = sub.status === 'done' ? 'pending' : 'done';
    await fetch(`/api/tasks/${sub.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sub, status: newStatus }),
    });
    fetch(`/api/projects/${task!.project_id}/tasks`).then(r => r.json())
      .then(tasks => setSubtasks(tasks.filter((t: Task) => t.parent_id === task!.id)));
  };

  const delSubtask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setSubtasks(s => s.filter(t => t.id !== id));
  };

  const toggleCheck = (i: number) => {
    const cl = [...(form.checklist ?? [])];
    cl[i] = { ...cl[i], done: !cl[i].done };
    set('checklist', cl);
  };
  const addCheckItem = () => {
    const text = prompt('סעיף חדש:');
    if (text) set('checklist', [...(form.checklist ?? []), { text, done: false }]);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    set('tags', [...(form.tags ?? []), newTag.trim()]);
    setNewTag('');
  };
  const removeTag = (t: string) => set('tags', (form.tags ?? []).filter(x => x !== t));

  const addAssignee = () => {
    if (!newAssignee.trim()) return;
    set('assignees', [...(form.assignees ?? []), newAssignee.trim()]);
    setNewAssignee('');
  };

  const tabs = [
    { id: 'details', l: 'פרטים' },
    { id: 'checklist', l: `צ'קליסט ${form.checklist?.length ? `(${form.checklist.filter(c => c.done).length}/${form.checklist.length})` : ''}` },
    { id: 'subtasks', l: `תת-משימות ${subtasks.length ? `(${subtasks.filter(s => s.status === 'done').length}/${subtasks.length})` : ''}` },
    { id: 'comments', l: `הערות ${comments.length ? `(${comments.length})` : ''}` },
    ...(!isNew ? [{ id: 'history', l: 'היסטוריה' }] : []),
  ] as { id: typeof activeTab; l: string }[];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex-1 min-w-0">
            <input
              value={form.title ?? ''}
              onChange={e => set('title', e.target.value)}
              placeholder="כותרת המשימה *"
              className="w-full font-bold text-lg text-slate-800 border-0 outline-none bg-transparent placeholder-slate-300"
            />
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 text-xl shrink-0">×</button>
        </div>

        {/* Status + Priority row */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-100 shrink-0 flex-wrap">
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className={`text-xs border rounded-lg px-2 py-1.5 font-medium focus:outline-none ${statusOptions.find(s => s.v === form.status)?.c ?? 'bg-slate-100'}`}>
            {statusOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
            {priorityOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select value={form.task_type} onChange={e => set('task_type', e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
            {typeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition ${activeTab === t.id ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>תיאור</label>
                <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
                  className={inp} rows={3} placeholder="פרטים, הוראות, הערות..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>תאריך התחלה</label>
                  <input type="date" value={form.start_date?.slice(0,10) ?? ''} onChange={e => set('start_date', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>תאריך יעד</label>
                  <input type="date" value={form.due_date?.slice(0,10) ?? ''} onChange={e => set('due_date', e.target.value)} className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>אחראי ראשי</label>
                <input value={form.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value)} className={inp} placeholder="שם האחראי" />
              </div>
              <div>
                <label className={lbl}>אחראים נוספים</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.assignees ?? []).map(a => (
                    <span key={a} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-1 text-xs">
                      👤 {a} <button onClick={() => set('assignees', (form.assignees ?? []).filter(x => x !== a))} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAssignee()} className={inp + ' flex-1'} placeholder="הוסף אחראי..." />
                  <button onClick={addAssignee} className="px-3 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">+</button>
                </div>
              </div>
              <div>
                <label className={lbl}>תגיות</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.tags ?? []).map(t => (
                    <span key={t} className="flex items-center gap-1 bg-slate-100 text-slate-700 rounded-lg px-2 py-1 text-xs">
                      🏷️ {t} <button onClick={() => removeTag(t)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} className={inp + ' flex-1'} placeholder='הוסף תגית — "ממתין לאישור"' />
                  <button onClick={addTag} className="px-3 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">+</button>
                </div>
              </div>
              <div>
                <label className={lbl}>חזרה אוטומטית</label>
                <select
                  value={(form.recurrence as Record<string,string>)?.type ?? ''}
                  onChange={e => set('recurrence', e.target.value ? { type: e.target.value } : null)}
                  className={inp}>
                  {recurrenceTypes.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-2">
              {(form.checklist ?? []).length === 0 && <p className="text-slate-400 text-sm text-center py-4">אין סעיפים עדיין</p>}
              {(form.checklist ?? []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="checkbox" checked={item.done} onChange={() => toggleCheck(i)} className="w-4 h-4 rounded accent-blue-600" />
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                  <button onClick={() => set('checklist', (form.checklist ?? []).filter((_, j) => j !== i))} className="text-red-300 hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
              <button onClick={addCheckItem} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition text-sm">
                + הוסף סעיף
              </button>
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div className="space-y-2">
              {subtasks.length === 0 && <p className="text-slate-400 text-sm text-center py-4">אין תת-משימות עדיין</p>}
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input type="checkbox" checked={sub.status === 'done'} onChange={() => toggleSubtask(sub)} className="w-4 h-4 rounded accent-blue-600" />
                  <span className={`flex-1 text-sm ${sub.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                  {sub.assigned_to && <span className="text-xs text-slate-400">👤 {sub.assigned_to}</span>}
                  {sub.due_date && <span className="text-xs text-slate-400">📅 {new Date(sub.due_date).toLocaleDateString('he-IL')}</span>}
                  <button onClick={() => delSubtask(sub.id)} className="text-red-300 hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubtask()}
                  className={inp + ' flex-1'} placeholder="תת-משימה חדשה..." />
                <button onClick={addSubtask} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm hover:bg-[#2d5a9e]">הוסף</button>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-slate-400 text-sm text-center py-4">אין הערות עדיין</p>}
              {comments.map(c => (
                <div key={c.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#1e3a5f]">👤 {c.user_name}</span>
                    <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('he-IL')} {new Date(c.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} className={inp + ' flex-1 resize-none'} rows={2} placeholder="כתוב הערה..." />
                <button onClick={addComment} disabled={!newComment.trim()} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm hover:bg-[#2d5a9e] disabled:opacity-40 self-end">שלח</button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 && <p className="text-slate-400 text-sm text-center py-4">אין היסטוריה עדיין</p>}
              {history.map(h => (
                <div key={h.id} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-1 bg-[#1e3a5f] rounded-full shrink-0 self-stretch opacity-20" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{h.action}</span>
                      {h.field_name && <span className="text-slate-500"> — {h.field_name}</span>}
                      {h.old_value && h.new_value && (
                        <span className="text-slate-500">: <span className="line-through text-red-400">{h.old_value}</span> → <span className="text-green-600">{h.new_value}</span></span>
                      )}
                      {!h.old_value && h.new_value && <span className="text-slate-500">: {h.new_value}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{h.user_name} · {new Date(h.created_at).toLocaleDateString('he-IL')} {new Date(h.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-200 shrink-0">
          <button onClick={save} disabled={saving || !form.title?.trim()}
            className="flex-1 bg-[#1e3a5f] text-white font-semibold py-3 rounded-xl hover:bg-[#2d5a9e] transition disabled:opacity-50 active:scale-95">
            {saving ? 'שומר...' : isNew ? 'צור משימה' : 'שמור שינויים'}
          </button>
          <button onClick={onClose} className="px-5 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition text-sm">ביטול</button>
        </div>
      </div>
    </div>
  );
}

const lbl = 'block text-sm font-medium text-slate-700 mb-1';
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50';
