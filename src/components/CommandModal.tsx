import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Briefcase, 
  Users, 
  DollarSign, 
  Lightbulb, 
  ArrowRight, 
  Target, 
  Lock 
} from 'lucide-react';
import { EvolveState } from '../types';
import { MainTab } from './Navigation';
import { formatGEL } from '../utils/date';

interface CommandModalProps {
  state: EvolveState;
  onClose: () => void;
  onNavigate: (tab: MainTab) => void;
  onOpenFocus: () => void;
  onOpenQuickAdd: (type?: any) => void;
  onOpenEndDay: () => void;
}

export const CommandModal: React.FC<CommandModalProps> = ({
  state,
  onClose,
  onNavigate,
  onOpenFocus,
  onOpenQuickAdd,
  onOpenEndDay,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener to close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  // Matched records
  const matchedTasks = state.tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 4);
  const matchedClients = state.clients.filter(c => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)).slice(0, 4);
  const matchedProjects = state.projects.filter(p => p.name.toLowerCase().includes(q)).slice(0, 4);
  const matchedIdeas = state.ideas.filter(i => i.title.toLowerCase().includes(q)).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="მოძებნეთ დავალება, კლიენტი, პროექტი, იდეა ან ჩაწერეთ ბრძანება..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Commands list */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          
          {/* Executive Quick Actions */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-neutral-500 px-2">
              სწრაფი მოქმედებები
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => { onOpenFocus(); onClose(); }}
                className="p-2.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-left transition cursor-pointer flex items-center gap-2 text-neutral-200"
              >
                <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">ფოკუსი</span>
              </button>
              <button
                onClick={() => { onOpenQuickAdd('Task'); onClose(); }}
                className="p-2.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-left transition cursor-pointer flex items-center gap-2 text-neutral-200"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-medium">+ დავალება</span>
              </button>
              <button
                onClick={() => { onOpenQuickAdd('Income'); onClose(); }}
                className="p-2.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-left transition cursor-pointer flex items-center gap-2 text-neutral-200"
              >
                <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">+ თანხა</span>
              </button>
              <button
                onClick={() => { onOpenEndDay(); onClose(); }}
                className="p-2.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-left transition cursor-pointer flex items-center gap-2 text-neutral-200"
              >
                <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="font-medium">დღის შეჯამება</span>
              </button>
            </div>
          </div>

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase text-neutral-500 px-2">
                დავალებები ({matchedTasks.length})
              </div>
              {matchedTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => { onNavigate('WORK'); onClose(); }}
                  className="p-2 rounded-lg hover:bg-neutral-900 flex items-center justify-between transition cursor-pointer text-neutral-300"
                >
                  <span className="font-medium">{t.title}</span>
                  <span className="font-mono text-[10px] text-neutral-500">ვადა: {t.dueDate}</span>
                </div>
              ))}
            </div>
          )}

          {/* Matched Clients */}
          {matchedClients.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase text-neutral-500 px-2">
                კლიენტები ({matchedClients.length})
              </div>
              {matchedClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => { onNavigate('BUSINESS'); onClose(); }}
                  className="p-2 rounded-lg hover:bg-neutral-900 flex items-center justify-between transition cursor-pointer text-neutral-300"
                >
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.nextAction && (
                      <span className="text-neutral-500 ml-2">→ {c.nextAction}</span>
                    )}
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">{formatGEL(c.expectedRevenue)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Matched Projects */}
          {matchedProjects.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase text-neutral-500 px-2">
                პროექტები ({matchedProjects.length})
              </div>
              {matchedProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => { onNavigate('WORK'); onClose(); }}
                  className="p-2 rounded-lg hover:bg-neutral-900 flex items-center justify-between transition cursor-pointer text-neutral-300"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{p.area}</span>
                </div>
              ))}
            </div>
          )}

          {/* Direct Navigation shortcuts */}
          <div className="space-y-1 pt-2 border-t border-neutral-900">
            <div className="text-[10px] font-mono uppercase text-neutral-500 px-2">
              სექციები
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {([
                { id: 'TODAY' as MainTab, label: 'დღეს' },
                { id: 'WORK' as MainTab, label: 'სამუშაო' },
                { id: 'BUSINESS' as MainTab, label: 'ბიზნესი' },
                { id: 'MONEY' as MainTab, label: 'ფინანსები' },
                { id: 'LIFE' as MainTab, label: 'ჯანმრთელობა' },
                { id: 'CALENDAR' as MainTab, label: 'კალენდარი' },
                { id: 'WORKSPACE' as MainTab, label: 'Google Suite & რუკა' },
                { id: 'REVIEW' as MainTab, label: 'დღის შეჯამება' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { onNavigate(tab.id); onClose(); }}
                  className="p-2 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-left font-mono text-[11px] transition cursor-pointer"
                >
                  → {tab.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-neutral-900/60 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Esc — დახურვა</span>
          <span>EVOLVE OS Central Command</span>
        </div>

      </div>
    </div>
  );
};
