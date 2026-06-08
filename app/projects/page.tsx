'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectForm from '@/components/ProjectForm';

type Project = { id: number; name: string; description: string; status: string; location: string; developer: string; start_date: string; end_date: string; task_count: number; done_count: number; open_findings: number };

const statusLabel: Record<string, string> = { active: 'פעיל', completed: 'הושלם', paused: 'מושהה' };
const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-800 border-green-200', completed: 'bg-blue-100 text-blue-800 border-blue-200', paused: 'bg-yellow-100 text-yellow-800 border-yellow-200' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    const res = await fetch('/api/projects');
    setProjects(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const del = async (id: number, name: string) => {
    if (!confirm(`למחוק את הפרויקט "${name}"?`)) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📁 פרויקטים</h1>
          <p className="text-slate-500 text-sm mt-0.5">{projects.length} פרויקטים סה"כ</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d5a9e] transition active:scale-95">
          + פרויקט חדש
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[['all', 'הכל'], ['active', 'פעיל'], ['paused', 'מושהה'], ['completed', 'הושלם']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`shrink-0 text-sm px-4 py-1.5 rounded-full border font-medium transition ${filter === v ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-20">טוען...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-slate-500 mb-4">{projects.length === 0 ? 'אין פרויקטים עדיין' : 'אין פרויקטים בסינון זה'}</p>
          {projects.length === 0 && (
            <button onClick={() => setShowForm(true)} className="bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl hover:bg-[#2d5a9e] transition">צור פרויקט ראשון</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                <Link href={`/projects/${p.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-bold text-slate-800 leading-tight flex-1">{p.name}</h2>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[p.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                  </div>
                  {p.location && <p className="text-xs text-slate-400 mb-1">📍 {p.location}</p>}
                  {p.developer && <p className="text-xs text-slate-400 mb-3">🏢 {p.developer}</p>}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>התקדמות</span>
                      <span>{p.done_count}/{p.task_count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1e3a5f] rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {p.end_date && <span className="text-slate-400">🏁 {new Date(p.end_date).toLocaleDateString('he-IL')}</span>}
                  </div>
                </Link>
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => del(p.id, p.name)} className="text-xs text-red-400 hover:text-red-600 transition">מחק</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <ProjectForm onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); fetch_(); }} />}
    </div>
  );
}
