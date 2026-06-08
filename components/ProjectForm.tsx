'use client';
import { useState } from 'react';
import { Project } from '@/lib/types';

export default function ProjectForm({ onClose, onSave, initial }: {
  onClose: () => void; onSave: () => void; initial?: Partial<Project>;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    status: initial?.status || 'active',
    location: initial?.location || '',
    developer: initial?.developer || '',
    start_date: initial?.start_date?.slice(0, 10) || '',
    end_date: initial?.end_date?.slice(0, 10) || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(initial?.id ? `/api/projects/${initial.id}` : '/api/projects', {
      method: initial?.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">{initial?.id ? 'עריכת פרויקט' : 'פרויקט חדש'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="שם הפרויקט *">
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="לדוגמה: בניית גשר נחל" />
          </Field>
          <Field label="יזם / מזמין עבודה">
            <input value={form.developer} onChange={e => set('developer', e.target.value)} className={inputCls} placeholder="שם היזם" />
          </Field>
          <Field label="מיקום">
            <input value={form.location} onChange={e => set('location', e.target.value)} className={inputCls} placeholder="כתובת / שם האתר" />
          </Field>
          <Field label="תיאור">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="סטטוס">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="active">פעיל</option>
                <option value="paused">מושהה</option>
                <option value="completed">הושלם</option>
              </select>
            </Field>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="התחלה">
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
            </Field>
            <Field label="יעד סיום">
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 active:scale-95">
              {saving ? 'שומר...' : initial?.id ? 'עדכן' : 'צור פרויקט'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
