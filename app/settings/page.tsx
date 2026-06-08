'use client';
import { useState, useEffect } from 'react';

type Settings = Record<string, string>;

type FieldDef =
  | { key: string; label: string; type: 'toggle' }
  | { key: string; label: string; type: 'text' | 'number'; placeholder?: string; unit?: string };

const sections: { title: string; fields: FieldDef[] }[] = [
  {
    title: '🏢 כללי',
    fields: [
      { key: 'business_name', label: 'שם העסק / המערכת', type: 'text', placeholder: 'מנהל פרויקטים' },
      { key: 'default_assignee', label: 'אחראי ברירת מחדל', type: 'text', placeholder: 'שמך' },
    ],
  },
  {
    title: '🔔 התראות וסף זמן',
    fields: [
      { key: 'alert_yellow_days', label: 'ימים לפני יעד — התראה צהובה', type: 'number', placeholder: '3', unit: 'ימים' },
      { key: 'alert_red_days', label: 'ימים לפני יעד — התראה אדומה', type: 'number', placeholder: '1', unit: 'ימים' },
      { key: 'inactive_days', label: 'ימים ללא עדכון — משימה "מוזנחת"', type: 'number', placeholder: '14', unit: 'ימים' },
      { key: 'activity_log_days', label: 'ימים אחורה בלוג פעילות', type: 'number', placeholder: '7', unit: 'ימים' },
    ],
  },
  {
    title: '🏠 דשבורד',
    fields: [
      { key: 'urgent_tasks_count', label: 'מספר משימות מקסימלי ב"דחופות"', type: 'number', placeholder: '10' },
      { key: 'week_ahead_days', label: 'טווח ימים ל"שבוע קדימה"', type: 'number', placeholder: '7', unit: 'ימים' },
    ],
  },
  {
    title: '📊 בריאות פרויקט',
    fields: [
      { key: 'health_yellow_progress', label: 'מתחת ל-% התקדמות — צהוב', type: 'number', placeholder: '50', unit: '%' },
      { key: 'health_red_progress', label: 'מתחת ל-% התקדמות — אדום', type: 'number', placeholder: '25', unit: '%' },
      { key: 'health_red_overdue', label: 'מעל X משימות באיחור — אדום', type: 'number', placeholder: '3', unit: 'משימות' },
    ],
  },
  {
    title: '👁️ תצוגת דשבורד',
    fields: [
      { key: 'show_urgent', label: 'הצג משימות דחופות', type: 'toggle' },
      { key: 'show_week_ahead', label: 'הצג שבוע קדימה', type: 'toggle' },
      { key: 'show_activity', label: 'הצג לוג פעילות', type: 'toggle' },
      { key: 'show_health', label: 'הצג בריאות פרויקטים', type: 'toggle' },
      { key: 'show_search', label: 'הצג חיפוש גלובלי', type: 'toggle' },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => { setSettings(s); setLoading(false); });
  }, []);

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));
  const toggle = (key: string) => setSettings(s => ({ ...s, [key]: s[key] === 'false' ? 'true' : 'false' }));

  const save = async () => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">טוען...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">⚙️ הגדרות</h1>
          <p className="text-slate-500 text-sm mt-0.5">שליטה מלאה על כל פרמטרי המערכת</p>
        </div>
        <button onClick={save} disabled={saving}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${saved ? 'bg-emerald-600 text-white' : 'bg-[#1e3a5f] text-white hover:bg-[#2d5a9e]'} disabled:opacity-50`}>
          {saved ? '✓ נשמר!' : saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>

      <div className="space-y-5">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="font-bold text-slate-700 text-sm">{section.title}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {section.fields.map(field => (
                <div key={field.key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <label className="text-sm font-medium text-slate-700 flex-1">{field.label}</label>
                  {field.type === 'toggle' ? (
                    <button
                      onClick={() => toggle(field.key)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings[field.key] !== 'false' ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[field.key] !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type={field.type}
                        value={settings[field.key] ?? ''}
                        onChange={e => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      />
                      {field.unit && <span className="text-xs text-slate-400 w-12">{field.unit}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* DB Init */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-5">
        <h3 className="font-semibold text-amber-800 text-sm mb-2">🔧 פעולות מערכת</h3>
        <button onClick={() => fetch('/api/init').then(() => alert('הטבלאות עודכנו בהצלחה'))}
          className="text-sm bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition">
          אתחול / עדכון טבלאות DB
        </button>
        <p className="text-xs text-amber-600 mt-2">לחץ על זה אחרי כל עדכון מערכת</p>
      </div>
    </div>
  );
}
