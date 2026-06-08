'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type DashTask = { id: number; title: string; status: string; priority: string; due_date: string; assigned_to: string; project_id: number; project_name: string };
type ActivityItem = { id: number; task_title: string; project_name: string; project_id: number; action: string; field_name: string; old_value: string; new_value: string; user_name: string; created_at: string };
type Project = { id: number; name: string; status: string; task_count: number; done_count: number; open_findings: number; end_date: string };

const priorityColor: Record<string, string> = { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-green-100 text-green-700 border-green-200' };
const priorityLabel: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };

function taskUrgency(dueDate: string, config: { redDays: number; yellowDays: number }) {
  if (!dueDate) return 'normal';
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= config.redDays) return 'red';
  if (days <= config.yellowDays) return 'yellow';
  return 'normal';
}

function daysLabel(dueDate: string) {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} ימים באיחור`;
  if (days === 0) return 'היום';
  if (days === 1) return 'מחר';
  return `${days} ימים`;
}

function projectHealth(p: Project, settings: Record<string, string>) {
  const progress = p.task_count > 0 ? (p.done_count / p.task_count) * 100 : 100;
  const overdueThreshold = parseInt(settings.health_red_overdue ?? '3');
  const redPct = parseInt(settings.health_red_progress ?? '25');
  const yellowPct = parseInt(settings.health_yellow_progress ?? '50');
  if ((p.open_findings || 0) >= overdueThreshold || progress <= redPct) return 'red';
  if (progress <= yellowPct) return 'yellow';
  return 'green';
}

const healthColor = { green: 'text-green-600 bg-green-50', yellow: 'text-yellow-600 bg-yellow-50', red: 'text-red-600 bg-red-50' };
const healthDot = { green: '🟢', yellow: '🟡', red: '🔴' };

export default function Dashboard() {
  const [data, setData] = useState<{ urgentTasks: DashTask[]; weekAhead: DashTask[]; activity: ActivityItem[]; stats: Record<string, number>; config: { redDays: number; yellowDays: number } } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<DashTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'urgent' | 'week'>('urgent');

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([d, p, s]) => { setData(d); setProjects(p); setSettings(s); setLoading(false); });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setSearchResults(await res.json());
  }, []);

  useEffect(() => { doSearch(search); }, [search, doSearch]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-3">⚙️</div>
        <p>טוען...</p>
      </div>
    </div>
  );

  const stats = data?.stats ?? {};
  const config = data?.config ?? { redDays: 1, yellowDays: 3 };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{settings.business_name || 'מנהל פרויקטים'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/projects" className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2d5a9e] transition">
          + פרויקט חדש
        </Link>
      </div>

      {/* Global Search */}
      {settings.show_search !== 'false' && (
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  חיפוש בכל הפרויקטים — משימה, אחראי..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 right-0 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {searchResults.map(t => (
                <Link key={t.id} href={`/projects/${t.project_id}?task=${t.id}`}
                  onClick={() => setSearch('')}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[t.priority]}`}>{priorityLabel[t.priority]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.project_name}</p>
                  </div>
                  {t.due_date && <span className="text-xs text-slate-400 shrink-0">{new Date(t.due_date).toLocaleDateString('he-IL')}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="פתוחות" value={stats.open_tasks ?? 0} icon="📋" color="blue" />
        <StatCard label="בביצוע" value={stats.in_progress ?? 0} icon="⚡" color="purple" />
        <StatCard label="הושלמו" value={stats.done_tasks ?? 0} icon="✅" color="green" />
        <StatCard label="באיחור" value={stats.overdue ?? 0} icon="⚠️" color={stats.overdue > 0 ? 'red' : 'gray'} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Urgent + Week */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs: Urgent / Week Ahead */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveTab('urgent')}
                className={`flex-1 py-3 text-sm font-semibold transition ${activeTab === 'urgent' ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                🔴 משימות דחופות ({(data?.urgentTasks ?? []).filter(t => taskUrgency(t.due_date, config) === 'overdue' || taskUrgency(t.due_date, config) === 'red').length})
              </button>
              <button onClick={() => setActiveTab('week')}
                className={`flex-1 py-3 text-sm font-semibold transition ${activeTab === 'week' ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                📅 שבוע קדימה ({data?.weekAhead?.length ?? 0})
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {(activeTab === 'urgent' ? data?.urgentTasks : data?.weekAhead)?.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-sm">
                  {activeTab === 'urgent' ? '👍 אין משימות דחופות' : '✅ אין משימות לשבוע הקרוב'}
                </p>
              ) : (activeTab === 'urgent' ? data?.urgentTasks : data?.weekAhead)?.map(task => {
                const urgency = taskUrgency(task.due_date, config);
                const urgencyStyle = urgency === 'overdue' ? 'border-r-4 border-r-red-500' :
                  urgency === 'red' ? 'border-r-4 border-r-orange-500' :
                  urgency === 'yellow' ? 'border-r-4 border-r-yellow-500' : '';
                return (
                  <Link key={task.id} href={`/projects/${task.project_id}?task=${task.id}`}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition ${urgencyStyle}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
                        <span className="text-xs text-blue-600 font-medium">{task.project_name}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                      {task.assigned_to && <p className="text-xs text-slate-400 mt-0.5">👤 {task.assigned_to}</p>}
                    </div>
                    {task.due_date && (
                      <div className="text-left shrink-0">
                        <p className={`text-xs font-semibold ${urgency === 'overdue' ? 'text-red-600' : urgency === 'red' ? 'text-orange-600' : 'text-slate-500'}`}>
                          {daysLabel(task.due_date)}
                        </p>
                        <p className="text-xs text-slate-400">{new Date(task.due_date).toLocaleDateString('he-IL')}</p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Activity Log */}
          {settings.show_activity !== 'false' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-sm">🕐 פעילות אחרונה</h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {data?.activity?.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-sm">אין פעילות אחרונה</p>
                ) : data?.activity?.map(item => (
                  <div key={item.id} className="px-4 py-2.5 flex items-start gap-3">
                    <span className="text-slate-300 text-xs mt-0.5 shrink-0">{new Date(item.created_at).toLocaleDateString('he-IL')} {new Date(item.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700">
                        <span className="font-medium">{item.task_title}</span>
                        {' — '}{item.action}
                        {item.field_name && <span className="text-slate-500"> ({item.field_name}{item.old_value ? `: ${item.old_value} → ${item.new_value}` : ''})</span>}
                      </p>
                      <p className="text-xs text-blue-500">{item.project_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Projects Health */}
        {settings.show_health !== 'false' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">📊 מצב פרויקטים</h2>
              <Link href="/projects" className="text-xs text-blue-600 hover:underline">כל הפרויקטים</Link>
            </div>
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <p className="text-slate-400 text-sm">אין פרויקטים עדיין</p>
                <Link href="/projects" className="mt-3 inline-block text-sm text-blue-600 hover:underline">צור פרויקט ראשון</Link>
              </div>
            ) : (
              projects.map(p => {
                const health = projectHealth(p, settings);
                const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
                return (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                        {p.end_date && <p className="text-xs text-slate-400 mt-0.5">🏁 {new Date(p.end_date).toLocaleDateString('he-IL')}</p>}
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded-lg font-semibold ${healthColor[health]}`}>
                        {healthDot[health]} {health === 'green' ? 'תקין' : health === 'yellow' ? 'לתשומת לב' : 'דורש טיפול'}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>התקדמות</span>
                        <span>{p.done_count}/{p.task_count} משימות</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${health === 'red' ? 'bg-red-500' : health === 'yellow' ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-slate-50 border-slate-200 text-slate-500',
  };
  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
