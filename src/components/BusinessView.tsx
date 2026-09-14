import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ArrowRight, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Check, 
  DollarSign, 
  Filter, 
  PhoneCall, 
  Mail, 
  Building2,
  History,
  Plus,
  MapPin
} from 'lucide-react';
import { EvolveState, Client, Lead, CRMStage, ClientActivity } from '../types';
import { formatGEL, getDaysDifference, getTbilisiTodayDate } from '../utils/date';
import { calculateFinancialMetrics } from '../services/smartEngine';
import { ClientTimelineModal } from './ClientTimelineModal';
import { GoogleMapsView } from './GoogleMapsView';

interface BusinessViewProps {
  state: EvolveState;
  onUpdateClient: (client: Client) => void;
  onConvertLeadToClient: (leadId: string) => void;
  onOpenQuickAdd: (type: 'Client' | 'Lead') => void;
  onAddClientActivity?: (activity: Omit<ClientActivity, 'id' | 'createdAt'>) => void;
}

export const BusinessView: React.FC<BusinessViewProps> = ({
  state,
  onUpdateClient,
  onConvertLeadToClient,
  onOpenQuickAdd,
  onAddClientActivity,
}) => {
  const [activeTab, setActiveTab] = useState<'Clients' | 'Leads' | 'FollowUps' | 'Map'>('Clients');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedTimelineClient, setSelectedTimelineClient] = useState<Client | null>(null);
  const today = getTbilisiTodayDate();
  const metrics = calculateFinancialMetrics(state);

  const stages: CRMStage[] = [
    'Lead', 'Contacted', 'Interested', 'Negotiating', 'Active', 'Recurring', 'Inactive'
  ];

  // Filter clients
  const filteredClients = state.clients.filter(c => {
    if (selectedStage !== 'All' && c.stage !== selectedStage) return false;
    return true;
  });

  // Identify clients without next action
  const clientsWithoutNextAction = state.clients.filter(
    c => (c.stage === 'Active' || c.stage === 'Recurring' || c.stage === 'Negotiating') && !c.nextAction
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>ბიზნესი და კლიენტების CRM</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            კლიენტებთან ურთიერთობა, Pipeline-ის მართვა და სავალდებულო Follow-up-ები
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {(['Clients', 'Leads', 'FollowUps', 'Map'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab === 'Map' && <MapPin className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{tab === 'Clients' ? 'კლიენტები' : tab === 'Leads' ? 'Leads' : tab === 'FollowUps' ? 'Follow-up-ები' : 'რუკა (Google Maps)'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PIPELINE OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">აქტიური Pipeline</div>
          <div className="text-xl font-bold font-mono text-neutral-100">{formatGEL(metrics.pipelineTotal)}</div>
          <div className="text-[11px] text-neutral-400">პოტენციური შესაძლებლობების ჯამი</div>
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-blue-950/15 p-4 space-y-1">
          <div className="text-[10px] font-mono text-blue-400 uppercase">მოსალოდნელი შემოსავალი</div>
          <div className="text-xl font-bold font-mono text-blue-300">{formatGEL(metrics.expectedIncome)}</div>
          <div className="text-[11px] text-neutral-400">ჩაბარებული ეტაპები და ინვოისები</div>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-4 space-y-1">
          <div className="text-[10px] font-mono text-emerald-400 uppercase">მიღებული შემოსავალი</div>
          <div className="text-xl font-bold font-mono text-emerald-300">{formatGEL(metrics.receivedIncome)}</div>
          <div className="text-[11px] text-neutral-400">ანგარიშზე ჩარიცხული თანხა</div>
        </div>
      </div>

      {/* Missing Next Action Warning Box */}
      {clientsWithoutNextAction.length > 0 && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{clientsWithoutNextAction.length} აქტიურ კლიენტს</strong> არ აქვს დანიშნული შემდგომი ნაბიჯი (Next Action). ყოველ აქტიურ კლიენტს სჭირდება დაფიქსირებული შეთანხმება.
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: CLIENTS */}
      {activeTab === 'Clients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Stage filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> ეტაპი:
              </span>
              <button
                onClick={() => setSelectedStage('All')}
                className={`px-2.5 py-1 rounded-full text-xs font-mono transition cursor-pointer ${
                  selectedStage === 'All' ? 'bg-neutral-200 text-neutral-900 font-bold' : 'bg-neutral-900 text-neutral-400'
                }`}
              >
                ყველა
              </button>
              {stages.map(stage => (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono transition cursor-pointer whitespace-nowrap ${
                    selectedStage === stage ? 'bg-neutral-200 text-neutral-900 font-bold' : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <button
              onClick={() => onOpenQuickAdd('Client')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>კლიენტის დამატება</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map(client => {
              const hasOverdueFollowUp = client.nextActionDate && getDaysDifference(client.nextActionDate, today) < 0;
              const hasTodayFollowUp = client.nextActionDate && getDaysDifference(client.nextActionDate, today) === 0;

              return (
                <div
                  key={client.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                            {client.stage}
                          </span>
                          {client.company && (
                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {client.company}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-neutral-100 pt-1">
                          {client.name}
                        </h3>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs text-emerald-400 font-bold">
                          {formatGEL(client.expectedRevenue || 0)}
                        </div>
                        <div className="text-[10px] text-neutral-500">მოსალოდნელი</div>
                      </div>
                    </div>

                    {client.contact && (
                      <div className="text-xs text-neutral-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-500" />
                        <span>{client.contact}</span>
                      </div>
                    )}

                    {client.notes && (
                      <p className="text-xs text-neutral-300 bg-neutral-950/60 p-2.5 rounded border border-neutral-850 leading-relaxed">
                        {client.notes}
                      </p>
                    )}

                    {/* Next Action Box */}
                    <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                      hasOverdueFollowUp
                        ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                        : hasTodayFollowUp
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                        : client.nextAction
                        ? 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
                        : 'bg-rose-950/10 border-dashed border-rose-800 text-rose-400'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                        <span>შემდგომი ნაბიჯი (Next Action)</span>
                        {client.nextActionDate && (
                          <span className="font-bold">
                            {hasTodayFollowUp ? 'დღეს' : hasOverdueFollowUp ? 'ვადაგადაცილებული' : client.nextActionDate}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-neutral-200">
                        {client.nextAction || '⚠ შემდგომი ნაბიჯი არ არის დაგეგმილი — დაამატეთ შემდეგი ეტაპი!'}
                      </div>
                    </div>
                  </div>

                  {/* Financial metrics bar for this client */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-center font-mono text-[11px]">
                    <div className="p-1 rounded bg-neutral-950/40">
                      <div className="text-neutral-500 text-[9px] uppercase">პოტენციალი</div>
                      <div className="text-neutral-300">{formatGEL(client.potentialValue)}</div>
                    </div>
                    <div className="p-1 rounded bg-neutral-950/40">
                      <div className="text-blue-400 text-[9px] uppercase">მოსალოდნელი</div>
                      <div className="text-blue-300">{formatGEL(client.expectedRevenue)}</div>
                    </div>
                    <div className="p-1 rounded bg-neutral-950/40">
                      <div className="text-emerald-400 text-[9px] uppercase">მიღებული</div>
                      <div className="text-emerald-300">{formatGEL(client.receivedRevenue)}</div>
                    </div>
                  </div>

                  {/* Interaction Log & Timeline Actions */}
                  <div className="pt-2 border-t border-neutral-850 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTimelineClient(client)}
                      className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Timeline ({state.clientActivities.filter(a => a.clientId === client.id).length})</span>
                    </button>

                    <button
                      onClick={() => setSelectedTimelineClient(client)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Touchpoint-ის ჩაწერა</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LEADS */}
      {activeTab === 'Leads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase">
              აქტიური LEADS და პოტენციური კლიენტები ({state.leads.length})
            </span>
            <button
              onClick={() => onOpenQuickAdd('Lead')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Lead-ის დამატება</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.leads.map(lead => (
              <div
                key={lead.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      {lead.stage}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {formatGEL(lead.potentialValue)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-100">
                    {lead.name}
                  </h3>
                  {lead.company && (
                    <div className="text-xs text-neutral-400">{lead.company} • წყარო: {lead.source}</div>
                  )}
                  {lead.notes && (
                    <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                      {lead.notes}
                    </p>
                  )}
                  {lead.nextAction && (
                    <div className="text-xs text-neutral-400 bg-neutral-950 p-2 rounded">
                      <span className="text-neutral-500 font-mono text-[10px] uppercase block">შემდეგი:</span>
                      {lead.nextAction} ({lead.nextActionDate || 'თარიღი არაა'})
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800">
                  <button
                    onClick={() => onConvertLeadToClient(lead.id)}
                    className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>კლიენტად გადაყვანა</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FOLLOW-UPS DUE */}
      {activeTab === 'FollowUps' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase">
            დაგეგმილი FOLLOW-UP-ები (კლიენტების ჩანაწერებიდან)
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 divide-y divide-neutral-800">
            {state.clients
              .filter(c => c.nextAction)
              .map(client => {
                const diff = client.nextActionDate ? getDaysDifference(client.nextActionDate, today) : 999;
                const isOverdue = diff < 0;
                const isToday = diff === 0;

                return (
                  <div key={client.id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-100">{client.name}</span>
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          isOverdue ? 'bg-rose-950 text-rose-400' : isToday ? 'bg-amber-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {isOverdue ? `${Math.abs(diff)} დღით ვადაგადაცილებული` : isToday ? 'დღეს' : `${diff} დღეში`}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-300 pt-1 font-medium">{client.nextAction}</div>
                      {client.expectedRevenue > 0 && (
                        <div className="text-[11px] font-mono text-emerald-400 pt-0.5">
                          მოსალოდნელი შემოსავალი: {formatGEL(client.expectedRevenue)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        // Mark follow up completed by clearing or updating next action
                        const nextDateStr = new Date();
                        nextDateStr.setDate(nextDateStr.getDate() + 7);
                        onUpdateClient({
                          ...client,
                          nextActionDate: nextDateStr.toISOString().split('T')[0],
                          nextAction: 'პროექტის სტატუსის განხილვა',
                        });
                      }}
                      className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>შესრულებულია</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MAP SUB-TAB */}
      {activeTab === 'Map' && (
        <GoogleMapsView
          clients={state.clients}
          onSelectClient={(client) => {
            setSelectedTimelineClient(client);
          }}
        />
      )}

      {/* Client Interaction Timeline Modal */}
      {selectedTimelineClient && (
        <ClientTimelineModal
          client={selectedTimelineClient}
          activities={state.clientActivities}
          onClose={() => setSelectedTimelineClient(null)}
          onAddActivity={(activity) => {
            if (onAddClientActivity) {
              onAddClientActivity(activity);
            }
          }}
          onUpdateClient={(updated) => {
            onUpdateClient(updated);
            setSelectedTimelineClient(updated);
          }}
        />
      )}

    </div>
  );
};
