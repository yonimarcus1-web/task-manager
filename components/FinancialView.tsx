'use client';
import { useState, useEffect } from 'react';

type Tx = { id: number; type: 'income' | 'expense'; amount: number; description: string; category: string; transaction_date: string };

export default function FinancialView({ projectId }: { projectId: number }) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');

  const fetch_ = async () => {
    const res = await fetch(`/api/projects/${projectId}/transactions`);
    setTxs(await res.json());
  };
  useEffect(() => { fetch_(); }, []);

  const del = async (id: number) => {
    if (!confirm('למחוק?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
          <p className="text-xs text-emerald-600 mb-1">הכנסות</p>
          <p className="font-bold text-emerald-700">₪{income.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
          <p className="text-xs text-red-600 mb-1">הוצאות</p>
          <p className="font-bold text-red-700">₪{expense.toLocaleString()}</p>
        </div>
        <div className={`border rounded-2xl p-3 text-center ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-xs mb-1 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>יתרה</p>
          <p className={`font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>₪{balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Add buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { setAddType('income'); setShowForm(true); }}
          className="py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium active:scale-95 transition">
          + הכנסה
        </button>
        <button onClick={() => { setAddType('expense'); setShowForm(true); }}
          className="py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium active:scale-95 transition">
          + הוצאה
        </button>
      </div>

      {/* List */}
      {txs.length === 0 ? (
        <p className="text-center text-slate-400 py-6">אין תנועות עדיין</p>
      ) : (
        <div className="space-y-2">
          {txs.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
              <span className="text-xl">{t.type === 'income' ? '💚' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                <p className="text-xs text-slate-400">{t.category && `${t.category} · `}{t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('he-IL') : ''}</p>
              </div>
              <div className="text-left">
                <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}₪{Number(t.amount).toLocaleString()}
                </p>
              </div>
              <button onClick={() => del(t.id)} className="text-slate-300 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TxForm projectId={projectId} type={addType}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetch_(); }}
        />
      )}
    </div>
  );
}

function TxForm({ projectId, type, onClose, onSave }: {
  projectId: number; type: 'income' | 'expense'; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({ amount: '', description: '', category: '', transaction_date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/projects/${projectId}/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type }),
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-lg">{type === 'income' ? '💚 הכנסה חדשה' : '🔴 הוצאה חדשה'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl">×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className={lbl}>סכום (₪) *</label>
            <input required type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className={inp} placeholder="0" />
          </div>
          <div>
            <label className={lbl}>תיאור *</label>
            <input required value={form.description} onChange={e => set('description', e.target.value)} className={inp} placeholder="לדוגמה: תשלום לקבלן X" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>קטגוריה</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} className={inp} placeholder="לדוגמה: עפר" />
            </div>
            <div>
              <label className={lbl}>תאריך</label>
              <input type="date" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} className={inp} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className={`flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-50 ${type === 'income' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              {saving ? 'שומר...' : 'הוסף'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 border border-slate-300 rounded-xl">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const lbl = 'block text-sm font-medium text-slate-700 mb-1';
const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50';
