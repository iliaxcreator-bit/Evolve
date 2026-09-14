import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Dumbbell, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { EvolveState } from '../types';
import { 
  getTbilisiTodayDate, 
  formatGEL, 
  formatShortDate, 
  getTbilisiDayOfWeek 
} from '../utils/date';

interface CalendarViewProps {
  state: EvolveState;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ state }) => {
  const today = getTbilisiTodayDate();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Generate 14 days around today (7 days past, 7 days future)
  const [year, month, day] = today.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day);

  const days: { dateStr: string; dayName: string; isToday: boolean }[] = [];
  for (let i = -4; i <= 9; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;
    days.push({
      dateStr,
      dayName: getTbilisiDayOfWeek(dateStr),
      isToday: dateStr === today,
    });
  }

  // Items for the selected date
  const tasksForDate = state.tasks.filter(t => t.dueDate === selectedDate);
  const followUpsForDate = state.clients.filter(c => c.nextActionDate === selectedDate);
  const moneyActionsForDate = state.moneyActions.filter(m => m.date === selectedDate || m.deadline === selectedDate);
  const projectDeadlinesForDate = state.projects.filter(p => p.deadline === selectedDate);
  const workoutForDate = state.workoutSessions.filter(w => w.date === selectedDate);
  const dailyRecordForDate = state.dailyRecords.find(r => r.date === selectedDate);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>კალენდარი და განრიგი</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            სინქრონიზებულია თბილისის დროზე (Asia/Tbilisi)
          </p>
        </div>

        <button
          onClick={() => setSelectedDate(today)}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-medium border border-neutral-700 transition cursor-pointer self-start"
        >
          დღეს
        </button>
      </div>

      {/* Date Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
        {days.map(d => {
          const isSelected = d.dateStr === selectedDate;
          const dayShort = d.dayName.slice(0, 3);
          const dayNum = d.dateStr.split('-')[2];

          // count events
          const hasTask = state.tasks.some(t => t.dueDate === d.dateStr);
          const hasFollowUp = state.clients.some(c => c.nextActionDate === d.dateStr);
          const hasMoney = state.moneyActions.some(m => m.deadline === d.dateStr);

          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`p-3 rounded-xl border text-center transition min-w-[72px] shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-500/30'
                  : d.isToday
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-200 font-bold'
                  : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:bg-neutral-900'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider">{dayShort}</div>
              <div className="text-lg font-bold font-mono my-0.5">{dayNum}</div>
              <div className="flex items-center justify-center gap-1">
                {hasTask && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                {hasFollowUp && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                {hasMoney && <span className="w-1 h-1 rounded-full bg-blue-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase text-neutral-400">
              დღის განრიგი და ვალდებულებები:
            </span>
            <h2 className="text-lg font-bold text-neutral-100">
              {formatShortDate(selectedDate)} ({getTbilisiDayOfWeek(selectedDate)})
            </h2>
          </div>
          {selectedDate === today && (
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
              დღეს
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Tasks & Deadlines */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>დავალებები და ამოცანები ({tasksForDate.length})</span>
            </div>
            <div className="space-y-1.5">
              {tasksForDate.length > 0 ? (
                tasksForDate.map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between text-xs">
                    <span className={`text-neutral-200 ${t.status === 'Done' ? 'line-through text-neutral-500' : ''}`}>
                      {t.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                      {t.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">ამ თარიღისთვის დავალებები არ არის.</p>
              )}
            </div>
          </div>

          {/* Follow-ups & Client Actions */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>კლიენტებთან კომუნიკაცია (Follow-up) ({followUpsForDate.length})</span>
            </div>
            <div className="space-y-1.5">
              {followUpsForDate.length > 0 ? (
                followUpsForDate.map(c => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-semibold text-neutral-200">
                      <span>{c.name}</span>
                      {c.expectedRevenue > 0 && (
                        <span className="text-emerald-400 font-mono font-normal">
                          {formatGEL(c.expectedRevenue)}
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-400">{c.nextAction}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">კლიენტებთან კონტაქტი არ არის დაგეგმილი.</p>
              )}
            </div>
          </div>

          {/* Money Actions */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              <span>ფინანსური ოპერაციები ({moneyActionsForDate.length})</span>
            </div>
            <div className="space-y-1.5">
              {moneyActionsForDate.length > 0 ? (
                moneyActionsForDate.map(m => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between text-xs">
                    <span className="text-neutral-200">{m.title}</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatGEL(m.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">ფინანსური ჩანაწერები არ არის.</p>
              )}
            </div>
          </div>

          {/* Project Deadlines */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>პროექტის ვადები ({projectDeadlinesForDate.length})</span>
            </div>
            <div className="space-y-1.5">
              {projectDeadlinesForDate.length > 0 ? (
                projectDeadlinesForDate.map(p => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850 text-xs">
                    <span className="font-semibold text-neutral-200">{p.name}</span>
                    <span className="text-neutral-400 block text-[11px]">{p.description}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">პროექტის ვადები არ არის.</p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
