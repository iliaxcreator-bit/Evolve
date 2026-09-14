import React from 'react';
import { 
  Play, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Flame, 
  Dumbbell, 
  Briefcase, 
  DollarSign, 
  HelpCircle, 
  Plus, 
  Compass, 
  Target, 
  ChevronRight, 
  Lock, 
  Sparkles,
  Radio,
  FileText,
  Calendar
} from 'lucide-react';
import { 
  EvolveState, 
  Task, 
  MoneyAction, 
  Client, 
  Project, 
  NeedsAttentionItem, 
  RecommendedAction 
} from '../types';
import { 
  formatGEL, 
  getTbilisiTodayDate, 
  getDaysDifference, 
  formatFriendlyDate, 
  getTimeOfDayGreeting, 
  getTbilisiDayOfWeek,
  getGeorgianDayOfWeek 
} from '../utils/date';
import { 
  getNeedsAttention, 
  getNextBestAction, 
  getTodayDirection, 
  calculateFinancialMetrics, 
  getCurrentRoutineBlock 
} from '../services/smartEngine';

interface TodayViewProps {
  state: EvolveState;
  onUpdateTaskStatus: (taskId: string, newStatus: Task['status']) => void;
  onToggleMoneyAction: (actionId: string) => void;
  onStartFocus: (action?: RecommendedAction) => void;
  onStartWorkout: (workoutType: string) => void;
  onOpenQuickAdd: (defaultType?: 'Task' | 'MoneyAction') => void;
  onOpenEndDay: () => void;
  onSelectClient: (clientId: string) => void;
  onSelectProject: (projectId: string) => void;
  onDeferTask?: (taskId: string) => void;
  onOpenLiveVoice?: () => void;
  onOpenExecutiveReport?: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  state,
  onUpdateTaskStatus,
  onToggleMoneyAction,
  onStartFocus,
  onStartWorkout,
  onOpenQuickAdd,
  onOpenEndDay,
  onSelectClient,
  onSelectProject,
  onDeferTask,
  onOpenLiveVoice,
  onOpenExecutiveReport,
}) => {
  const todayDate = getTbilisiTodayDate();
  const dayOfWeekEn = getTbilisiDayOfWeek();
  const dayOfWeekGe = getGeorgianDayOfWeek(todayDate);
  const friendlyDate = formatFriendlyDate(todayDate);
  const greeting = getTimeOfDayGreeting();

  const attentionItems = getNeedsAttention(state, todayDate);
  const nextAction = getNextBestAction(state);
  const mainProject = state.projects.find(p => p.isWeeklyMainProject && p.status === 'Active') 
    || state.projects.find(p => p.status === 'Active');
  
  const direction = getTodayDirection(state, nextAction, mainProject);
  const financialMetrics = calculateFinancialMetrics(state);
  const { currentBlock, nextBlock, minutesRemainingInBlock } = getCurrentRoutineBlock(state.routine);

  // Today's Money Actions (Exactly 3, 1 major, 2 smaller)
  const todayMoneyActions = state.moneyActions.slice(0, 3);

  // Today's normal tasks
  const todayTasks = state.tasks.filter(t => {
    // Show tasks due today or overdue, or marked doing
    const diff = getDaysDifference(t.dueDate, todayDate);
    return diff <= 0 || t.status === 'Doing';
  });

  // Today's Workout from schedule
  const todayWorkoutConfig = state.workoutConfigs[dayOfWeekEn] || {
    type: 'Rest',
    name: 'დასვენების დღე',
    focus: 'აღდგენა და ენერგიის შევსება',
    exercises: [],
  };

  const isWorkoutCompletedToday = state.workoutSessions.some(ws => ws.date === todayDate);

  // Main project completion % derived from deliverables
  const deliverables = mainProject?.deliverables || [];
  const completedDeliverables = deliverables.filter(d => d.completed).length;
  const mainProjectProgress = deliverables.length > 0 
    ? Math.round((completedDeliverables / deliverables.length) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      
      {/* 1. DATE / CURRENT CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
            <span>{dayOfWeekGe}</span>
            <span>•</span>
            <span>{friendlyDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
            {greeting}.
          </h1>
        </div>

        {/* Routine Context Banner & Quick Executive Triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer shadow-sm"
              title="Chief of Staff — ცოცხალი ხმოვანი სპარინგი"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Chief of Staff (სპარინგი)</span>
            </button>
          )}

          {onOpenExecutiveReport && (
            <button
              onClick={onOpenExecutiveReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-750 transition cursor-pointer"
              title="კვირის მმართველობითი რეპორტი"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>კვირის რეპორტი</span>
            </button>
          )}

          {currentBlock && (
            <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-850 px-3.5 py-2 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <div>
                <div className="text-neutral-400 text-[11px]">მიმდინარე ბლოკი</div>
                <div className="text-neutral-200 font-medium">
                  {currentBlock.title} ({currentBlock.startTime}–{currentBlock.endTime})
                </div>
              </div>
              {minutesRemainingInBlock > 0 && (
                <span className="ml-2 font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]">
                  {minutesRemainingInBlock} წთ დარჩა
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. NEEDS ATTENTION (Decision filter) */}
      {attentionItems.length > 0 && (
        <section id="section-needs-attention" className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>ყურადღებას მოითხოვს · {attentionItems.length}</span>
            </div>
            <span className="text-[11px] text-rose-300/70 font-mono">
              ქრება მოქმედების შესრულებისთანავე
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 p-3 rounded-lg bg-neutral-900/90 border border-rose-900/30 hover:border-rose-700/60 transition group text-left"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300">
                      {item.category}
                    </span>
                    {item.amount && (
                      <span className="text-[11px] font-mono text-amber-400">
                        {formatGEL(item.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-200 font-medium line-clamp-2 leading-relaxed">
                    {item.title}
                  </p>
                </div>

                {item.targetType === 'task' && (
                  <button
                    onClick={() => onUpdateTaskStatus(item.targetId, 'Done')}
                    className="shrink-0 p-1.5 rounded hover:bg-emerald-950 hover:text-emerald-400 text-neutral-500 transition cursor-pointer"
                    title="შესრულებულად მონიშვნა"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                {item.targetType === 'client' && (
                  <button
                    onClick={() => onSelectClient(item.targetId)}
                    className="shrink-0 p-1.5 rounded hover:bg-neutral-800 text-neutral-400 transition cursor-pointer"
                    title="კლიენტის დეტალების ნახვა"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. NOW — THE CENTRAL INTELLIGENCE (Visually Dominant) */}
      <section id="section-now" className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20">
        
        {/* Visual Accent Top Marker */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold tracking-widest uppercase">
              ახლა / NOW
            </span>
            <span className="text-xs text-neutral-400">
              მიმდინარე უმთავრესი პრიორიტეტი
            </span>
          </div>

          {nextAction?.deadline && (
            <span className="text-xs font-mono text-amber-400/90 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
              დედლაინი: {nextAction.deadline === todayDate ? 'დღეს' : nextAction.deadline}
            </span>
          )}
        </div>

        {nextAction ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight leading-snug">
                {nextAction.title}
              </h2>

              {/* Context Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
                {nextAction.clientName && (
                  <div className="flex items-center gap-1.5 text-neutral-300 bg-neutral-800/60 px-2.5 py-1 rounded border border-neutral-700/60">
                    <span className="text-neutral-500">კლიენტი:</span>
                    <span className="font-semibold text-neutral-100">{nextAction.clientName}</span>
                  </div>
                )}
                {nextAction.expectedMoney && nextAction.expectedMoney > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/50 font-mono font-medium">
                    <span className="text-emerald-500">მოსალოდნელი:</span>
                    <span className="font-bold">{formatGEL(nextAction.expectedMoney)}</span>
                  </div>
                )}
                {nextAction.projectName && (
                  <div className="flex items-center gap-1.5 text-neutral-300 bg-neutral-800/60 px-2.5 py-1 rounded border border-neutral-700/60">
                    <span className="text-neutral-500">პროექტი:</span>
                    <span className="font-medium">{nextAction.projectName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* WHY / რატომ SECTION */}
            <div className="rounded-xl bg-neutral-950/80 border border-neutral-800 p-4 space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>რატომ ახლა? / WHY THIS NOW?</span>
              </div>
              <p className="text-sm font-medium text-neutral-200 leading-relaxed">
                {nextAction.georgianWhy || nextAction.reasons.join(' + ')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {nextAction.reasons.map((r, i) => (
                  <span key={i} className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    • {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center flex-wrap gap-3 pt-1">
              <button
                id="btn-start-focus-now"
                onClick={() => onStartFocus(nextAction)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ფოკუსის დაწყება</span>
              </button>

              <button
                id="btn-complete-now"
                onClick={() => {
                  if (nextAction.type === 'task') {
                    onUpdateTaskStatus(nextAction.actionableId, 'Done');
                  } else if (nextAction.type === 'moneyAction') {
                    onToggleMoneyAction(nextAction.actionableId);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-medium text-xs border border-neutral-700 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>შესრულებულად მონიშვნა</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm text-neutral-300 font-medium">დღევანდელი ყველა კრიტიკული მოქმედება შესრულებულია.</p>
            <p className="text-xs text-neutral-500">მზად ხართ კვირის მთავარ პროექტზე ან დღის შეჯამებაზე გადასასვლელად.</p>
          </div>
        )}
      </section>

      {/* 4. TODAY'S DIRECTION */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-neutral-800 text-amber-400 shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            დღის სტრატეგიული მიმართულება
          </div>
          <p className="text-sm sm:text-base font-semibold text-neutral-100 leading-snug">
            {direction.headline}
          </p>
          <p className="text-xs text-neutral-400 pt-0.5">
            {direction.subtitle}
          </p>
        </div>
      </section>

      {/* 5. THE 3 MONEY ACTIONS */}
      <section id="section-money-actions" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-200 font-mono">
              3 ფინანსური მოქმედება
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            1 მთავარი + 2 დამხმარე (შემოსავლის ფოკუსი)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {todayMoneyActions.map((ma, idx) => {
            const isDone = ma.status === 'Completed';
            const typeGe = ma.type === 'Received' ? 'მიღებული' : ma.type === 'Expected' ? 'მოსალოდნელი' : 'პოტენციური';
            return (
              <div
                key={ma.id}
                className={`rounded-xl p-4 border transition flex flex-col justify-between space-y-3 ${
                  ma.isMajor
                    ? 'border-amber-500/40 bg-amber-950/15 ring-1 ring-amber-500/20'
                    : 'border-neutral-800 bg-neutral-900/70'
                } ${isDone ? 'opacity-60 line-through' : ''}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs font-mono flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        ma.type === 'Received'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : ma.type === 'Expected'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {typeGe}
                      </span>
                    </div>

                    <span className="font-mono text-sm font-bold text-neutral-100">
                      {formatGEL(ma.amount)}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-neutral-200 leading-snug">
                    {ma.title}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {ma.isMajor ? '★ მთავარი ქმედება' : 'დამხმარე ქმედება'}
                  </span>

                  <button
                    onClick={() => onToggleMoneyAction(ma.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      isDone
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{isDone ? 'შესრულდა' : 'მონიშვნა'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Column Layout: Main Project & Today Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 6. WEEKLY MAIN PROJECT */}
        <section id="section-main-project" className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                კვირის მთავარი პროექტი
              </h3>
            </div>
            {mainProject?.deadline && (
              <span className="text-xs font-mono text-neutral-400">
                დედლაინი: {mainProject.deadline}
              </span>
            )}
          </div>

          {mainProject ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-semibold text-neutral-100">
                    {mainProject.name}
                  </h4>
                  <p className="text-xs text-neutral-400 pt-0.5">
                    {mainProject.description}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  {mainProjectProgress}% შესრულდა
                </span>
              </div>

              {/* Next Action */}
              {mainProject.nextAction && (
                <div className="rounded-lg bg-neutral-950/70 border border-neutral-800 p-3 text-xs space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">შემდეგი გადაუდებელი ნაბიჯი</div>
                  <div className="text-neutral-200 font-medium flex items-center justify-between">
                    <span>{mainProject.nextAction}</span>
                    <button
                      onClick={() => onSelectProject(mainProject.id)}
                      className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>დეტალები</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Deliverables Checklist */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono text-neutral-400 uppercase">მთავარი შედეგები (Deliverables)</div>
                {deliverables.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-900/40">
                    <span className={`text-neutral-300 ${d.completed ? 'line-through text-neutral-500' : ''}`}>
                      {d.title}
                    </span>
                    <span className={`text-[10px] font-mono ${d.completed ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {d.completed ? 'შესრულდა' : 'მოლოდინში'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">კვირის მთავარი პროექტი არ არის არჩეული.</p>
          )}
        </section>

        {/* 7. TODAY TASKS */}
        <section id="section-today-tasks" className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                დღის დავალებები · დარჩენილია {todayTasks.filter(t => t.status !== 'Done').length}
              </h3>
            </div>
            <button
              onClick={() => onOpenQuickAdd('Task')}
              className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>დამატება</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => {
                const isDone = task.status === 'Done';
                const daysDiff = getDaysDifference(task.dueDate, todayDate);
                const isOverdue = daysDiff < 0 && !isDone;

                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition ${
                      isDone
                        ? 'border-neutral-850 bg-neutral-950/40 opacity-60'
                        : isOverdue
                        ? 'border-rose-900/40 bg-rose-950/10'
                        : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, isDone ? 'Todo' : 'Done')}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-neutral-600 hover:border-emerald-400'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                      </button>

                      <div className="space-y-1">
                        <p className={`text-xs font-medium leading-snug ${isDone ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-neutral-500">
                          {isOverdue && (
                            <span className="text-rose-400 font-semibold">ვადაგადაცილებული</span>
                          )}
                          {task.expectedRevenue && (
                            <span className="text-emerald-400 font-medium">
                              {formatGEL(task.expectedRevenue)}
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                            {task.area}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Defer to Tomorrow Quick Action */}
                      {!isDone && onDeferTask && (
                        <button
                          onClick={() => onDeferTask(task.id)}
                          className="p-1.5 rounded text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition cursor-pointer"
                          title="ხვალისთვის გადატანა (+1 დღე)"
                        >
                          <Calendar className="w-3 h-3" />
                        </button>
                      )}

                      {/* Focus Mode Trigger */}
                      <button
                        onClick={() => onStartFocus({
                          id: task.id,
                          title: task.title,
                          type: 'task',
                          actionableId: task.id,
                          score: 100,
                          reasons: ['User initiated focus'],
                          georgianWhy: 'ფოკუსირებული შესრულება',
                        })}
                        className="p-1.5 rounded text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
                        title="ფოკუსის რეჟიმის დაწყება"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                <p>დღისთვის Task არ არის.</p>
                <button
                  onClick={() => onOpenQuickAdd('Task')}
                  className="mt-2 text-emerald-400 hover:underline cursor-pointer"
                >
                  + დავალების დამატება
                </button>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Routine & Workout Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 8. ROUTINE */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                დღის რუტინის რეჟიმი
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-500">ორიენტირი, არა შეზღუდვა</span>
          </div>

          <div className="space-y-2">
            {state.routine.slice(3, 8).map(item => {
              const isCurrent = currentBlock?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs border ${
                    isCurrent
                      ? 'border-amber-500/50 bg-amber-950/20 text-neutral-100 font-medium'
                      : 'border-neutral-850 bg-neutral-950/40 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-neutral-500">
                      {item.startTime}–{item.endTime}
                    </span>
                    <span className={isCurrent ? 'text-amber-300' : 'text-neutral-300'}>
                      {item.title}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                      აქტიურია
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. WORKOUT */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                დღის ვარჯიში · {dayOfWeekGe}
              </h3>
            </div>
            {isWorkoutCompletedToday ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                <Check className="w-3.5 h-3.5" />
                <span>დღეს შესრულებულია</span>
              </span>
            ) : (
              <span className="text-xs text-neutral-500 font-mono">
                დაგეგმილია 16:00
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-neutral-200">
                  {todayWorkoutConfig.name}
                </h4>
                <p className="text-xs text-neutral-400 pt-0.5">
                  {todayWorkoutConfig.focus}
                </p>
              </div>
              {todayWorkoutConfig.rounds && (
                <span className="px-2 py-0.5 rounded bg-orange-950/40 text-orange-300 border border-orange-800/40 text-[11px] font-mono">
                  {todayWorkoutConfig.rounds} რაუნდი
                </span>
              )}
            </div>

            {/* Exercise Preview */}
            <div className="space-y-1 pt-1">
              {todayWorkoutConfig.exercises.slice(0, 3).map(ex => (
                <div key={ex.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-950/40 text-neutral-300">
                  <span>{ex.name}</span>
                  <span className="font-mono text-neutral-500 text-[11px]">{ex.repsOrDuration}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                id="btn-start-workout"
                onClick={() => onStartWorkout(todayWorkoutConfig.type)}
                disabled={isWorkoutCompletedToday}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  isWorkoutCompletedToday
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-400 text-neutral-950 shadow-md'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>{isWorkoutCompletedToday ? 'დღევანდელი ვარჯიში შესრულებულია' : 'ვარჯიშის დაწყება'}</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* 10 & 11. BUSINESS & MONEY SNAPSHOTS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Business Pipeline Snapshot */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">ბიზნესი & CRM შეჯამება</span>
            <span className="text-[11px] text-neutral-500">Pipeline vs რეალობა</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
              <div className="text-[10px] text-neutral-500 uppercase">პაიპლაინი</div>
              <div className="text-sm font-bold text-neutral-200">{formatGEL(financialMetrics.pipelineTotal)}</div>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
              <div className="text-[10px] text-blue-400 uppercase">მოსალოდნელი</div>
              <div className="text-sm font-bold text-blue-300">{formatGEL(financialMetrics.expectedIncome)}</div>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
              <div className="text-[10px] text-emerald-400 uppercase">მიღებული</div>
              <div className="text-sm font-bold text-emerald-300">{formatGEL(financialMetrics.receivedIncome)}</div>
            </div>
          </div>
        </div>

        {/* Money Snapshot */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">ფინანსური კონტროლი</span>
            <span className="text-[11px] text-neutral-500">მხოლოდ ფაქტობრივი</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
              <div className="text-[10px] text-emerald-400 uppercase">მიღებული</div>
              <div className="text-sm font-bold text-emerald-300">{formatGEL(financialMetrics.receivedIncome)}</div>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
              <div className="text-[10px] text-rose-400 uppercase">ხარჯები</div>
              <div className="text-sm font-bold text-rose-300">{formatGEL(financialMetrics.expensesTotal)}</div>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
              <div className="text-[10px] text-neutral-400 uppercase">წმინდა ნაშთი</div>
              <div className={`text-sm font-bold ${financialMetrics.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatGEL(financialMetrics.netCash)}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Bottom End-Day Callout */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-950/80 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-neutral-500" />
          <span>საღამოს რუტინა: დღის შეჯამება, გადატანილი საქმეების განსაზღვრა და დღის ჩაკეტვა.</span>
        </div>
        <button
          id="btn-open-end-day"
          onClick={onOpenEndDay}
          className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium text-xs transition cursor-pointer border border-neutral-700"
        >
          დღის შეჯამების დაწყება
        </button>
      </div>

    </div>
  );
};
