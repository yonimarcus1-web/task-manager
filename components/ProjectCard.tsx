'use client';
import { Project } from '@/lib/types';

const statusLabel: Record<string, string> = { active: 'פעיל', completed: 'הושלם', paused: 'מושהה' };
const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
};

export default function ProjectCard({ project, onClick, onRefresh }: {
  project: Project; onClick: () => void; onRefresh: () => void;
}) {
  const progress = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`למחוק את הפרויקט "${project.name}"?`)) return;
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div onClick={onClick} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-98 cursor-pointer transition hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="font-bold text-slate-800 leading-tight flex-1">{project.name}</h2>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[project.status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabel[project.status] || project.status}
          </span>
        </div>

        {project.location && <p className="text-xs text-slate-400 mb-2">📍 {project.location}</p>}
        {project.developer && <p className="text-xs text-slate-400 mb-3">🏢 {project.developer}</p>}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>משימות</span>
            <span>{project.done_count}/{project.task_count}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex gap-3 text-xs">
          {project.open_findings > 0 && (
            <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium">
              ⚠️ {project.open_findings} ממצאים
            </span>
          )}
          {(project.total_income > 0 || project.total_expense > 0) && (
            <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg">
              💰 {(Number(project.total_income) - Number(project.total_expense)).toLocaleString()} ₪
            </span>
          )}
          {project.end_date && (
            <span className="text-slate-400">🏁 {new Date(project.end_date).toLocaleDateString('he-IL')}</span>
          )}
        </div>
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition py-1">מחק</button>
      </div>
    </div>
  );
}
