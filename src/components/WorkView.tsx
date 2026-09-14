import React, { useState } from 'react';
import { 
  Briefcase, 
  Target, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  Clock, 
  Star, 
  Filter, 
  ChevronRight, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { EvolveState, Project, Task, Goal, LifeAreaName } from '../types';
import { formatGEL, getDaysDifference, getTbilisiTodayDate } from '../utils/date';

interface WorkViewProps {
  state: EvolveState;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onSetWeeklyMainProject: (projectId: string) => void;
  onToggleDeliverable: (projectId: string, deliverableId: string) => void;
  onOpenQuickAdd: (type: 'Task' | 'Project' | 'Goal') => void;
  onSelectProject?: (projectId: string) => void;
}

export const WorkView: React.FC<WorkViewProps> = ({
  state,
  onUpdateTaskStatus,
  onSetWeeklyMainProject,
  onToggleDeliverable,
  onOpenQuickAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'Projects' | 'Tasks' | 'Goals'>('Projects');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('All');
  const today = getTbilisiTodayDate();

  const areas: LifeAreaName[] = [
    'Business', 'Money', 'Health', 'Fitness', 'Learning', 'Relationships', 'Personal', 'Creative', 'Systems'
  ];

  // Filtered projects
  const filteredProjects = state.projects.filter(p => {
    if (selectedAreaFilter !== 'All' && p.area !== selectedAreaFilter) return false;
    return true;
  });

  // Filtered tasks
  const filteredTasks = state.tasks.filter(t => {
    if (selectedAreaFilter !== 'All' && t.area !== selectedAreaFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* View Header & Sub-nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <span>WORK & EXECUTION</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            Projects, tasks, and strategic goals connected to daily outcomes
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {(['Projects', 'Tasks', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Area Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Area:
        </span>
        <button
          onClick={() => setSelectedAreaFilter('All')}
          className={`px-2.5 py-1 rounded-full text-xs font-mono transition cursor-pointer ${
            selectedAreaFilter === 'All'
              ? 'bg-neutral-200 text-neutral-900 font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-850'
          }`}
        >
          All
        </button>
        {areas.map(area => (
          <button
            key={area}
            onClick={() => setSelectedAreaFilter(area)}
            className={`px-2.5 py-1 rounded-full text-xs font-mono transition whitespace-nowrap cursor-pointer ${
              selectedAreaFilter === area
                ? 'bg-neutral-200 text-neutral-900 font-bold'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-850'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* TAB 1: PROJECTS */}
      {activeTab === 'Projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase">
              ACTIVE & PLANNED PROJECTS ({filteredProjects.length})
            </span>
            <button
              onClick={() => onOpenQuickAdd('Project')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map(proj => {
              const deliverables = proj.deliverables || [];
              const completedCount = deliverables.filter(d => d.completed).length;
              const progressPct = deliverables.length > 0
                ? Math.round((completedCount / deliverables.length) * 100)
                : 0;
              const daysDiff = getDaysDifference(proj.deadline, today);

              return (
                <div
                  key={proj.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 transition ${
                    proj.isWeeklyMainProject
                      ? 'border-cyan-500/40 bg-cyan-950/10 ring-1 ring-cyan-500/20'
                      : proj.status === 'Blocked'
                      ? 'border-rose-900/40 bg-rose-950/10'
                      : 'border-neutral-800 bg-neutral-900/70'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            proj.status === 'Active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : proj.status === 'Blocked'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {proj.status}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            {proj.area}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-neutral-100 pt-1">
                          {proj.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => onSetWeeklyMainProject(proj.id)}
                        className={`p-1.5 rounded transition cursor-pointer flex items-center gap-1 text-xs ${
                          proj.isWeeklyMainProject
                            ? 'text-cyan-400 bg-cyan-950 border border-cyan-800'
                            : 'text-neutral-500 hover:text-neutral-300 bg-neutral-800'
                        }`}
                        title="Set as Weekly Main Project"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px] font-mono hidden sm:inline">
                          {proj.isWeeklyMainProject ? 'MAIN' : 'Set Main'}
                        </span>
                      </button>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Next Action Box */}
                    {proj.nextAction && (
                      <div className="rounded-lg bg-neutral-950/80 border border-neutral-800 p-2.5 text-xs">
                        <div className="text-[10px] font-mono text-neutral-500 uppercase">Immediate Next Action</div>
                        <div className="text-neutral-200 font-medium pt-0.5">{proj.nextAction}</div>
                      </div>
                    )}

                    {/* Deliverables Checklist */}
                    {deliverables.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                          <span>DELIVERABLES ({completedCount}/{deliverables.length})</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="space-y-1">
                          {deliverables.map(d => (
                            <div
                              key={d.id}
                              onClick={() => onToggleDeliverable(proj.id, d.id)}
                              className="flex items-center justify-between p-2 rounded bg-neutral-950/50 hover:bg-neutral-850 text-xs transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  d.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-neutral-600'
                                }`}>
                                  {d.completed && <Check className="w-2.5 h-2.5" />}
                                </span>
                                <span className={d.completed ? 'line-through text-neutral-500' : 'text-neutral-300'}>
                                  {d.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-[11px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due {proj.deadline} ({daysDiff >= 0 ? `${daysDiff}d left` : `${Math.abs(daysDiff)}d overdue`})</span>
                    </span>
                    <span className="text-neutral-500">Priority: {proj.priority}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'Tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase">
              ALL TASKS ({filteredTasks.length})
            </span>
            <button
              onClick={() => onOpenQuickAdd('Task')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {filteredTasks.map(task => {
                const isDone = task.status === 'Done';
                const daysDiff = getDaysDifference(task.dueDate, today);
                const isOverdue = daysDiff < 0 && !isDone;

                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 sm:p-4 hover:bg-neutral-850/50 transition gap-3 ${
                      isDone ? 'opacity-50' : isOverdue ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, isDone ? 'Todo' : 'Done')}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-neutral-600 hover:border-emerald-400'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                      </button>

                      <div className="space-y-0.5">
                        <div className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-neutral-500">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                            Due {task.dueDate}
                          </span>
                          <span>•</span>
                          <span>{task.area}</span>
                          {task.expectedRevenue && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">
                                {formatGEL(task.expectedRevenue)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        task.priority === 'Critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : task.priority === 'High'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOALS */}
      {activeTab === 'Goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase">
              STRATEGIC GOALS ({state.goals.length})
            </span>
            <button
              onClick={() => onOpenQuickAdd('Goal')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.goals.map(goal => (
              <div
                key={goal.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {goal.area}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      {goal.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-100">
                    {goal.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {goal.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Progress</span>
                    <span className="font-bold text-neutral-200">{goal.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                  {goal.targetMetric && (
                    <div className="text-[11px] text-neutral-500 font-mono pt-1">
                      Target: {goal.targetMetric}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
