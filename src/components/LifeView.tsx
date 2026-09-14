import React, { useState } from 'react';
import { 
  HeartPulse, 
  Dumbbell, 
  Clock, 
  Lightbulb, 
  Layers, 
  Flame, 
  Plus, 
  Check, 
  ArrowRight, 
  Calendar, 
  Tag, 
  Sliders 
} from 'lucide-react';
import { EvolveState, LifeAreaName, Idea, IdeaStatus, WorkoutConfig } from '../types';
import { getTbilisiDayOfWeek, getTbilisiTodayDate } from '../utils/date';

interface LifeViewProps {
  state: EvolveState;
  onStartWorkout: (workoutType: string) => void;
  onAddIdea: (idea: Omit<Idea, 'id' | 'date'>) => void;
  onUpdateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  onConvertIdeaToTask: (ideaId: string) => void;
  onOpenQuickAdd: (type: 'Idea') => void;
}

export const LifeView: React.FC<LifeViewProps> = ({
  state,
  onStartWorkout,
  onAddIdea,
  onUpdateIdeaStatus,
  onConvertIdeaToTask,
  onOpenQuickAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'Fitness' | 'Routine' | 'Ideas' | 'Areas'>('Fitness');
  const [selectedDay, setSelectedDay] = useState<string>(getTbilisiDayOfWeek());
  const todayDate = getTbilisiTodayDate();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const activeWorkoutConfig = state.workoutConfigs[selectedDay];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <span>LIFE, FITNESS & ROUTINE</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            Physical conditioning, daily schedule rhythm, idea capture, and life areas
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800 overflow-x-auto no-scrollbar">
          {(['Fitness', 'Routine', 'Ideas', 'Areas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
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

      {/* TAB 1: FITNESS & WORKOUT PROGRAM */}
      {activeTab === 'Fitness' && (
        <div className="space-y-6">
          {/* Day of Week Selector */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {daysOfWeek.map(day => {
              const isToday = day === getTbilisiDayOfWeek();
              const isSelected = day === selectedDay;
              const config = state.workoutConfigs[day];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono transition text-left shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 font-bold ring-1 ring-orange-500/40'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{day.slice(0, 3)}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate max-w-[90px]">
                    {config?.type || 'Rest'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Workout Card */}
          {activeWorkoutConfig && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-orange-400">
                    <Dumbbell className="w-4 h-4" />
                    <span>{selectedDay} • {activeWorkoutConfig.type}</span>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-100 pt-1">
                    {activeWorkoutConfig.name}
                  </h2>
                  <p className="text-xs text-neutral-400 pt-0.5">
                    {activeWorkoutConfig.focus}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {activeWorkoutConfig.rounds && (
                    <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300">
                      <strong>{activeWorkoutConfig.rounds}</strong> Rounds
                    </div>
                  )}
                  {activeWorkoutConfig.restBetweenExercisesSec && (
                    <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300">
                      <strong>{activeWorkoutConfig.restBetweenExercisesSec}s</strong> Rest
                    </div>
                  )}
                  <button
                    onClick={() => onStartWorkout(activeWorkoutConfig.type)}
                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Start Session</span>
                  </button>
                </div>
              </div>

              {/* Exercises List */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-mono uppercase text-neutral-400">
                  Exercises & Prescribed Form
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeWorkoutConfig.exercises.map((ex, idx) => (
                    <div key={ex.id} className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-850 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-200">
                          {idx + 1}. {ex.name}
                        </span>
                        <span className="text-xs font-mono text-orange-400 font-bold">
                          {ex.repsOrDuration}
                        </span>
                      </div>
                      {ex.notes && (
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {ex.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout History */}
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <div className="text-xs font-mono uppercase text-neutral-400">
                  Recent Workout Logs
                </div>
                <div className="space-y-1.5">
                  {state.workoutSessions.length > 0 ? (
                    state.workoutSessions.map(ws => (
                      <div key={ws.id} className="p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-850 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-semibold text-neutral-200">{ws.workoutType}</span>
                          <span className="text-neutral-500 font-mono text-[11px]">({ws.date})</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-neutral-400 text-[11px]">
                          <span>{ws.completedRounds} rounds</span>
                          <span>{ws.durationMinutes} min</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500">No workout sessions logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROUTINE ENGINE */}
      {activeTab === 'Routine' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase">
            DAILY EXECUTIVE CHRONO-ROUTINE (07:30 – 23:00)
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 divide-y divide-neutral-800">
            {state.routine.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-850/40 transition">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-850">
                    {item.startTime} – {item.endTime}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-neutral-200">{item.title}</div>
                    {item.priorityFocus && (
                      <div className="text-xs text-amber-400/90 pt-0.5">Focus: {item.priorityFocus}</div>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  item.category === 'Revenue'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : item.category === 'Fitness'
                    ? 'bg-orange-950 text-orange-300 border border-orange-800'
                    : item.category === 'Focus'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: IDEAS INBOX */}
      {activeTab === 'Ideas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase">
              IDEAS INBOX & TRIAGE ({state.ideas.length})
            </span>
            <button
              onClick={() => onOpenQuickAdd('Idea')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Idea</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {state.ideas.map(idea => (
              <div
                key={idea.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {idea.area}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {idea.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-neutral-100">
                    {idea.title}
                  </h4>
                  {idea.description && (
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {idea.description}
                    </p>
                  )}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {idea.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                  <span className="text-[10px] font-mono text-neutral-500">{idea.date}</span>
                  {idea.status !== 'Converted' && (
                    <button
                      onClick={() => onConvertIdeaToTask(idea.id)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <span>Convert to Task</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AREAS OF LIFE */}
      {activeTab === 'Areas' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase">
            AREAS OF LIFE (STABLE PILLARS)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.areas.map(area => {
              const goalsInArea = state.goals.filter(g => g.area === area.name);
              const projectsInArea = state.projects.filter(p => p.area === area.name);

              return (
                <div key={area.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-100">{area.name}</h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-xs text-neutral-400">{area.description}</p>
                  <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-neutral-500">
                    <span>{goalsInArea.length} Goals</span>
                    <span>•</span>
                    <span>{projectsInArea.length} Projects</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
