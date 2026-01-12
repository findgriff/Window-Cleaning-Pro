import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'dashboard' as Screen, label: 'Home', icon: 'dashboard' },
    { id: 'schedule' as Screen, label: 'Schedule', icon: 'calendar_month' },
    { id: 'customers' as Screen, label: 'CRM', icon: 'group' },
    { id: 'invoice' as Screen, label: 'Invoices', icon: 'payments' },
    { id: 'reports' as Screen, label: 'Reports', icon: 'analytics' },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] h-20 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-4 pb-4 z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
            currentScreen === item.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentScreen === item.id ? 'bg-primary/10' : ''}`}>
            <span className={`material-symbols-outlined text-2xl ${currentScreen === item.id ? 'fill-current' : ''}`}>
              {item.icon}
            </span>
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-tight ${currentScreen === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;