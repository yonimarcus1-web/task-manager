'use client';
import { useState, useEffect } from 'react';

type Contractor = { id: number; name: string; company: string; role: string; phone: string; email: string; notes: string };

export default function ContractorList({ projectId }: { projectId: number }) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);

  const fetch_ = async () => {
    const res = await fetch(`/api/projects/${projectId}/contractors`);
    setContractors(await res.json());
  };
  useEffect(() => { fetch_(); }, []);

  const del = async (id: number) => {
    if (!confirm('למחוק קבלן זה?')) return;
    await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
    fetch_();
  };

  return (
    <div className="space-y-3">
      {contractors.length === 0 ? (
        <p className="text-center text-slate-400 py-8">אין קבלנים עדיין</p>
      ) : (
        contractors.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{c.name}</p>
                {c.company && <p className="text-sm text-slate-500">{c.company}</p>}
                {c.role && <p className="text-xs text-blue-600 mt-0.5">{c.role}</p>}
              </div>
              <div className="flex gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 rounded-xl text-lg">📞</a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl text-lg">✉️</a>
                )}
              </div>
            </div>
            {c.phone && <p className="text-xs text-slate-400 mt-2">📱 {c.phone}</p>}
            {c.notes && <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg p-2">{c.notes}</p>}
            <div className="flex gap-3 mt-3 pt-2 border-t border-slate-50">
              <button onClick={() => { setEditing(c); setShowForm(true); }} className="text-xs text-slate-500 hover:text-slate-700">ערוך</button>
              <button onClick={() => del(c.id)} className="text-xs text-red-400 hover:text-red-600">מחק</button>
            </div>
          </div>
        ))
      )}
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition text-sm"
      >
        + הוסף קבלן
      </button>

      {showForm && (
        <ContractorForm
          projectId={projectId}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={() => { setShowForm(false); setEditing(null); fetch_(); }}
        />
      )}
    </div>
  );
}

function ContractorForm({ projectId, initial, onClose, onSave }: {
  projectId: number; initial: Contractor | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({ name: initial?.name || '', company: initial?.company || '', role: initial?.role || '', phone: initial?.phone || '', email: initial?.email || '', notes: initial?.notes || '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (initial) {
      await fetch(`/api/contractors/${initial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch(`/api/projects/${projectId}/contractors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h3 className="font-bold text-lg">{initial ? 'עריכת קבלן' : 'קבלן חדש'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl">×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {[['name','שם *', true],['company','חברה',false],['role','תפקיד',false],['phone','טלפון',false],['email','אימייל',false]].map(([k,l,req]) => (
            <div key={k as string}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{l as string}</label>
              <input required={req as boolean} value={form[k as keyof typeof form]} onChange={e => set(k as string, e.target.value)} className={inp} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">הערות</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={inp} rows={2} />
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

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50';
