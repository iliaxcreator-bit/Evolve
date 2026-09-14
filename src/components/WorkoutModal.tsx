import React, { useState, useEffect } from 'react';
import { 
  X, 
  Dumbbell, 
  Flame, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Check, 
  ChevronRight 
} from 'lucide-react';
import { WorkoutConfig, WorkoutSession } from '../types';
import { getTbilisiTodayDate, formatSecondsToTimer } from '../utils/date';

interface WorkoutModalProps {
  workoutConfig: WorkoutConfig;
  onClose: () => void;
  onSaveSession: (session: Omit<WorkoutSession, 'id'>) => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  workoutConfig,
  onClose,
  onSaveSession,
}) => {
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = workoutConfig.rounds || 1;
  const [completedExercisesInRound, setCompletedExercisesInRound] = useState<Record<string, boolean>>({});
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  
  // Rest timer
  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Overall workout stopwatch
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTotalSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Interval rest countdown
  useEffect(() => {
    let restInterval: any = null;
    if (isRestActive && restSeconds > 0) {
      restInterval = setInterval(() => {
        setRestSeconds(s => {
          if (s <= 1) {
            setIsRestActive(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isRestActive, restSeconds]);

  const toggleExercise = (exId: string) => {
    const nextState = !completedExercisesInRound[exId];
    setCompletedExercisesInRound(prev => ({ ...prev, [exId]: nextState }));

    // Trigger 45 sec rest timer if an exercise is completed
    if (nextState && workoutConfig.restBetweenExercisesSec) {
      setRestSeconds(workoutConfig.restBetweenExercisesSec);
      setIsRestActive(true);
    }
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(r => r + 1);
      setCompletedExercisesInRound({});
      // Trigger 90 sec round rest
      if (workoutConfig.restBetweenRoundsSec) {
        setRestSeconds(workoutConfig.restBetweenRoundsSec);
        setIsRestActive(true);
      }
    }
  };

  const handleFinishWorkout = () => {
    setIsTimerRunning(false);
    onSaveSession({
      date: getTbilisiTodayDate(),
      workoutType: workoutConfig.type,
      durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      completedRounds: currentRound,
      notes: notes || `Completed ${currentRound} rounds of ${workoutConfig.name}`,
      completedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase text-orange-400">
            <Flame className="w-4 h-4 fill-current" />
            <span>კალისტენიკა & ათლეტური ვარჯიში</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
            {workoutConfig.name}
          </h2>
          <p className="text-xs text-neutral-400">
            {workoutConfig.focus}
          </p>
        </div>

        {/* Time & Round Metric Row */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-[10px] font-mono uppercase text-neutral-500">ვარჯიშის დრო</div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {formatSecondsToTimer(totalSeconds)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-[10px] font-mono uppercase text-neutral-500">პროგრესი</div>
            <div className="text-xl font-bold font-mono text-orange-400">
              რაუნდი {currentRound} / {totalRounds}
            </div>
          </div>
        </div>

        {/* Active Rest Timer Banner */}
        {isRestActive && restSeconds > 0 && (
          <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-700/50 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-xs text-orange-300 font-medium">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>შესვენება აქტიურია</span>
            </div>
            <div className="font-mono text-lg font-bold text-orange-300">
              {restSeconds} წმ
            </div>
            <button
              onClick={() => setIsRestActive(false)}
              className="text-[11px] font-mono text-orange-400 hover:underline cursor-pointer"
            >
              გამოტოვება
            </button>
          </div>
        )}

        {/* Exercise List for current round */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase text-neutral-400 flex items-center justify-between">
            <span>რაუნდი {currentRound} — სავარჯიშოები</span>
            <span className="text-[10px] text-neutral-500">დააჭირეთ შესასრულებლად</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {workoutConfig.exercises.map(ex => {
              const isChecked = !!completedExercisesInRound[ex.id];
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-neutral-300'
                      : 'bg-neutral-900/80 border-neutral-850 text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-neutral-600'
                    }`}>
                      {isChecked && <Check className="w-3 h-3" />}
                    </span>
                    <div>
                      <span className={`text-xs font-semibold ${isChecked ? 'line-through text-neutral-500' : ''}`}>
                        {ex.name}
                      </span>
                      {ex.notes && (
                        <span className="block text-[10px] text-neutral-400">{ex.notes}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-orange-400 font-bold">
                    {ex.repsOrDuration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <input
            type="text"
            placeholder="ვარჯიშის ჩანაწერები (მაგ: სუფთა ტექნიკა, კარგი გამძლეობა)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-2">
          {currentRound < totalRounds ? (
            <button
              onClick={handleNextRound}
              className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-700"
            >
              <span>შემდეგი რაუნდი ({currentRound + 1}/{totalRounds})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}

          <button
            onClick={handleFinishWorkout}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ვარჯიშის დასრულება და შენახვა</span>
          </button>
        </div>

      </div>
    </div>
  );
};
