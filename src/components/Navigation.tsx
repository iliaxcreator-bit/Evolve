import React from 'react';
import { 
  Sun, 
  Briefcase, 
  Users, 
  DollarSign, 
  HeartPulse, 
  CheckCircle2, 
  Calendar, 
  Sparkles,
  Globe
} from 'lucide-react';

export type MainTab = 'TODAY' | 'WORK' | 'BUSINESS' | 'MONEY' | 'LIFE' | 'REVIEW' | 'CALENDAR' | 'WORKSPACE';

interface NavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  needsAttentionCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  needsAttentionCount = 0,
}) => {
  const tabs: { id: MainTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'TODAY', label: 'დღეს', icon: <Sun className="w-4 h-4" />, badge: needsAttentionCount },
    { id: 'WORK', label: 'სამუშაო & პროექტები', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'BUSINESS', label: 'ბიზნესი & CRM', icon: <Users className="w-4 h-4" /> },
    { id: 'MONEY', label: 'ფინანსები', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'LIFE', label: 'ჯანმრთელობა', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'CALENDAR', label: 'კალენდარი', icon: <Calendar className="w-4 h-4" /> },
    { id: 'WORKSPACE', label: 'Google Suite & რუკა', icon: <Globe className="w-4 h-4" /> },
    { id: 'REVIEW', label: 'დღის შეჯამება', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-start overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.toLowerCase()}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs font-medium tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-neutral-500'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
