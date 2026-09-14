import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Users, 
  FileText, 
  CreditCard, 
  Mail, 
  Calendar, 
  Clock, 
  Plus, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Client, ClientActivity, ClientActivityType } from '../types';
import { getTbilisiTodayDate, getDaysDifference } from '../utils/date';

interface ClientTimelineModalProps {
  client: Client;
  activities: ClientActivity[];
  onClose: () => void;
  onAddActivity: (activity: Omit<ClientActivity, 'id' | 'createdAt'>) => void;
  onUpdateClient: (updatedClient: Client) => void;
}

export function ClientTimelineModal({
  client,
  activities,
  onClose,
  onAddActivity,
  onUpdateClient,
}: ClientTimelineModalProps) {
  const today = getTbilisiTodayDate();
  const [isAdding, setIsAdding] = useState(false);
  
  // New activity form state
  const [type, setType] = useState<ClientActivityType>('Call');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [nextStepDate, setNextStepDate] = useState(today);
  const [amount, setAmount] = useState<string>('');

  const clientActivities = activities
    .filter(a => a.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedAmount = amount ? parseFloat(amount) : undefined;

    onAddActivity({
      clientId: client.id,
      date: today,
      type,
      title: title.trim(),
      notes: notes.trim() || undefined,
      nextStep: nextStep.trim() || undefined,
      nextStepDate: nextStep ? nextStepDate : undefined,
      amount: parsedAmount,
    });

    // Update client next action if provided
    if (nextStep.trim()) {
      onUpdateClient({
        ...client,
        nextAction: nextStep.trim(),
        nextActionDate: nextStepDate,
        updatedAt: new Date().toISOString(),
      });
    }

    // Reset form
    setTitle('');
    setNotes('');
    setNextStep('');
    setAmount('');
    setIsAdding(false);
  };

  const getActivityIcon = (actType: ClientActivityType) => {
    switch (actType) {
      case 'Call': return <Phone className="w-3.5 h-3.5 text-blue-400" />;
      case 'Meeting': return <Users className="w-3.5 h-3.5 text-purple-400" />;
      case 'Proposal': return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'Payment': return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Contract': return <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Email': return <Mail className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Note': default: return <Clock className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between bg-neutral-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {client.stage}
              </span>
              <h3 className="text-lg font-semibold text-white tracking-tight">{client.name}</h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {client.company || 'Direct Account'} {client.contact && `• ${client.contact}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client KPI Bar */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-950/40 border-b border-neutral-800 font-mono text-center">
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="text-[10px] text-neutral-400 uppercase">Potential</div>
            <div className="text-sm font-semibold text-neutral-200">₾{client.potentialValue.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="text-[10px] text-amber-400 uppercase">Expected</div>
            <div className="text-sm font-semibold text-amber-400">₾{client.expectedRevenue.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="text-[10px] text-emerald-400 uppercase">Received</div>
            <div className="text-sm font-semibold text-emerald-400">₾{client.receivedRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Current Active Next Action Banner */}
        {client.nextAction && (
          <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs px-5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold uppercase text-[10px] font-mono tracking-wider">Scheduled Next Action:</span>
              <span className="text-neutral-200 font-medium">{client.nextAction}</span>
            </div>
            {client.nextActionDate && (
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                client.nextActionDate < today 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'bg-neutral-800 text-neutral-300'
              }`}>
                Due: {client.nextActionDate}
              </span>
            )}
          </div>
        )}

        {/* Log Action Trigger */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="text-xs font-medium text-neutral-300">
            Activity Timeline ({clientActivities.length} logs)
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Interaction
            </button>
          )}
        </div>

        {/* Add Interaction Form */}
        {isAdding && (
          <form onSubmit={handleSave} className="p-4 bg-neutral-950/70 border-b border-neutral-800 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase font-mono tracking-wider">
                Log New Interaction
              </span>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Call', 'Meeting', 'Proposal', 'Payment', 'Contract', 'Email', 'Note'] as ClientActivityType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-2 rounded-lg text-xs font-medium border text-center transition flex items-center justify-center gap-1.5 ${
                    type === t 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {getActivityIcon(t)}
                  {t}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Interaction summary (e.g. Call regarding video edits and milestone 1 signoff)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Next Action resulting from this (e.g. Send revised contract draft)"
                  value={nextStep}
                  onChange={e => setNextStep(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={nextStepDate}
                  onChange={e => setNextStepDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {(type === 'Payment' || type === 'Proposal') && (
                <input
                  type="number"
                  placeholder="Amount (₾)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-32 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              )}
              <input
                type="text"
                placeholder="Internal notes or observations (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition"
              >
                Save Interaction
              </button>
            </div>
          </form>
        )}

        {/* Timeline Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {clientActivities.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs italic">
              No logged interactions for {client.name} yet. Tap "Log Interaction" above to record calls, meetings, and proposals.
            </div>
          ) : (
            clientActivities.map((act, index) => {
              const daysDiff = getDaysDifference(act.date, today);
              const isToday = act.date === today;

              return (
                <div key={act.id} className="relative pl-6 pb-2 border-l border-neutral-800 last:border-l-0">
                  {/* Timeline node icon */}
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                    {getActivityIcon(act.type)}
                  </div>

                  <div className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 rounded-xl p-3.5 transition">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-200">{act.title}</span>
                        {act.amount && (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ₾{act.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                        <span>{act.date}</span>
                        <span>•</span>
                        <span>{isToday ? 'Today' : `${Math.abs(daysDiff)}d ago`}</span>
                      </div>
                    </div>

                    {act.notes && (
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        {act.notes}
                      </p>
                    )}

                    {act.nextStep && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-700/50 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                          <span className="text-neutral-400 font-mono">Next step:</span>
                          <span className="font-medium text-neutral-200">{act.nextStep}</span>
                        </div>
                        {act.nextStepDate && (
                          <span className="font-mono text-neutral-400">
                            Due: {act.nextStepDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            Close Timeline
          </button>
        </div>

      </div>
    </div>
  );
}
