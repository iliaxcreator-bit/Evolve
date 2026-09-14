import { 
  EvolveState, 
  NeedsAttentionItem, 
  RecommendedAction, 
  Task, 
  Client, 
  Project, 
  RoutineItem 
} from '../types';
import { 
  getTbilisiTodayDate, 
  getTbilisiTime24, 
  getDaysDifference, 
  timeToMinutes, 
  formatGEL 
} from '../utils/date';

/**
 * Identify current active routine block based on Asia/Tbilisi time
 */
export function getCurrentRoutineBlock(routine: RoutineItem[], time24 = getTbilisiTime24()): {
  currentBlock: RoutineItem | null;
  nextBlock: RoutineItem | null;
  minutesRemainingInBlock: number;
} {
  const currentMinutes = timeToMinutes(time24);
  let currentBlock: RoutineItem | null = null;
  let nextBlock: RoutineItem | null = null;
  let minutesRemaining = 0;

  for (let i = 0; i < routine.length; i++) {
    const item = routine[i];
    const start = timeToMinutes(item.startTime);
    let end = timeToMinutes(item.endTime);
    // Handle overnight blocks (e.g. 23:00 to 07:30)
    if (end < start) {
      if (currentMinutes >= start || currentMinutes < end) {
        currentBlock = item;
        const totalEnd = currentMinutes >= start ? end + 1440 : end;
        minutesRemaining = totalEnd - currentMinutes;
        nextBlock = routine[(i + 1) % routine.length];
        break;
      }
    } else if (currentMinutes >= start && currentMinutes < end) {
      currentBlock = item;
      minutesRemaining = end - currentMinutes;
      nextBlock = routine[(i + 1) % routine.length];
      break;
    }
  }

  if (!currentBlock && routine.length > 0) {
    // Find closest upcoming block
    for (const item of routine) {
      const start = timeToMinutes(item.startTime);
      if (start > currentMinutes) {
        nextBlock = item;
        break;
      }
    }
    if (!nextBlock) nextBlock = routine[0];
  }

  return {
    currentBlock,
    nextBlock,
    minutesRemainingInBlock: Math.max(0, minutesRemaining),
  };
}

/**
 * 6. NEEDS ATTENTION — Decision filter
 * Only surfaces genuine discrepancies, overdue items, or critical blocks.
 * Disappears automatically when resolved.
 */
export function getNeedsAttention(state: EvolveState, baseDate = getTbilisiTodayDate()): NeedsAttentionItem[] {
  const items: NeedsAttentionItem[] = [];

  // 1. Overdue Tasks (status is Todo or Doing, dueDate < today)
  state.tasks.forEach(task => {
    if (task.status === 'Todo' || task.status === 'Doing') {
      const daysDiff = getDaysDifference(task.dueDate, baseDate);
      if (daysDiff < 0) {
        items.push({
          id: `attn-task-${task.id}`,
          title: `${task.title} (${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'} overdue)`,
          category: 'Overdue Task',
          urgency: 'critical',
          targetType: 'task',
          targetId: task.id,
          dueDate: task.dueDate,
          amount: task.expectedRevenue,
        });
      }
    }
  });

  // 2. Overdue or Due Follow-ups from Clients
  state.clients.forEach(client => {
    if (client.stage === 'Active' || client.stage === 'Negotiating' || client.stage === 'Interested') {
      if (client.nextActionDate) {
        const daysDiff = getDaysDifference(client.nextActionDate, baseDate);
        if (daysDiff < 0) {
          items.push({
            id: `attn-client-overdue-${client.id}`,
            title: `Follow-up with ${client.name} is ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'} overdue`,
            category: 'Overdue Follow-up',
            urgency: 'critical',
            targetType: 'client',
            targetId: client.id,
            dueDate: client.nextActionDate,
            amount: client.expectedRevenue,
          });
        }
      } else {
        // Active client without any Next Action set!
        items.push({
          id: `attn-client-no-next-${client.id}`,
          title: `Active client ${client.name} has no next action scheduled`,
          category: 'Missing Next Action',
          urgency: 'warning',
          targetType: 'client',
          targetId: client.id,
        });
      }
    }
  });

  // 3. Blocked Projects
  state.projects.forEach(project => {
    if (project.status === 'Blocked') {
      items.push({
        id: `attn-proj-blocked-${project.id}`,
        title: `Project "${project.name}" is blocked (${project.nextAction || 'needs unblocking action'})`,
        category: 'Blocked Project',
        urgency: 'warning',
        targetType: 'project',
        targetId: project.id,
      });
    } else if (project.status === 'Active' && project.deadline) {
      const daysDiff = getDaysDifference(project.deadline, baseDate);
      if (daysDiff <= 2 && daysDiff >= 0) {
        items.push({
          id: `attn-proj-deadline-${project.id}`,
          title: `Project "${project.name}" deadline in ${daysDiff === 0 ? 'today' : daysDiff === 1 ? '1 day' : '2 days'}`,
          category: 'Project Deadline',
          urgency: daysDiff === 0 ? 'critical' : 'warning',
          targetType: 'project',
          targetId: project.id,
          dueDate: project.deadline,
        });
      }
    }
  });

  // 4. Overdue Money Actions
  state.moneyActions.forEach(ma => {
    if (ma.status === 'Pending' && ma.deadline) {
      const daysDiff = getDaysDifference(ma.deadline, baseDate);
      if (daysDiff < 0 && ma.type === 'Expected') {
        items.push({
          id: `attn-ma-${ma.id}`,
          title: `Expected payment collection overdue: ${ma.title} (${formatGEL(ma.amount)})`,
          category: 'Expected Payment',
          urgency: 'critical',
          targetType: 'task',
          targetId: ma.id,
          amount: ma.amount,
        });
      }
    }
  });

  return items;
}

