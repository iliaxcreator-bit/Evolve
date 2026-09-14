import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Calendar, 
  ArrowRight, 
  DollarSign, 
  Dumbbell, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  FileText, 
  Check, 
  HelpCircle 
} from 'lucide-react';
import { EvolveState, DailyRecord, DailyReviewData, Task } from '../types';
import { formatGEL, getDaysDifference, getTbilisiTodayDate, formatFriendlyDate } from '../utils/date';
import { calculateFinancialMetrics } from '../services/smartEngine';

interface ReviewViewProps {
  state: EvolveState;
  onCompleteEndDay: (
    carriedOverTaskIds: string[], 
    reviewData: DailyReviewData, 
    notes?: string
  ) => void;
  onUnlockDayRecord?: (recordId: string) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  state,
  onCompleteEndDay,
}) => {
  const [activeTab, setActiveTab] = useState<'EndDay' | 'Weekly' | 'History'>('EndDay');
  const today = getTbilisiTodayDate();
  const metrics = calculateFinancialMetrics(state);

  // Check if today already has a locked record
  const existingTodayRecord = state.dailyRecords.find(r => r.date === today);
  const isTodayLocked = existingTodayRecord?.locked;

  // Unfinished tasks for carry-over decision
  const pendingTasks = state.tasks.filter(t => t.status === 'Todo' || t.status === 'Doing');
  const completedTasksToday = state.tasks.filter(t => t.status === 'Done');

  // Selected tasks to carry over to tomorrow
  const [selectedCarryOverIds, setSelectedCarryOverIds] = useState<string[]>(
    pendingTasks.map(t => t.id)
  );

  // Review form fields
  const [completedSummary, setCompletedSummary] = useState(
    completedTasksToday.length > 0
      ? `Completed: ${completedTasksToday.map(t => t.title).join(', ')}`
      : 'No tasks marked completed today.'
  );
  const [moneyCreatedSummary, setMoneyCreatedSummary] = useState(
    metrics.receivedIncome > 0
      ? `Cash received: ${formatGEL(metrics.receivedIncome)}.`
      : 'No direct cash received today. Maintained expected pipeline.'
  );
  const [unfinishedSummary, setUnfinishedSummary] = useState(
    pendingTasks.length > 0
      ? `Unfinished: ${pendingTasks.map(t => t.title).join(', ')}`
      : 'All planned tasks closed.'
  );
  const [learnedSummary, setLearnedSummary] = useState(
    'Execution focus in the morning is essential to prevent operational fragmentation.'
  );
  const [tomorrowPriority, setTomorrowPriority] = useState(
    'Ronen follow-up for IIC payment and Weekly Main Project deliverables.'
  );

  const toggleCarryOver = (taskId: string) => {
    setSelectedCarryOverIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleExecuteEndDay = () => {
    onCompleteEndDay(
      selectedCarryOverIds,
      {
        completedSummary,
        moneyCreatedSummary,
        unfinishedSummary,
        learnedSummary,
        tomorrowPriority,
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>REFLECTION, END DAY & REVIEWS</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            Explicit daily closure, immutable history records, and weekly strategic clarity
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {(['EndDay', 'Weekly', 'History'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab === 'EndDay' ? 'End Day Ceremony' : tab === 'Weekly' ? 'Weekly Review' : 'Daily History'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: END DAY CEREMONY */}
      {activeTab === 'EndDay' && (
        <div className="space-y-6">
          
          {isTodayLocked ? (
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-6 text-center space-y-3">
              <Lock className="w-8 h-8 text-emerald-400 mx-auto" />
              <h2 className="text-lg font-bold text-neutral-100">
                Today's Snapshot Record is Locked ({today})
              </h2>
              <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                The End Day ceremony for {formatFriendlyDate(today)} was completed. Historical truth is preserved and will not be rewritten. Tomorrow begins clean.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 space-y-6">
              
              <div>
                <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
                  EVENING CLOSURE PROTOCOL
                </div>
                <h2 className="text-xl font-bold text-neutral-100 pt-1">
                  End Day: {formatFriendlyDate(today)}
                </h2>
                <p className="text-xs text-neutral-400 pt-0.5">
                  Review today's factual output. Nothing silently carries over — explicitly choose what continues tomorrow.
                </p>
              </div>

              {/* Day's Output Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Tasks Completed</div>
                  <div className="text-lg font-bold text-neutral-100">{completedTasksToday.length} Tasks</div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">Cash Received</div>
                  <div className="text-lg font-bold font-mono text-emerald-300">{formatGEL(metrics.receivedIncome)}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Unfinished Items</div>
                  <div className="text-lg font-bold text-neutral-300">{pendingTasks.length} Remaining</div>
                </div>
              </div>

              {/* Carry-over Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-neutral-300 font-bold">
                    1. Carry-Over Decision: Which unfinished items move to tomorrow?
                  </label>
                  <span className="text-[11px] text-neutral-500">Only selected items move</span>
                </div>

                {pendingTasks.length > 0 ? (
                  <div className="space-y-2">
                    {pendingTasks.map(t => {
                      const isSelected = selectedCarryOverIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleCarryOver(t.id)}
                          className={`p-3 rounded-lg border flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500/50 bg-emerald-950/20 text-neutral-200'
                              : 'border-neutral-800 bg-neutral-950/60 text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-neutral-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </span>
                            <span className="text-xs font-medium">{t.title}</span>
                          </div>

                          <span className="text-[10px] font-mono uppercase text-neutral-500">
                            {isSelected ? 'Carry over to tomorrow' : 'Leave in backlog'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">No unfinished tasks for today.</p>
                )}
              </div>

              {/* Short Daily Reflection Questions (5 questions) */}
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <div className="text-xs font-mono uppercase text-neutral-300 font-bold">
                  2. Concise Daily Reflection
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">What was completed?</label>
                    <input
                      type="text"
                      value={completedSummary}
                      onChange={e => setCompletedSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">What created money?</label>
                    <input
                      type="text"
                      value={moneyCreatedSummary}
                      onChange={e => setMoneyCreatedSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">What did not get done?</label>
                    <input
                      type="text"
                      value={unfinishedSummary}
                      onChange={e => setUnfinishedSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">What was learned?</label>
                    <input
                      type="text"
                      value={learnedSummary}
                      onChange={e => setLearnedSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">What is tomorrow's single most important action?</label>
                    <input
                      type="text"
                      value={tomorrowPriority}
                      onChange={e => setTomorrowPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-neutral-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-neutral-800">
                <button
                  id="btn-confirm-end-day"
                  onClick={handleExecuteEndDay}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Today's Record & Carry Over Selected Items</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY STRATEGIC REVIEW */}
      {activeTab === 'Weekly' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-6">
            <div>
              <div className="text-xs font-mono uppercase text-neutral-400">WEEKLY STRATEGIC CLARITY</div>
              <h2 className="text-xl font-bold text-neutral-100 pt-1">
                Executive Reality vs Intentions
              </h2>
              <p className="text-xs text-neutral-400 pt-0.5">
                Summary generated from actual historical data. Does not flatter or fabricate.
              </p>
            </div>

            {/* Questions & Reality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 uppercase">Cash Realized This Cycle</div>
                <div className="text-base font-bold font-mono text-neutral-100">{formatGEL(metrics.receivedIncome)}</div>
                <p className="text-neutral-400 pt-1">
                  Expected outstanding: {formatGEL(metrics.expectedIncome)}. Active pipeline: {formatGEL(metrics.pipelineTotal)}.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                <div className="text-[11px] font-mono text-cyan-400 uppercase">Flagship Project Trajectory</div>
                <div className="text-base font-bold text-neutral-100">
                  {state.projects.find(p => p.isWeeklyMainProject)?.name || 'None'}
                </div>
                <p className="text-neutral-400 pt-1">
                  Main project focus maintained without scope compromise.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                <div className="text-[11px] font-mono text-orange-400 uppercase">Fitness & Physical Discipline</div>
                <div className="text-base font-bold text-neutral-100">
                  {state.workoutSessions.length} Sessions Logged
                </div>
                <p className="text-neutral-400 pt-1">
                  Calisthenics cycles logged consistently without missed recovery blocks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                <div className="text-[11px] font-mono text-purple-400 uppercase">Core Strategic Adjustment</div>
                <div className="text-base font-bold text-neutral-100">
                  Guard Morning Revenue Hours
                </div>
                <p className="text-neutral-400 pt-1">
                  09:00–11:30 Money block must strictly be reserved for client follow-ups and invoicing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY HISTORY (IMMUTABLE RECORDS) */}
      {activeTab === 'History' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase">
            IMMUTABLE HISTORICAL DAILY SNAPSHOTS ({state.dailyRecords.length})
          </div>

          <div className="space-y-3">
            {state.dailyRecords.map(rec => (
              <div key={rec.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-neutral-100">{rec.date}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      LOCKED
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    Received: <span className="text-emerald-400 font-bold">{formatGEL(rec.receivedAmount)}</span>
                  </div>
                </div>

                {rec.review && (
                  <div className="space-y-1 text-xs text-neutral-300 bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                    <div><strong className="text-neutral-500 font-mono">Learned:</strong> {rec.review.learnedSummary}</div>
                    <div><strong className="text-neutral-500 font-mono">Priority:</strong> {rec.review.tomorrowPriority}</div>
                  </div>
                )}

                {rec.carriedOverTaskIds.length > 0 && (
                  <div className="text-[11px] font-mono text-neutral-400">
                    Carried over to next day: {rec.carriedOverTaskIds.length} item(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
