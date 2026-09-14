import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Search, 
  Plus, 
  Target, 
  AlertCircle, 
  ShieldCheck, 
  RotateCcw, 
  Download, 
  Upload,
  Radio,
  FileText
} from 'lucide-react';
import { RoutineItem } from '../types';
import { 
  getTbilisiTodayDate, 
  getTbilisiTime24, 
  formatFriendlyDate, 
  getTimeOfDayGreeting 
} from '../utils/date';
import { getCurrentRoutineBlock } from '../services/smartEngine';

interface HeaderProps {
  routine: RoutineItem[];
  needsAttentionCount: number;
  onOpenQuickAdd: () => void;
  onOpenCommand: () => void;
  onOpenFocus: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onOpenLiveVoice?: () => void;
  onOpenExecutiveReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  routine,
  needsAttentionCount,
  onOpenQuickAdd,
  onOpenCommand,
  onOpenFocus,
  onResetData,
  onExportData,
  onImportData,
  onOpenLiveVoice,
  onOpenExecutiveReport,
}) => {
  const [time, setTime] = useState<string>(getTbilisiTime24());
  const [todayDate, setTodayDate] = useState<string>(getTbilisiTodayDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTbilisiTime24());
      setTodayDate(getTbilisiTodayDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { currentBlock, minutesRemainingInBlock } = getCurrentRoutineBlock(routine, time);
  const friendlyDate = formatFriendlyDate(todayDate);
  const greeting = getTimeOfDayGreeting();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-widest text-neutral-100 uppercase font-mono">
              EVOLVE OS
            </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="font-medium text-neutral-200">{friendlyDate}</span>
            <span className="text-neutral-600">•</span>
            <span className="font-mono text-neutral-300">{time}</span>
            <span className="text-neutral-500 text-[10px] font-medium tracking-wider">თბილისი</span>
          </div>
        </div>

        {/* Current Routine Indicator & Executive Quick Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Active Routine Block */}
          {currentBlock && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-neutral-800 bg-neutral-900/70 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-300 font-medium">{currentBlock.title}</span>
              {minutesRemainingInBlock > 0 && (
                <span className="text-[11px] font-mono text-neutral-500">
                  ({minutesRemainingInBlock} წთ დარჩა)
                </span>
              )}
            </div>
          )}

          {/* Attention Badge */}
          {needsAttentionCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{needsAttentionCount} ყურადღება</span>
            </div>
          )}

          {/* Chief of Staff Live Voice Trigger */}
          {onOpenLiveVoice && (
            <button
              id="header-btn-live-voice"
              onClick={onOpenLiveVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer shadow-sm"
              title="Chief of Staff — ცოცხალი ხმოვანი სპარინგი (Gemini Live)"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Chief of Staff</span>
              <span className="sm:hidden">Live</span>
            </button>
          )}

          {/* Executive Report Trigger */}
          {onOpenExecutiveReport && (
            <button
              id="header-btn-report"
              onClick={onOpenExecutiveReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition cursor-pointer"
              title="კვირის მმართველობითი რეპორტი და ანალიტიკა"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">რეპორტი</span>
            </button>
          )}

          {/* Focus Mode Trigger */}
          <button
            id="header-btn-focus"
            onClick={onOpenFocus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            title="ფოკუსის რეჟიმის გახსნა (ხელსაყრელი სამუშაო გარემო)"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">ფოკუსი</span>
          </button>

          {/* Command Search Shortcut */}
          <button
            id="header-btn-command"
            onClick={onOpenCommand}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-neutral-400 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition cursor-pointer"
            title="სწრაფი ბრძანებების პანელი (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px]">⌘K</span>
          </button>

          {/* Quick Add Button */}
          <button
            id="header-btn-quickadd"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm"
            title="სწრაფი დამატება (დავალება, კლიენტი, ლიდი, ფინანსები)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>დამატება +</span>
          </button>

          {/* Backup / State Tools Menu dropdown */}
          <div className="flex items-center border-l border-neutral-800 pl-2 gap-1 text-neutral-400">
            <button
              onClick={onExportData}
              className="p-1.5 hover:text-neutral-200 hover:bg-neutral-850 rounded text-xs transition cursor-pointer"
              title="მონაცემების ექსპორტი (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onImportData}
              className="p-1.5 hover:text-neutral-200 hover:bg-neutral-850 rounded text-xs transition cursor-pointer"
              title="მონაცემების იმპორტი (JSON)"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetData}
              className="p-1.5 hover:text-amber-400 hover:bg-neutral-850 rounded text-xs transition cursor-pointer"
              title="საწყის სატესტო მონაცემებზე დაბრუნება"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