/**
 * 36 & 37: THE SMART PRIORITY ENGINE & getNextBestAction()
 * Central decision function: returns the single best action to perform right now.
 * Never recommends completed, cancelled, or irrelevant actions.
 */
export function getNextBestAction(
  state: EvolveState, 
  currentTime24 = getTbilisiTime24(), 
  todayDate = getTbilisiTodayDate()
): RecommendedAction | null {
  const candidates: RecommendedAction[] = [];
  const { currentBlock } = getCurrentRoutineBlock(state.routine, currentTime24);

  // Is current block money block? (09:00 - 11:30)
  const isMoneyBlock = currentBlock?.category === 'Revenue' || (currentBlock?.title.toLowerCase().includes('money'));
  // Is current block main project block? (13:00 - 15:00)
  const isMainProjectBlock = currentBlock?.title.toLowerCase().includes('main project');
  // Is current block workout? (16:00 - 17:00)
  const isWorkoutBlock = currentBlock?.category === 'Fitness';
  // Is current block review? (20:30)
  const isReviewBlock = currentBlock?.category === 'Review';

  // Helper lookups
  const clientsMap = new Map<string, Client>(state.clients.map(c => [c.id, c]));
  const projectsMap = new Map<string, Project>(state.projects.map(p => [p.id, p]));
  const mainProject = state.projects.find(p => p.isWeeklyMainProject && p.status === 'Active');

  // Candidate 1: Pending Tasks
  for (const task of state.tasks) {
    if (task.status === 'Done' || task.status === 'Cancelled') continue;

    let score = 50;
    const reasons: string[] = [];
    const georgianReasons: string[] = [];

    const daysDiff = getDaysDifference(task.dueDate, todayDate);
    if (daysDiff < 0) {
      score += 120;
      reasons.push(`Overdue by ${Math.abs(daysDiff)} days`);
      georgianReasons.push(`ვადა გადაცილებულია (${Math.abs(daysDiff)} დღე)`);
    } else if (daysDiff === 0) {
      score += 70;
      reasons.push('Due today');
      georgianReasons.push('ვადა დღეს');
    } else if (daysDiff === 1) {
      score += 35;
      reasons.push('Due tomorrow');
      georgianReasons.push('ვადა ხვალ');
    }

    if (task.priority === 'Critical') {
      score += 50;
      reasons.push('Critical priority');
      georgianReasons.push('კრიტიკული პრიორიტეტი');
    } else if (task.priority === 'High') {
      score += 30;
      reasons.push('High priority');
      georgianReasons.push('მაღალი პრიორიტეტი');
    }

    // Money connection
    if (task.expectedRevenue && task.expectedRevenue > 0) {
      score += 60;
      reasons.push(`Expected money: ${formatGEL(task.expectedRevenue)}`);
      georgianReasons.push(`მოსალოდნელი თანხა: ${formatGEL(task.expectedRevenue)}`);
      if (isMoneyBlock) {
        score += 40;
        reasons.push('Current time: Money Block (09:00–11:30)');
        georgianReasons.push('მიმდინარე ბლოკი: Money Block');
      }
    }

    // Client connection
    const client = task.clientId ? clientsMap.get(task.clientId) : undefined;
    if (client) {
      score += 25;
      reasons.push(`Active client (${client.name})`);
      georgianReasons.push(`აქტიური კლიენტი (${client.name})`);
      if (task.title.toLowerCase().includes('follow up') || task.title.toLowerCase().includes('follow-up')) {
        score += 30;
        reasons.push('Direct follow-up action');
        georgianReasons.push('Follow-up მოქმედება');
      }
    }

    // Project connection
    const proj = task.projectId ? projectsMap.get(task.projectId) : undefined;
    if (proj?.isWeeklyMainProject) {
      score += 40;
      reasons.push('Supports Weekly Main Project');
      georgianReasons.push('Weekly Main Project-ის მხარდაჭერა');
      if (isMainProjectBlock) {
        score += 45;
        reasons.push('Current time: Main Project Deep Work Block');
        georgianReasons.push('მიმდინარე ბლოკი: Main Project Block');
      }
    }

    const clientName = client?.name;
    const projectName = proj?.name;

    candidates.push({
      id: `act-task-${task.id}`,
      title: task.title,
      type: 'task',
      actionableId: task.id,
      clientId: task.clientId,
      clientName,
      projectId: task.projectId,
      projectName,
      goalId: task.goalId,
      expectedMoney: task.expectedRevenue,
      deadline: task.dueDate,
      score,
      reasons,
      georgianWhy: georgianReasons.join(' + '),
    });
  }

  // Candidate 2: Client Follow-ups due today that might not be in tasks
  for (const client of state.clients) {
    if (client.stage === 'Active' || client.stage === 'Negotiating' || client.stage === 'Interested') {
      if (client.nextAction && client.nextActionDate) {
        // Check if there is already an identical task
        const hasExistingTask = state.tasks.some(
          t => t.clientId === client.id && t.status !== 'Done' && t.title.toLowerCase().includes(client.nextAction!.toLowerCase())
        );
        if (!hasExistingTask) {
          const daysDiff = getDaysDifference(client.nextActionDate, todayDate);
          if (daysDiff <= 0) {
            let score = 90;
            const reasons: string[] = [];
            const georgianReasons: string[] = [];

            if (daysDiff < 0) {
              score += 60;
              reasons.push(`Follow-up overdue by ${Math.abs(daysDiff)} days`);
              georgianReasons.push(`Follow-up ვადაგადაცილებულია`);
            } else {
              score += 40;
              reasons.push('Follow-up due today');
              georgianReasons.push('Follow-up დღეს');
            }

            if (client.expectedRevenue > 0) {
              score += 50;
              reasons.push(`Expected money: ${formatGEL(client.expectedRevenue)}`);
              georgianReasons.push(`მოსალოდნელი: ${formatGEL(client.expectedRevenue)}`);
            }
            reasons.push(`Active Client: ${client.name}`);
            georgianReasons.push(`აქტიური კლიენტი`);

            if (isMoneyBlock) {
              score += 40;
              reasons.push('Current time: Money Block');
              georgianReasons.push('მიმდინარე ბლოკი: Money Block');
            }

            candidates.push({
              id: `act-client-${client.id}`,
              title: `${client.nextAction} (${client.name})`,
              type: 'followup',
              actionableId: client.id,
              clientId: client.id,
              clientName: client.name,
              expectedMoney: client.expectedRevenue,
              deadline: client.nextActionDate,
              score,
              reasons,
              georgianWhy: georgianReasons.join(' + '),
            });
          }
        }
      }
    }
  }

  // Candidate 3: Weekly Main Project next action if block is Main Project
  if (mainProject && mainProject.nextAction && isMainProjectBlock) {
    const hasExistingTask = state.tasks.some(
      t => t.projectId === mainProject.id && t.status !== 'Done' && t.title.toLowerCase().includes(mainProject.nextAction!.toLowerCase())
    );
    if (!hasExistingTask) {
      candidates.push({
        id: `act-proj-${mainProject.id}`,
        title: mainProject.nextAction,
        type: 'projectDeliverable',
        actionableId: mainProject.id,
        projectId: mainProject.id,
        projectName: mainProject.name,
        goalId: mainProject.goalId,
        deadline: mainProject.deadline,
        score: 130,
        reasons: ['Weekly Main Project flagship deliverable', 'Current time: Main Project Deep Work Block'],
        georgianWhy: 'Weekly Main Project-ის ძირითადი მიზანი + მიმდინარე დროის ბლოკი',
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

/**
 * 11. TODAY'S DIRECTION — One concise, executive strategic sentence.
 * Generated from live system data. Never hardcoded.
 */
export function getTodayDirection(
  state: EvolveState, 
  nextAction: RecommendedAction | null,
  mainProject: Project | undefined
): { headline: string; subtitle: string } {
  const pendingTasks = state.tasks.filter(t => t.status === 'Todo' || t.status === 'Doing');
  const overdueCount = pendingTasks.filter(t => getDaysDifference(t.dueDate) < 0).length;
  const moneyActions = state.moneyActions.filter(m => m.status === 'Pending');
  const expectedMoneyTotal = moneyActions
    .filter(m => m.type === 'Expected')
    .reduce((sum, m) => sum + m.amount, 0);

  if (nextAction && nextAction.expectedMoney && nextAction.expectedMoney > 0) {
    return {
      headline: `დღეს მთავარი ფოკუსია ${nextAction.clientName || 'კლიენტის'} Follow-up — Expected ${formatGEL(nextAction.expectedMoney)} და ვადა დღეს.`,
      subtitle: mainProject ? `შემდეგ Weekly Main Project: ${mainProject.name}-ის წინ წაწევა.` : 'ფოკუსირება შემოსავლის ქმედებებზე და გადაუდებელ საქმეებზე.',
    };
  }

  if (overdueCount > 0) {
    return {
      headline: `დღეს უმთავრესია ${overdueCount} ვადაგადაცილებული საკითხის დახურვა და ფინანსური დისციპლინა.`,
      subtitle: `მოსალოდნელი თანხა: ${formatGEL(expectedMoneyTotal)}. ჯერ მოაგვარეთ გადაცილებები, შემდეგ სიღრმისეული სამუშაო.`,
    };
  }

  if (mainProject) {
    return {
      headline: `დღეს მთავარი მიზანია Weekly Main Project-ის (${mainProject.name}) გადამწყვეტი წინსვლა.`,
      subtitle: nextAction ? `დაიწყეთ: ${nextAction.title}.` : 'შეასრულეთ ძირითადი დელივერაბლები.',
    };
  }

  return {
    headline: 'დღეს ფოკუსირდით დაგეგმილ 3 Money Action-ზე და სუფთა შესრულებაზე.',
    subtitle: 'სისტემა მართავს სირთულეს; თქვენ მიჰყევით NOW რეკომენდაციას.',
  };
}

/**
 * 20 & 21: MONEY CALCULATIONS
 * Received income minus actual expenses.
 * Never treat Expected as Received. Never treat Potential as income.
 */
export function calculateFinancialMetrics(state: EvolveState): {
  receivedIncome: number;
  expectedIncome: number;
  pipelineTotal: number;
  expensesTotal: number;
  netCash: number;
} {
  // Received transactions
  const receivedIncome = state.transactions
    .filter(t => t.type === 'Income' && t.status === 'Received')
    .reduce((sum, t) => sum + t.amount, 0);

  // Expected from pending MoneyActions + expected Transactions
  const expectedFromMA = state.moneyActions
    .filter(ma => ma.status === 'Pending' && ma.type === 'Expected')
    .reduce((sum, ma) => sum + ma.amount, 0);

  const expectedFromTx = state.transactions
    .filter(t => t.type === 'Income' && t.status === 'Expected')
    .reduce((sum, t) => sum + t.amount, 0);

  const expectedIncome = expectedFromMA + expectedFromTx;

  // Pipeline: sum of client potential + leads potential
  const clientPipeline = state.clients
    .filter(c => c.stage !== 'Inactive')
    .reduce((sum, c) => sum + (c.potentialValue || 0), 0);
  
  const leadsPipeline = state.leads.reduce((sum, l) => sum + (l.potentialValue || 0), 0);
  const pipelineTotal = clientPipeline + leadsPipeline;

  // Expenses
  const expensesTotal = state.transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = receivedIncome - expensesTotal;

  return {
    receivedIncome,
    expectedIncome,
    pipelineTotal,
    expensesTotal,
    netCash,
  };
}
