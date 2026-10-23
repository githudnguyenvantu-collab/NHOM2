import React from 'react';
import { Home, Calendar, Users, TrendingUp, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Home },
    { id: 'schedule', label: 'Lịch tập', icon: Calendar },
    { id: 'community', label: 'Cộng đồng', icon: Users },
    { id: 'progress', label: 'Tiến độ', icon: TrendingUp },
    { id: 'settings', label: 'Cá nhân', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                isActive ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full px-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
