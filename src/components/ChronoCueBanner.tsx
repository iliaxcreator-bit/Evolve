import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Flame, 
  Play, 
  Dumbbell, 
  CheckCircle2, 
  Bell, 
  BellOff, 
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { RoutineItem } from '../types';
import { getCurrentRoutineBlock } from '../services/smartEngine';

interface ChronoCueBannerProps {
  routine: RoutineItem[];
  onStartFocus: () => void;
  onStartWorkout: () => void;
  onOpenEndDay: () => void;
  onOpenLiveVoice: () => void;
}

export function ChronoCueBanner({
  routine,
  onStartFocus,
  onStartWorkout,
  onOpenEndDay,
  onOpenLiveVoice,
}: ChronoCueBannerProps) {
  const [currentData, setCurrentData] = useState(() => getCurrentRoutineBlock(routine));
  const currentBlock = currentData.currentBlock;
  const minsLeft = currentData.minutesRemainingInBlock;

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // Re-check block every 15 seconds
  useEffect(() => {
    const update = () => {
      const data = getCurrentRoutineBlock(routine);
      setCurrentData(data);
    };

    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, [routine]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        new Notification('EVOLVE OS // Chrono Cue Activated', {
          body: `Live routine monitoring active for Tbilisi time. Current block: ${currentBlock?.title || 'Active'}`,
          icon: '/favicon.ico',
        });
      }
    }
  };

  if (!currentBlock) return null;

  const isRevenueBlock = currentBlock.category === 'Revenue';
  const isFitnessBlock = currentBlock.category === 'Fitness';
  const isReviewBlock = currentBlock.category === 'Review';
  const isFocusBlock = currentBlock.category === 'Focus';

  const categoryLabels: Record<string, string> = {
    'Revenue': 'ფინანსები',
    'Fitness': 'ვარჯიში',
    'Review': 'შეჯამება',
    'Focus': 'ღრმა ფოკუსი',
    'Personal': 'პირადი',
    'Health': 'ჯანმრთელობა',
  };

  return (
    <div className={`w-full border-b transition-colors ${
      isRevenueBlock 
        ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' 
        : isFitnessBlock 
        ? 'bg-orange-950/30 border-orange-500/30 text-orange-200' 
        : isReviewBlock 
        ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
        : 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Routine Block Details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isRevenueBlock ? 'bg-amber-400 animate-ping' : isFitnessBlock ? 'bg-orange-400 animate-bounce' : 'bg-emerald-400'
            }`} />
            <span className="text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-black/40 border border-white/10">
              {categoryLabels[currentBlock.category] || currentBlock.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white tracking-tight">
              {currentBlock.title}
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">
              ({currentBlock.startTime} – {currentBlock.endTime})
            </span>
          </div>

          {minsLeft > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-neutral-300">
              {minsLeft} წთ დარჩა
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Alert Toggle */}
          <button
            onClick={requestNotificationPermission}
            title={notificationsEnabled ? 'შეტყობინებები ჩართულია' : 'ბრაუზერის შეტყობინებების ჩართვა'}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10 text-neutral-300 hover:text-white transition text-xs"
          >
            {notificationsEnabled ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5 text-neutral-400" />}
          </button>

          {/* Spar with Chief of Staff */}
          <button
            onClick={onOpenLiveVoice}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>ხმოვანი სპარინგი</span>
          </button>

          {/* Primary Block Action */}
          {isRevenueBlock && (
            <button
              onClick={onStartFocus}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black transition shadow cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ფინანსური ფოკუსი</span>
            </button>
          )}

          {isFitnessBlock && (
            <button
              onClick={onStartWorkout}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-orange-400 hover:bg-orange-300 text-black transition shadow cursor-pointer"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>ვარჯიშის დაწყება</span>
            </button>
          )}

          {isReviewBlock && (
            <button
              onClick={onOpenEndDay}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-400 hover:bg-purple-300 text-black transition shadow cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>დღის შეჯამება</span>
            </button>
          )}

          {isFocusBlock && (
            <button
              onClick={onStartFocus}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-black transition shadow cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>ფოკუსის დაწყება</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
