import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Briefcase, 
  DollarSign, 
  UserPlus, 
  Lightbulb, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';
import { EvolveState, LifeAreaName, TaskPriority, MoneyActionType } from '../types';
import { getTbilisiTodayDate } from '../utils/date';

export type QuickAddType = 'Task' | 'MoneyAction' | 'Client' | 'Lead' | 'Project' | 'Goal' | 'Idea' | 'Income' | 'Expense';

interface QuickAddModalProps {
  initialType?: QuickAddType;
  state: EvolveState;
  onClose: () => void;
  onSaveTask: (task: any) => void;
  onSaveMoneyAction: (ma: any) => void;
  onSaveClient: (client: any) => void;
  onSaveLead: (lead: any) => void;
  onSaveProject: (project: any) => void;
  onSaveIdea: (idea: any) => void;
  onSaveTransaction: (tx: any) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  initialType = 'Task',
  state,
  onClose,
  onSaveTask,
  onSaveMoneyAction,
  onSaveClient,
  onSaveLead,
  onSaveProject,
  onSaveIdea,
  onSaveTransaction,
}) => {
  const [type, setType] = useState<QuickAddType>(initialType);
  const today = getTbilisiTodayDate();

  // Common inputs
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState(today);
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [area, setArea] = useState<LifeAreaName>('Business');
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [moneyActionType, setMoneyActionType] = useState<MoneyActionType>('Expected');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('Client Service');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (type === 'Task') {
      onSaveTask({
        title,
        status: 'Todo',
        priority,
        dueDate,
        area,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        expectedRevenue: amount > 0 ? amount : undefined,
        notes: notes || undefined,
      });
    } else if (type === 'MoneyAction') {
      onSaveMoneyAction({
        title,
        amount: Number(amount),
        type: moneyActionType,
        isMajor: false,
        deadline: dueDate,
        priority: 'High',
        status: 'Pending',
        date: today,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        notes: notes || undefined,
      });
    } else if (type === 'Client') {
      onSaveClient({
        name: title,
        company,
        contact,
        stage: 'Active',
        potentialValue: Number(amount) || 1000,
        expectedRevenue: 0,
        receivedRevenue: 0,
        nextAction: notes || 'Initial contact follow-up',
        nextActionDate: dueDate,
        notes,
      });
    } else if (type === 'Lead') {
      onSaveLead({
        name: title,
        company,
        contact,
        source: 'Direct',
        stage: 'New',
        potentialValue: Number(amount) || 500,
        nextAction: notes || 'Discovery message',
        nextActionDate: dueDate,
        notes,
      });
    } else if (type === 'Project') {
      onSaveProject({
        name: title,
        description: notes || 'Key initiative',
        area,
        deadline: dueDate,
        status: 'Active',
        priority: 'High',
        deliverables: [
          { id: `del-${Date.now()}`, title: 'Initial milestone delivery', completed: false }
        ],
        nextAction: 'Define core deliverables',
        nextActionDate: today,
      });
    } else if (type === 'Idea') {
      onSaveIdea({
        title,
        description: notes,
        area,
        status: 'Inbox',
      });
    } else if (type === 'Income' || type === 'Expense') {
      onSaveTransaction({
        type: type === 'Income' ? 'Income' : 'Expense',
        amount: Number(amount),
        date: dueDate,
        status: type === 'Income' ? 'Received' : 'Received',
        category: category || (type === 'Income' ? 'Client Revenue' : 'Operational'),
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        notes,
      });
    }

    onClose();
  };

  const types: QuickAddType[] = ['Task', 'MoneyAction', 'Client', 'Lead', 'Project', 'Idea', 'Income', 'Expense'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400">FAST CAPTURE</span>
            <h3 className="text-base font-bold text-neutral-100">Quick Add Item</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {types.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-mono transition cursor-pointer whitespace-nowrap ${
                type === t ? 'bg-neutral-200 text-neutral-900 font-bold' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-850'
              }`}
            >
              {t === 'MoneyAction' ? 'Money Action' : t}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
              {type === 'Client' || type === 'Lead' ? 'Name / Contact' : 'Title / Description'}
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder={type === 'Task' ? 'e.g. Follow up on proposal' : 'Enter title or name'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Conditional Fields */}
          {(type === 'MoneyAction' || type === 'Income' || type === 'Expense' || type === 'Task' || type === 'Client' || type === 'Lead') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                  Amount (₾ GEL)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
                />
              </div>

              {type === 'MoneyAction' ? (
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Money Action Type
                  </label>
                  <select
                    value={moneyActionType}
                    onChange={e => setMoneyActionType(e.target.value as MoneyActionType)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none"
                  >
                    <option value="Expected">Expected (Awaiting)</option>
                    <option value="Potential">Potential (Pipeline)</option>
                    <option value="Received">Received (In Hand)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Date / Deadline
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-mono focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {(type === 'Client' || type === 'Lead') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Company</label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Contact Info</label>
                <input
                  type="text"
                  placeholder="Email or phone"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                />
              </div>
            </div>
          )}

          {(type === 'Task' || type === 'MoneyAction') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Linked Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none"
                >
                  <option value="">None / Internal</option>
                  {state.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Linked Project</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none"
                >
                  <option value="">None / General</option>
                  {state.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">Notes & Context</label>
            <textarea
              rows={2}
              placeholder="Additional specifics or strategic reason..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-400 text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer"
            >
              Create Item
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
