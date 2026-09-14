import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  X, 
  Target, 
  HelpCircle, 
  Clock, 
  Sparkles, 
  Building, 
  Briefcase 
} from 'lucide-react';
import { RecommendedAction, Task, FocusSession } from '../types';
import { formatSecondsToTimer, formatGEL } from '../utils/date';

interface FocusModalProps {
  action?: RecommendedAction | null;
  onClose: () => void;
  onCompleteSession: (session: Omit<FocusSession, 'id'>) => void;
  onMarkActionDone: () => void;
}

export const FocusModal: React.FC<FocusModalProps> = ({
  action,
  onClose,
  onCompleteSession,
  onMarkActionDone,
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [startTime] = useState<string>(new Date().toISOString());

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleFinishAndComplete = () => {
    setIsActive(false);
    onCompleteSession({
      taskId: action?.type === 'task' ? action.actionableId : undefined,
      taskTitle: action?.title || 'Focused Execution',
      clientId: action?.clientId,
      projectId: action?.projectId,
      goalId: action?.goalId,
      startedAt: startTime,
      endedAt: new Date().toISOString(),
      durationSeconds: seconds,
      completed: true,
      notes: 'Completed in single-minded focus mode',
    });
    onMarkActionDone();
    onClose();
  };

  const handleExitWithoutComplete = () => {
    setIsActive(false);
    if (seconds > 30) {
      onCompleteSession({
        taskId: action?.type === 'task' ? action.actionableId : undefined,
        taskTitle: action?.title || 'Focused Session',
        clientId: action?.clientId,
        projectId: action?.projectId,
        goalId: action?.goalId,
        startedAt: startTime,
        endedAt: new Date().toISOString(),
        durationSeconds: seconds,
        completed: false,
        notes: 'Session paused/exited before task marked done',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-10 text-center space-y-8 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={handleExitWithoutComplete}
          className="absolute top-6 right-6 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Label */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-emerald-400 uppercase">
          <Target className="w-4 h-4 animate-pulse" />
          <span>ღრმა ფოკუსის კაბინა • 0 გაფანტვა</span>
        </div>

        {/* Main Task Heading */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight leading-tight">
            {action?.title || 'შეასრულეთ მთავარი საქმე'}
          </h2>

          {/* Context Pills */}
          <div className="flex items-center justify-center flex-wrap gap-2 text-xs">
            {action?.clientName && (
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
                კლიენტი: <strong>{action.clientName}</strong>
              </span>
            )}
            {action?.projectName && (
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
                პროექტი: <strong>{action.projectName}</strong>
              </span>
            )}
            {action?.expectedMoney && action.expectedMoney > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono font-bold">
                შემოსავალი: {formatGEL(action.expectedMoney)}
              </span>
            )}
          </div>
        </div>

        {/* WHY statement */}
        <div className="max-w-lg mx-auto p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 text-left space-y-1">
          <div className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>რატომ ახლა / სტრატეგიული მიზეზი</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-medium">
            {action?.georgianWhy || action?.reasons?.join(' + ') || 'უმაღლესი პრიორიტეტის ამოცანა განსაზღვრული ალგორითმით.'}
          </p>
        </div>

        {/* Stopwatch Timer Display */}
        <div className="space-y-2">
          <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-neutral-100">
            {formatSecondsToTimer(seconds)}
          </div>
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
            {isActive ? 'აქტიური ფოკუსის ხანგრძლივობა' : 'დაპაუზებულია'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            {isActive ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400 fill-current" />}
            <span>{isActive ? 'პაუზა' : 'გაგრძელება'}</span>
          </button>

          <button
            onClick={handleFinishAndComplete}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-neutral-950" />
            <span>შესრულებულად მონიშვნა & დასრულება</span>
          </button>
        </div>

      </div>
    </div>
  );
};
