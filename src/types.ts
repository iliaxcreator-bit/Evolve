export type LifeAreaName = 
  | 'Business'
  | 'Money'
  | 'Health'
  | 'Fitness'
  | 'Learning'
  | 'Relationships'
  | 'Personal'
  | 'Creative'
  | 'Systems';

export interface LifeArea {
  id: string;
  name: LifeAreaName;
  description: string;
  color: string;
}

export type GoalStatus = 'Active' | 'On Track' | 'At Risk' | 'Completed' | 'Archived';

export interface Goal {
  id: string;
  name: string;
  description: string;
  area: LifeAreaName;
  targetMetric?: string;
  deadline?: string; // YYYY-MM-DD
  status: GoalStatus;
  progressPercent: number;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
}

export type ProjectStatus = 'Planned' | 'Active' | 'Blocked' | 'Completed' | 'Archived';

export interface Deliverable {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goalId?: string;
  area: LifeAreaName;
  clientId?: string;
  deadline: string; // YYYY-MM-DD
  status: ProjectStatus;
  priority: 'High' | 'Medium' | 'Low';
  deliverables: Deliverable[];
  nextAction?: string;
  nextActionDate?: string;
  isWeeklyMainProject?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'Todo' | 'Doing' | 'Done' | 'Cancelled';
export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  clientId?: string;
  projectId?: string;
  goalId?: string;
  area: LifeAreaName;
  expectedRevenue?: number; // In GEL (₾)
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export type CRMStage = 
  | 'Lead'
  | 'Contacted'
  | 'Interested'
  | 'Negotiating'
  | 'Active'
  | 'Recurring'
  | 'Inactive';

export interface Client {
  id: string;
  name: string;
  company?: string;
  contact?: string;
  stage: CRMStage;
  potentialValue: number; // GEL
  expectedRevenue: number; // GEL
  receivedRevenue: number; // GEL
  nextAction?: string;
  nextActionDate?: string; // YYYY-MM-DD
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientActivityType = 
  | 'Call' 
  | 'Meeting' 
  | 'Proposal' 
  | 'Payment' 
  | 'Contract' 
  | 'Email' 
  | 'Note';

export interface ClientActivity {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD or ISO
  type: ClientActivityType;
  title: string;
  notes?: string;
  nextStep?: string;
  nextStepDate?: string; // YYYY-MM-DD
  amount?: number; // GEL if payment or proposal
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company?: string;
  contact?: string;
  source: string;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent';
  potentialValue: number;
  nextAction?: string;
  nextActionDate?: string;
  notes?: string;
  createdAt: string;
}

export type MoneyActionType = 'Potential' | 'Expected' | 'Received';

export interface MoneyAction {
  id: string;
  title: string;
  amount: number; // GEL
  type: MoneyActionType;
  isMajor: boolean; // 1 major, 2 smaller for the day
  clientId?: string;
  projectId?: string;
  deadline?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Deferred';
  date: string; // YYYY-MM-DD
  notes?: string;
}

export type TransactionType = 'Income' | 'Expense';
export type IncomeStatus = 'Expected' | 'Received';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  status: IncomeStatus; // Only relevant for income, expenses are actual
  category: string;
  clientId?: string;
  projectId?: string;
  notes?: string;
  createdAt: string;
}

export interface RoutineItem {
  id: string;
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  title: string;
  category: 'Focus' | 'Revenue' | 'Fitness' | 'Personal' | 'Review' | 'Health';
  priorityFocus?: string;
}

export interface Exercise {
  id: string;
  name: string;
  repsOrDuration: string;
  notes?: string;
}

export interface WorkoutConfig {
  type: 'Workout A' | 'Workout B' | 'Recovery / Movement' | 'Workout C' | 'Light Cardio / Stretch' | 'Rest';
  name: string;
  rounds?: number;
  restBetweenExercisesSec?: number;
  restBetweenRoundsSec?: number;
  durationMin?: number;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  workoutType: string;
  durationMinutes: number;
  completedRounds: number;
  notes?: string;
  completedAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  clientId?: string;
  projectId?: string;
  goalId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  completed: boolean;
  notes?: string;
}

export type IdeaStatus = 'Inbox' | 'Someday' | 'Converted' | 'Archived';

export interface Idea {
  id: string;
  title: string;
  description?: string;
  date: string;
  area: LifeAreaName;
  status: IdeaStatus;
  tags?: string[];
}

export interface DailyReviewData {
  completedSummary: string;
  moneyCreatedSummary: string;
  unfinishedSummary: string;
  learnedSummary: string;
  tomorrowPriority: string;
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  locked: boolean;
  plannedTaskIds: string[];
  completedTaskIds: string[];
  moneyActions: MoneyAction[];
  receivedAmount: number;
  expectedAmount: number;
  expenseAmount: number;
  workoutSessionId?: string;
  mainProjectId?: string;
  review?: DailyReviewData;
  notes?: string;
  carriedOverTaskIds: string[];
  createdAt: string;
  lockedAt?: string;
}

export interface NeedsAttentionItem {
  id: string;
  title: string;
  category: 'Overdue Task' | 'Overdue Follow-up' | 'Expected Payment' | 'Project Deadline' | 'Blocked Project' | 'Missing Next Action';
  urgency: 'critical' | 'warning' | 'info';
  targetType: 'task' | 'client' | 'project' | 'transaction';
  targetId: string;
  dueDate?: string;
  amount?: number;
}

export interface RecommendedAction {
  id: string;
  title: string;
  type: 'task' | 'followup' | 'moneyAction' | 'projectDeliverable' | 'workout' | 'review';
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  goalId?: string;
  goalName?: string;
  expectedMoney?: number;
  deadline?: string;
  score: number;
  reasons: string[];
  georgianWhy: string;
  actionableId: string;
}

export interface EvolveState {
  version: number;
  timezone: string; // 'Asia/Tbilisi'
  currency: string; // '₾'
  areas: LifeArea[];
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  clientActivities: ClientActivity[];
  leads: Lead[];
  moneyActions: MoneyAction[];
  transactions: Transaction[];
  routine: RoutineItem[];
  workoutConfigs: Record<string, WorkoutConfig>;
  workoutSessions: WorkoutSession[];
  focusSessions: FocusSession[];
  ideas: Idea[];
  dailyRecords: DailyRecord[];
}
