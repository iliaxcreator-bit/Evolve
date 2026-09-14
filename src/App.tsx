import React, { useState, useEffect, useCallback } from 'react';
import { 
  getStoredState, 
  saveState, 
  subscribeToState, 
  exportStateAsJson, 
  validateAndImportState, 
  resetToSeedData 
} from './services/storage';
import { 
  EvolveState, 
  Task, 
  MoneyAction, 
  Client, 
  Lead, 
  Project, 
  Goal, 
  Idea, 
  Transaction, 
  WorkoutSession, 
  FocusSession, 
  DailyReviewData, 
  RecommendedAction,
  IdeaStatus,
  ClientActivity 
} from './types';
import { getNeedsAttention, getNextBestAction, calculateFinancialMetrics } from './services/smartEngine';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { WorkView } from './components/WorkView';
import { BusinessView } from './components/BusinessView';
import { MoneyView } from './components/MoneyView';
import { LifeView } from './components/LifeView';
import { ReviewView } from './components/ReviewView';
import { CalendarView } from './components/CalendarView';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { FocusModal } from './components/FocusModal';
import { QuickAddModal, QuickAddType } from './components/QuickAddModal';
import { CommandModal } from './components/CommandModal';
import { WorkoutModal } from './components/WorkoutModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { ChronoCueBanner } from './components/ChronoCueBanner';
import { getTbilisiTodayDate } from './utils/date';

