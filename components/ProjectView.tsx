'use client';
import { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import { Task } from './TaskForm';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import ProjectForm from './ProjectForm';
import ContractorList from './ContractorList';
import FindingsList from './FindingsList';
import FinancialView from './FinancialView';

type Tab = 'tasks' | 'findings' | 'contractors' | 'finance';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'tasks', label: 'משימות', icon: '📋' },
  { id: 'findings', label: 'ממצאים', icon: '🔍' },
  { id: 'contractors', label: 'קבלנים', icon: '🔨' },
  { id: 'finance', label: 'כספים', icon: '💰' },
];

const statusBadge: Record<string, string> = { active: 'bg-green-100 text-green-800', completed: 'bg-blue-100 text-blue-800', paused: 'bg-yellow-100 text-yellow-800' };
const statusLabel: Record<string, string> = { active: 'פעיל', completed: 'הושלם', paused: 'מושהה' };

export default function ProjectView({ project, onBack }: { project: Project; onBack: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchTasks = async () => {
    const res = await fetch(`/api/projects/${project.id}/tasks`);
    setTasks(await res.json());
  };
  useEffect(() => { fetchTasks(); }, []);

  const rootTasks = tasks.filter(t => t.parent_id === null);
  const filtered = filterStatus === 'all' ? rootTasks : rootTasks.filter(t => t.status === filterStatus);
  const getSubtasks = (id: number) => tasks.filter(t => t.parent_id === id);
  const overdue = rootTasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white px-4 py-3 shadow sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-600 transition shrink-0">
              ←
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold truncate leading-tight">{project.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[project.status]}`}>
                  {statusLabel[project.status]}
                </span>
                {project.location && <span className="text-xs text-blue-200 truncate">📍 {project.location}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowEditProject(true)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-600 transition text-lg">✏️</button>
              {activeTab === 'tasks' && (
                <button onClick={() => setShowTaskForm(true)} className="bg-white text-blue-700 font-semibold px-3 py-2 rounded-xl text-sm hover:bg-blue-50 transition active:scale-95">
                  + משימה
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick stats bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="max-w-3xl mx-auto flex gap-4 text-xs text-slate-500 overflow-x-auto">
          <span>✅ {tasks.filter(t => t.status === 'done' && !t.parent_id).length}/{rootTasks.length} הושלם</span>
          {overdue > 0 && <span className="text-red-500 font-medium">⚠️ {overdue} באיחור</span>}
          {project.developer && <span>🏢 {project.developer}</span>}
          {project.end_date && <span>🏁 {new Date(project.end_date).toLocaleDateString('he-IL')}</span>}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-[68px] z-10">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${activeTab === tab.id ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <span className="hidden sm:inline">{tab.icon} </span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 pb-8">
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {/* Status filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[['all','הכל'],['pending','ממתין'],['in_progress','בביצוע'],['done','הושלם']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${filterStatus === v ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-slate-500 text-sm">
                  {rootTasks.length === 0 ? 'אין משימות עדיין — לחץ "+ משימה"' : 'אין משימות בסינון זה'}
                </p>
              </div>
            ) : (
              filtered.map(task => (
                <TaskItem key={task.id} task={task} subtasks={getSubtasks(task.id)} projectId={project.id} onRefresh={fetchTasks} />
              ))
            )}
          </div>
        )}

        {activeTab === 'findings' && <FindingsList projectId={project.id} />}
        {activeTab === 'contractors' && <ContractorList projectId={project.id} />}
        {activeTab === 'finance' && <FinancialView projectId={project.id} />}
      </div>

      {showTaskForm && (
        <TaskForm projectId={project.id} onClose={() => setShowTaskForm(false)} onSave={() => { setShowTaskForm(false); fetchTasks(); }} />
      )}
      {showEditProject && (
        <ProjectForm initial={project} onClose={() => setShowEditProject(false)} onSave={() => { setShowEditProject(false); onBack(); }} />
      )}
    </div>
  );
}
