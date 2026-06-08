'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Task } from '@/components/tasks/TaskDetail';
import TaskList from '@/components/tasks/TaskList';
import TaskKanban from '@/components/tasks/TaskKanban';
import TaskGantt from '@/components/tasks/TaskGantt';
import ProjectForm from '@/components/ProjectForm';

type Project = { id: number; name: string; description: string; status: string; location: string; developer: string; start_date: string; end_date: string; task_count: number; done_count: number };

type View = 'list' | 'kanban' | 'gantt';
const statusLabel: Record<string, string> = { active: 'פעיל', completed: 'הושלם', paused: 'מושהה' };
const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', paused: 'bg-yellow-100 text-yellow-700' };

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const openTaskId = undefined;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>('list');
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [p, t] = await Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/tasks`).then(r => r.json()),
    ]);
    setProject(p);
    setTasks(t);
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, [id]);

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const rootTasks = tasks.filter(t => t.parent_id === null);
    const rows = rootTasks.map(t => ({
      'כותרת': t.title,
      'סטטוס': ({ pending: 'ממתין', in_progress: 'בביצוע', done: 'הושלם' })[t.status] || t.status,
      'עדיפות': ({ high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' })[t.priority] || t.priority,
      'סוג': t.task_type,
      'אחראי': t.assigned_to || '',
      'תאריך התחלה': t.start_date ? new Date(t.start_date).toLocaleDateString('he-IL') : '',
      'תאריך יעד': t.due_date ? new Date(t.due_date).toLocaleDateString('he-IL') : '',
      'הושלם': t.completed_at ? new Date(t.completed_at).toLocaleDateString('he-IL') : '',
      'תיאור': t.description || '',
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'משימות');
    writeFile(wb, `${project?.name}-משימות.xlsx`);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">טוען...</div>;
  if (!project) return <div className="p-6 text-red-500">פרויקט לא נמצא</div>;

  const progress = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
  const rootTasks = tasks.filter(t => t.parent_id === null);
  const overdue = rootTasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <Link href="/" className="hover:text-slate-600">דשבורד</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-slate-600">פרויקטים</Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-slate-800 truncate">{project.name}</h1>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[project.status]}`}>
                {statusLabel[project.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              {project.developer && <span>🏢 {project.developer}</span>}
              {project.location && <span>📍 {project.location}</span>}
              {project.start_date && <span>📅 {new Date(project.start_date).toLocaleDateString('he-IL')}</span>}
              {project.end_date && <span>🏁 {new Date(project.end_date).toLocaleDateString('he-IL')}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowEdit(true)} className="text-sm border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition">✏️ עריכה</button>
            <button onClick={exportExcel} className="text-sm border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition">📥 אקסל</button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1e3a5f]">{rootTasks.filter(t => t.status === 'done').length}/{rootTasks.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">משימות</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${overdue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{overdue}</p>
            <p className="text-xs text-slate-500 mt-0.5">באיחור</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1e3a5f]">{progress}%</p>
            <p className="text-xs text-slate-500 mt-0.5">הושלם</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1e3a5f] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* View selector */}
      <div className="flex gap-2 mb-5">
        {([['list', '📋 רשימה'], ['kanban', '⊞ קנבן'], ['gantt', '📅 גאנט']] as [View, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${view === v ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Task views */}
      {view === 'list' && <TaskList tasks={tasks} projectId={project.id} onRefresh={fetchAll} openTaskId={openTaskId} />}
      {view === 'kanban' && <TaskKanban tasks={tasks} projectId={project.id} onRefresh={fetchAll} />}
      {view === 'gantt' && <TaskGantt tasks={tasks} projectId={project.id} onRefresh={fetchAll} />}

      {showEdit && (
        <ProjectForm initial={project} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); fetchAll(); }} />
      )}
    </div>
  );
}