export default function App() {
  const [state, setState] = useState<EvolveState>(() => getStoredState());
  const [activeTab, setActiveTab] = useState<MainTab>('TODAY');

  // Modals state
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [focusAction, setFocusAction] = useState<RecommendedAction | null>(null);
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('Task');

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [activeWorkoutType, setActiveWorkoutType] = useState<string>('Workout A');

  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);

  // Listen to state changes
  useEffect(() => {
    const unsubscribe = subscribeToState(nextState => {
      setState(nextState);
    });
    return unsubscribe;
  }, []);

  // Global hotkeys (Cmd+K / Ctrl+K for command palette, 'q' for quick add)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      } else if (e.key === 'q' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setQuickAddType('Task');
        setIsQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // State mutation helpers
  const updateState = useCallback((updater: (prev: EvolveState) => EvolveState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // TASK OPERATIONS
  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    updateState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'Done' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    }));
  };

  // DEFER TASK (+1 day to tomorrow)
  const handleDeferTask = (taskId: string) => {
    const today = getTbilisiTodayDate();
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().split('T')[0];

    updateState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            dueDate: tomorrowStr,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      }),
    }));
  };

  // CLIENT ACTIVITY LOGGING
  const handleAddClientActivity = (activity: Omit<ClientActivity, 'id' | 'createdAt'>) => {
    const newActivity: ClientActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    updateState(prev => ({
      ...prev,
      clientActivities: [newActivity, ...(prev.clientActivities || [])],
    }));
  };

  // MONEY ACTIONS
  const handleToggleMoneyAction = (actionId: string) => {
    updateState(prev => ({
      ...prev,
      moneyActions: prev.moneyActions.map(ma => {
        if (ma.id === actionId) {
          const nextStatus = ma.status === 'Completed' ? 'Pending' : 'Completed';
          return { ...ma, status: nextStatus };
        }
        return ma;
      }),
    }));
  };

  // MAIN PROJECT
  const handleSetWeeklyMainProject = (projectId: string) => {
    updateState(prev => ({
      ...prev,
      projects: prev.projects.map(p => ({
        ...p,
        isWeeklyMainProject: p.id === projectId,
      })),
    }));
  };

  const handleToggleDeliverable = (projectId: string, deliverableId: string) => {
    updateState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            deliverables: p.deliverables.map(d => 
              d.id === deliverableId ? { ...d, completed: !d.completed } : d
            ),
          };
        }
        return p;
      }),
    }));
  };

  // CLIENTS & LEADS
  const handleUpdateClient = (updated: Client) => {
    updateState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === updated.id ? updated : c),
    }));
  };

  const handleConvertLeadToClient = (leadId: string) => {
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return;

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: lead.name,
      company: lead.company,
      contact: lead.contact,
      stage: 'Active',
      potentialValue: lead.potentialValue,
      expectedRevenue: 0,
      receivedRevenue: 0,
      nextAction: lead.nextAction || 'First kickoff session',
      nextActionDate: lead.nextActionDate || getTbilisiTodayDate(),
      notes: `Converted from lead (${lead.source}). ${lead.notes || ''}`,
      source: lead.source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateState(prev => ({
      ...prev,
      clients: [newClient, ...prev.clients],
      leads: prev.leads.filter(l => l.id !== leadId),
    }));
  };

  // TRANSACTIONS
  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    updateState(prev => {
      // If transaction is linked to client and received, update client.receivedRevenue
      let updatedClients = prev.clients;
      if (newTx.clientId && newTx.type === 'Income' && newTx.status === 'Received') {
        updatedClients = prev.clients.map(c => 
          c.id === newTx.clientId ? { ...c, receivedRevenue: (c.receivedRevenue || 0) + newTx.amount } : c
        );
      }

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        clients: updatedClients,
      };
    });
  };

  // WORKOUT SESSIONS
  const handleSaveWorkoutSession = (sessionData: Omit<WorkoutSession, 'id'>) => {
    const newSession: WorkoutSession = {
      ...sessionData,
      id: `ws-${Date.now()}`,
    };

    updateState(prev => ({
      ...prev,
      workoutSessions: [newSession, ...prev.workoutSessions],
    }));
  };

  // FOCUS SESSIONS
  const handleSaveFocusSession = (sessionData: Omit<FocusSession, 'id'>) => {
    const newFocus: FocusSession = {
      ...sessionData,
      id: `fs-${Date.now()}`,
    };

    updateState(prev => ({
      ...prev,
      focusSessions: [newFocus, ...prev.focusSessions],
    }));
  };

  // IDEAS
  const handleAddIdea = (ideaData: Omit<Idea, 'id' | 'date'>) => {
    const newIdea: Idea = {
      ...ideaData,
      id: `idea-${Date.now()}`,
      date: getTbilisiTodayDate(),
    };
    updateState(prev => ({ ...prev, ideas: [newIdea, ...prev.ideas] }));
  };

  const handleUpdateIdeaStatus = (ideaId: string, status: IdeaStatus) => {
    updateState(prev => ({
      ...prev,
      ideas: prev.ideas.map(i => i.id === ideaId ? { ...i, status } : i),
    }));
  };

  const handleConvertIdeaToTask = (ideaId: string) => {
    const idea = state.ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: idea.title,
      status: 'Todo',
      priority: 'Medium',
      dueDate: getTbilisiTodayDate(),
      area: idea.area,
      notes: idea.description,
      createdAt: new Date().toISOString(),
    };

    updateState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      ideas: prev.ideas.map(i => i.id === ideaId ? { ...i, status: 'Converted' } : i),
    }));
  };

  // QUICK ADD GENERIC
  const handleSaveQuickItem = {
    task: (t: any) => {
      const newTask: Task = { ...t, id: `task-${Date.now()}`, createdAt: new Date().toISOString() };
      updateState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    },
    moneyAction: (ma: any) => {
      const newMa: MoneyAction = { ...ma, id: `ma-${Date.now()}` };
      updateState(prev => ({ ...prev, moneyActions: [newMa, ...prev.moneyActions] }));
    },
    client: (c: any) => {
      const newClient: Client = { ...c, id: `client-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      updateState(prev => ({ ...prev, clients: [newClient, ...prev.clients] }));
    },
    lead: (l: any) => {
      const newLead: Lead = { ...l, id: `lead-${Date.now()}`, createdAt: new Date().toISOString() };
      updateState(prev => ({ ...prev, leads: [newLead, ...prev.leads] }));
    },
    project: (p: any) => {
      const newProject: Project = { ...p, id: `proj-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      updateState(prev => ({ ...prev, projects: [newProject, ...prev.projects] }));
    },
    idea: (i: any) => {
      handleAddIdea(i);
    },
    transaction: (tx: any) => {
      handleAddTransaction(tx);
    },
  };

  // END DAY CEREMONY
  const handleCompleteEndDay = (
    carriedOverTaskIds: string[], 
    reviewData: DailyReviewData, 
    notes?: string
  ) => {
    const todayDate = getTbilisiTodayDate();
    const metrics = calculateFinancialMetrics(state);
    const plannedTasks = state.tasks.filter(t => t.dueDate === todayDate);
    const completedTasks = state.tasks.filter(t => t.status === 'Done');

    // Create immutable daily record
    const dailyRecord = {
      id: `rec-${todayDate}`,
      date: todayDate,
      locked: true,
      plannedTaskIds: plannedTasks.map(t => t.id),
      completedTaskIds: completedTasks.map(t => t.id),
      moneyActions: state.moneyActions.slice(0, 3),
      receivedAmount: metrics.receivedIncome,
      expectedAmount: metrics.expectedIncome,
      expenseAmount: metrics.expensesTotal,
      review: reviewData,
      notes,
      carriedOverTaskIds,
      createdAt: new Date().toISOString(),
      lockedAt: new Date().toISOString(),
    };

    // Reschedule carried over tasks to tomorrow
    const [y, m, d] = todayDate.split('-').map(Number);
    const tomorrow = new Date(y, m - 1, d + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    updateState(prev => {
      const nextTasks = prev.tasks.map(task => {
        if (carriedOverTaskIds.includes(task.id) && task.status !== 'Done') {
          return {
            ...task,
            dueDate: tomorrowStr,
          };
        }
        return task;
      });

      return {
        ...prev,
        tasks: nextTasks,
        dailyRecords: [dailyRecord, ...prev.dailyRecords.filter(r => r.date !== todayDate)],
      };
    });
  };

  // BACKUP & RESTORE HANDLERS
  const handleExportData = () => {
    const json = exportStateAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolve_os_backup_${getTbilisiTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const text = await file.text();
      const res = validateAndImportState(text);
      if (res.success) {
        setState(getStoredState());
      } else {
        alert(`Failed to restore backup: ${res.error}`);
      }
    };
    input.click();
  };

  const handleResetData = () => {
    if (window.confirm('Reset EVOLVE OS to clean verified test dataset (Ronen / IIC, EVOLVE OS Project, Workouts)?')) {
      const fresh = resetToSeedData();
      setState(fresh);
    }
  };

  // Calculations for UI
  const attentionItems = getNeedsAttention(state);
  const nextAction = getNextBestAction(state);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* 1. Header (Sticky) */}
      <Header
        routine={state.routine}
        needsAttentionCount={attentionItems.length}
        onOpenQuickAdd={() => { setQuickAddType('Task'); setIsQuickAddOpen(true); }}
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenFocus={() => { setFocusAction(nextAction); setIsFocusOpen(true); }}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
      />

      {/* 2. Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        needsAttentionCount={attentionItems.length}
      />

      {/* 2.1 Chrono Cue Real-Time Routine Alert Banner */}
      <ChronoCueBanner
        routine={state.routine}
        onStartFocus={() => {
          setFocusAction(nextAction);
          setIsFocusOpen(true);
        }}
        onStartWorkout={() => {
          setActiveWorkoutType('Workout A');
          setIsWorkoutOpen(true);
        }}
        onOpenEndDay={() => setActiveTab('REVIEW')}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
      />

      {/* 3. Main Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'TODAY' && (
          <TodayView
            state={state}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onToggleMoneyAction={handleToggleMoneyAction}
            onStartFocus={(action) => {
              setFocusAction(action || nextAction);
              setIsFocusOpen(true);
            }}
            onStartWorkout={(workoutType) => {
              setActiveWorkoutType(workoutType);
              setIsWorkoutOpen(true);
            }}
            onOpenQuickAdd={(defaultType) => {
              setQuickAddType(defaultType || 'Task');
              setIsQuickAddOpen(true);
            }}
            onOpenEndDay={() => setActiveTab('REVIEW')}
            onSelectClient={() => setActiveTab('BUSINESS')}
            onSelectProject={() => setActiveTab('WORK')}
            onDeferTask={handleDeferTask}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
            onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
          />
        )}

        {activeTab === 'WORK' && (
          <WorkView
            state={state}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSetWeeklyMainProject={handleSetWeeklyMainProject}
            onToggleDeliverable={handleToggleDeliverable}
            onOpenQuickAdd={(type) => {
              setQuickAddType(type);
              setIsQuickAddOpen(true);
            }}
          />
        )}

        {activeTab === 'BUSINESS' && (
          <BusinessView
            state={state}
            onUpdateClient={handleUpdateClient}
            onConvertLeadToClient={handleConvertLeadToClient}
            onOpenQuickAdd={(type) => {
              setQuickAddType(type);
              setIsQuickAddOpen(true);
            }}
            onAddClientActivity={handleAddClientActivity}
          />
        )}

        {activeTab === 'MONEY' && (
          <MoneyView
            state={state}
            onAddTransaction={handleAddTransaction}
            onOpenQuickAdd={(type) => {
              setQuickAddType(type);
              setIsQuickAddOpen(true);
            }}
          />
        )}

        {activeTab === 'LIFE' && (
          <LifeView
            state={state}
            onStartWorkout={(type) => {
              setActiveWorkoutType(type);
              setIsWorkoutOpen(true);
            }}
            onAddIdea={handleAddIdea}
            onUpdateIdeaStatus={handleUpdateIdeaStatus}
            onConvertIdeaToTask={handleConvertIdeaToTask}
            onOpenQuickAdd={() => {
              setQuickAddType('Idea');
              setIsQuickAddOpen(true);
            }}
          />
        )}

        {activeTab === 'REVIEW' && (
          <ReviewView
            state={state}
            onCompleteEndDay={handleCompleteEndDay}
          />
        )}

        {activeTab === 'CALENDAR' && (
          <CalendarView state={state} />
        )}

        {activeTab === 'WORKSPACE' && (
          <GoogleWorkspaceView
            state={state}
            onSelectClient={() => setActiveTab('BUSINESS')}
          />
        )}
      </main>

      {/* MODALS */}
      {isFocusOpen && (
        <FocusModal
          action={focusAction}
          onClose={() => setIsFocusOpen(false)}
          onCompleteSession={handleSaveFocusSession}
          onMarkActionDone={() => {
            if (focusAction?.type === 'task') {
              handleUpdateTaskStatus(focusAction.actionableId, 'Done');
            } else if (focusAction?.type === 'moneyAction') {
              handleToggleMoneyAction(focusAction.actionableId);
            }
          }}
        />
      )}

      {isQuickAddOpen && (
        <QuickAddModal
          initialType={quickAddType}
          state={state}
          onClose={() => setIsQuickAddOpen(false)}
          onSaveTask={handleSaveQuickItem.task}
          onSaveMoneyAction={handleSaveQuickItem.moneyAction}
          onSaveClient={handleSaveQuickItem.client}
          onSaveLead={handleSaveQuickItem.lead}
          onSaveProject={handleSaveQuickItem.project}
          onSaveIdea={handleSaveQuickItem.idea}
          onSaveTransaction={handleSaveQuickItem.transaction}
        />
      )}

      {isCommandOpen && (
        <CommandModal
          state={state}
          onClose={() => setIsCommandOpen(false)}
          onNavigate={setActiveTab}
          onOpenFocus={() => {
            setFocusAction(nextAction);
            setIsFocusOpen(true);
          }}
          onOpenQuickAdd={(type) => {
            setQuickAddType(type || 'Task');
            setIsQuickAddOpen(true);
          }}
          onOpenEndDay={() => setActiveTab('REVIEW')}
        />
      )}

      {isWorkoutOpen && state.workoutConfigs[activeWorkoutType] && (
        <WorkoutModal
          workoutConfig={state.workoutConfigs[activeWorkoutType]}
          onClose={() => setIsWorkoutOpen(false)}
          onSaveSession={handleSaveWorkoutSession}
        />
      )}

      {/* Chief of Staff Live Voice Modal */}
      {isLiveVoiceOpen && (
        <LiveVoiceModal
          state={state}
          onClose={() => setIsLiveVoiceOpen(false)}
        />
      )}

      {/* Weekly Executive Report Modal */}
      {isExecutiveReportOpen && (
        <ExecutiveReportModal
          state={state}
          onClose={() => setIsExecutiveReportOpen(false)}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        />
      )}

    </div>
  );
}
