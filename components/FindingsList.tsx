'use client';
import { useState, useEffect } from 'react';

type Finding = { id: number; title: string; description: string; status: string; priority: string; assigned_to: string; found_date: string; resolved_date: string };

const priorityColor: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
const priorityLabel: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };

export default function FindingsList({ projectId }: { projectId: number }) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Finding | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const fetch_ = async () => {
    const res = await fetch(`/api/projects/${projectId}/findings`);
    setFindings(await res.json());
  };
  useEffect(() => { fetch_(); }, []);

  const toggleStatus = async (f: Finding) => {
    const newStatus = f.status === 'open' ? 'resolved' : 'open';
    const resolved_date = newStatus === 'resolved' ? new Date().toISOString().slice(0, 10) : null;
    await fetch(`/api/findings/${f.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, status: newStatus, resolved_date }),
    });
    fetch_();
  };

  const del = async (id: number) => {
    if (!confirm('למחוק ממצא זה?')) return;
    await fetch(`/api/findings/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const filtered = filter === 'all' ? findings : findings.filter(f => f.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[['all','הכל'],['open','פתוחים'],['resolved','טופלו']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v as typeof filter)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${filter === v ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-8">{filter === 'open' ? 'אין ממצאים פתוחים 👍' : 'אין ממצאים'}</p>
      ) : (
        filtered.map(f => (
          <div key={f.id} className={`bg-white rounded-2xl border p-4 ${f.status === 'resolved' ? 'border-slate-100 opacity-70' : 'border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleStatus(f)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition ${f.status === 'resolved' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}>
                {f.status === 'resolved' && <span className="text-white text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${f.status === 'resolved' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{f.title}</p>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${priorityColor[f.priority]}`}>{priorityLabel[f.priority]}</span>
                </div>
                {f.description && <p className="text-xs text-slate-500 mt-1">{f.description}</p>}
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                  {f.assigned_to && <span>👤 {f.assigned_to}</span>}
                  {f.found_date && <span>🔍 {new Date(f.found_date).toLocaleDateString('he-IL')}</span>}
                  {f.resolved_date && <span>✅ {new Date(f.resolved_date).toLocaleDateString('he-IL')}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-2 border-t border-slate-50">
              <button onClick={() => { setEditing(f); setShowForm(true); }} className="text-xs text-slate-500 hover:text-slate-700">ערוך</button>
              <button onClick={() => del(f.id)} className="text-xs text-red-400 hover:text-red-600">מחק</button>
            </div>
          </div>
        ))
      )}

      <button onClick={() => { setEditing(null); setShowForm(true); }}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition text-sm">
        + הוסף ממצא
      </button>

      {showForm && (
        <FindingForm projectId={projectId} initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={() => { setShowForm(false); setEditing(null); fetch_(); }}
        />
      )}
    </div>
  );
}

function FindingForm({ projectId, initial, onClose, onSave }: {
  projectId: number; initial: Finding | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '', description: initial?.description || '',
    priority: initial?.priority || 'medium', assigned_to: initial?.assigned_to || '',
    found_date: initial?.found_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (initial) {
      await fetch(`/api/findings/${initial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...initial, ...form }) });
    } else {
      await fetch(`/api/projects/${projectId}/findings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h3 className="font-bold text-lg">🔍 {initial ? 'עריכת ממצא' : 'ממצא חדש'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl">×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className={lbl}>תיאור הממצא *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} className={inp} placeholder="מה נמצא?" />
          </div>
          <div>
            <label className={lbl}>פרטים נוספים</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inp} rows={3} placeholder="מיקום, פרטים, הוראות תיקון..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>דחיפות</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inp}>
                <option value="high">🔴 דחוף</option>
                <option value="medium">🟡 בינוני</option>
                <option value="low">🟢 נמוך</option>
              </select>
            </div>
            <div>
              <label className={lbl}>תאריך גילוי</label>
              <input type="date" value={form.found_date} onChange={e => set('found_date', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>אחראי לטיפול</label>
            <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className={inp} placeholder="שם הקבלן / האחראי" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50">{saving ? 'שומר...' : initial ? 'עדכן' : 'הוסף'}</button>
            <button type="button" onClick={onClose} className="px-5 py-3 border border-slate-300 rounded-xl">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const lbl = 'block text-sm font-medium text-slate-700 mb-1';
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50';
