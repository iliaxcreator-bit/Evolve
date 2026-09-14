import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Filter, 
  PieChart, 
  Building, 
  CheckCircle, 
  Clock, 
  TrendingUp 
} from 'lucide-react';
import { EvolveState, Transaction, IncomeStatus } from '../types';
import { formatGEL, getTbilisiTodayDate } from '../utils/date';
import { calculateFinancialMetrics } from '../services/smartEngine';

interface MoneyViewProps {
  state: EvolveState;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenQuickAdd: (type: 'Income' | 'Expense' | 'MoneyAction') => void;
}

export const MoneyView: React.FC<MoneyViewProps> = ({
  state,
  onAddTransaction,
  onOpenQuickAdd,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'Transactions' | 'Economics'>('Transactions');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const metrics = calculateFinancialMetrics(state);
  const today = getTbilisiTodayDate();

  // Filtered transactions
  const filteredTransactions = state.transactions.filter(t => {
    if (typeFilter !== 'All' && t.type !== typeFilter) return false;
    return true;
  });

  // Client economics calculation
  const totalReceivedAcrossAll = metrics.receivedIncome || 1; // avoid division by zero
  const clientEconomics = state.clients.map(client => {
    const clientTransactions = state.transactions.filter(t => t.clientId === client.id);
    const received = clientTransactions
      .filter(t => t.type === 'Income' && t.status === 'Received')
      .reduce((sum, t) => sum + t.amount, client.receivedRevenue || 0);

    const expenses = clientTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netContribution = received - expenses;
    const concentrationPercent = totalReceivedAcrossAll > 0 
      ? Math.round((received / totalReceivedAcrossAll) * 100) 
      : 0;

    return {
      client,
      received,
      expected: client.expectedRevenue || 0,
      potential: client.potentialValue || 0,
      expenses,
      netContribution,
      concentrationPercent,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>ფინანსური კონტროლის ცენტრი</span>
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            რეალური ფინანსური სურათი: მიღებული vs მოსალოდნელი vs ხარჯები
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveSubTab('Transactions')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeSubTab === 'Transactions'
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              ტრანზაქციები
            </button>
            <button
              onClick={() => setActiveSubTab('Economics')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeSubTab === 'Economics'
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              კლიენტების ეკონომიკა
            </button>
          </div>

          <button
            onClick={() => onOpenQuickAdd('Income')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>შემოსავლის ჩაწერა</span>
          </button>
        </div>
      </div>

      {/* 5 EXECUTIVE FINANCIAL METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        {/* Received */}
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-4 space-y-1">
          <div className="text-[10px] font-mono text-emerald-400 uppercase">მიღებული (ანგარიშზე)</div>
          <div className="text-xl font-bold font-mono text-emerald-300">{formatGEL(metrics.receivedIncome)}</div>
          <div className="text-[11px] text-neutral-500">რეალიზებული თანხა</div>
        </div>

        {/* Expected */}
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/15 p-4 space-y-1">
          <div className="text-[10px] font-mono text-blue-400 uppercase">მოსალოდნელი</div>
          <div className="text-xl font-bold font-mono text-blue-300">{formatGEL(metrics.expectedIncome)}</div>
          <div className="text-[11px] text-neutral-500">ინვოისები და ეტაპები</div>
        </div>

        {/* Pipeline */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase">Pipeline-ის ღირებულება</div>
          <div className="text-xl font-bold font-mono text-neutral-200">{formatGEL(metrics.pipelineTotal)}</div>
          <div className="text-[11px] text-neutral-500">აქტიური შეთავაზებები</div>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/15 p-4 space-y-1">
          <div className="text-[10px] font-mono text-rose-400 uppercase">რეალური ხარჯები</div>
          <div className="text-xl font-bold font-mono text-rose-300">{formatGEL(metrics.expensesTotal)}</div>
          <div className="text-[11px] text-neutral-500">გაწეული ხარჯი</div>
        </div>

        {/* Net Cash */}
        <div className={`col-span-2 sm:col-span-1 rounded-xl border p-4 space-y-1 ${
          metrics.netCash >= 0
            ? 'border-emerald-500/40 bg-emerald-950/20'
            : 'border-rose-500/40 bg-rose-950/20'
        }`}>
          <div className="text-[10px] font-mono uppercase text-neutral-400">Net Cash პოზიცია</div>
          <div className={`text-xl font-bold font-mono ${metrics.netCash >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {formatGEL(metrics.netCash)}
          </div>
          <div className="text-[11px] text-neutral-400">მიღებული − ხარჯები</div>
        </div>

      </div>

      {/* SUB TAB 1: TRANSACTIONS LEDGER */}
      {activeSubTab === 'Transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-neutral-400 uppercase">ფილტრი:</span>
              {(['All', 'Income', 'Expense'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                    typeFilter === f ? 'bg-neutral-200 text-neutral-900 font-bold' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-850'
                  }`}
                >
                  {f === 'All' ? 'ყველა' : f === 'Income' ? 'შემოსავალი' : 'ხარჯი'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenQuickAdd('Expense')}
                className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-medium cursor-pointer"
              >
                + ხარჯი
              </button>
              <button
                onClick={() => onOpenQuickAdd('Income')}
                className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium cursor-pointer"
              >
                + შემოსავალი
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {filteredTransactions.map(tx => {
                const isIncome = tx.type === 'Income';
                const client = tx.clientId ? state.clients.find(c => c.id === tx.clientId) : undefined;

                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-850/50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isIncome ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-100">{tx.category}</span>
                          {client && (
                            <span className="text-xs text-neutral-400 font-mono">
                              ({client.name})
                            </span>
                          )}
                          {isIncome && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                              tx.status === 'Received' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-blue-900/40 text-blue-400'
                            }`}>
                              {tx.status === 'Received' ? 'მიღებული' : 'მოსალოდნელი'}
                            </span>
                          )}
                        </div>
                        {tx.notes && (
                          <div className="text-xs text-neutral-400">{tx.notes}</div>
                        )}
                        <div className="text-[10px] font-mono text-neutral-500">თარიღი: {tx.date}</div>
                      </div>
                    </div>

                    <div className={`font-mono text-base font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+' : '-'}{formatGEL(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: CLIENT ECONOMICS */}
      {activeSubTab === 'Economics' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase">
            კლიენტების ერთეულოვანი ეკონომიკა და შემოსავლის კონცენტრაცია
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 font-mono text-[11px] text-neutral-500 uppercase bg-neutral-950/40">
                  <th className="p-3.5">კლიენტი</th>
                  <th className="p-3.5">ეტაპი</th>
                  <th className="p-3.5">პოტენციალი</th>
                  <th className="p-3.5">მოსალოდნელი</th>
                  <th className="p-3.5">მიღებული</th>
                  <th className="p-3.5">ხარჯები</th>
                  <th className="p-3.5">სუფთა მოგება</th>
                  <th className="p-3.5">წილი შემოსავალში</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono">
                {clientEconomics.map(({ client, received, expected, potential, expenses, netContribution, concentrationPercent }) => (
                  <tr key={client.id} className="hover:bg-neutral-850/40 transition">
                    <td className="p-3.5 font-semibold text-neutral-200">{client.name}</td>
                    <td className="p-3.5 text-neutral-400">{client.stage}</td>
                    <td className="p-3.5 text-neutral-300">{formatGEL(potential)}</td>
                    <td className="p-3.5 text-blue-400 font-bold">{formatGEL(expected)}</td>
                    <td className="p-3.5 text-emerald-400 font-bold">{formatGEL(received)}</td>
                    <td className="p-3.5 text-rose-400">{formatGEL(expenses)}</td>
                    <td className="p-3.5 text-emerald-300 font-bold">{formatGEL(netContribution)}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, concentrationPercent)}%` }} />
                        </div>
                        <span className="text-neutral-400 text-[10px]">{concentrationPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
