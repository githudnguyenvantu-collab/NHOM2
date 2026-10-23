import React from 'react';
import { ShieldCheck, Moon, Sun, ShoppingBag, Bell, Activity, RefreshCw } from 'lucide-react';
import { SafetyTier } from '../types';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  safetyTier: SafetyTier;
  cartCount: number;
  dormitoryMode: boolean;
  onToggleDormitory: () => void;
  isOffline: boolean;
  onOpenQuickMetrics: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  safetyTier,
  cartCount,
  dormitoryMode,
  onToggleDormitory,
  isOffline,
  onOpenQuickMetrics
}) => {
  const safetyBadge = {
    good_progress: { text: 'Tiến bộ tốt', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    caution: { text: 'Mức lưu ý', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    high_alert: { text: 'Cảnh báo cao', bg: 'bg-red-50 text-red-700 border-red-200' }
  }[safetyTier];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Offline Alert Strip if network drops */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-medium py-1 px-4 text-center">
          Đang hoạt động Ngoại tuyến (Offline-First). Dữ liệu được lưu trữ an toàn trên thiết bị của bạn.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone (Single element wordmark) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-500/20">
              D
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                DISCI
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Luyện tập tại nhà & Tiết kiệm
              </div>
            </div>
          </button>

          {/* Safety Status Indicator */}
          <div className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${safetyBadge.bg}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{safetyBadge.text}</span>
          </div>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'schedule', label: 'Lịch tập' },
            { id: 'library', label: 'Bài tập' },
            { id: 'progress', label: 'Tiến độ' },
            { id: 'community', label: 'Cộng đồng' },
            { id: 'body_report', label: 'Thể trạng & Gợi ý' },
            { id: 'cost_comparison', label: 'So sánh chi phí' },
            { id: 'traceability', label: 'Kiểm kê yêu cầu' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Action Zone */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Chế độ Ký túc xá Quick Toggle */}
          <button
            onClick={onToggleDormitory}
            title={dormitoryMode ? 'Chế độ Ký túc xá đang BẬT (Bài tập êm không nhảy)' : 'Chế độ thường'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              dormitoryMode
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ký túc xá:</span>
            <span className="font-semibold">{dormitoryMode ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Nút Nhập chỉ số nhanh */}
          <button
            onClick={onOpenQuickMetrics}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Nhập chỉ số</span>
          </button>

          {/* Giỏ hàng Button */}
          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Giỏ hàng dụng cụ"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile & Settings Button */}
          <button
            onClick={() => onNavigate('settings')}
            className={`p-1.5 rounded-lg border transition-colors ${
              currentTab === 'settings'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Cài đặt & Quyền riêng tư"
            aria-label="Cài đặt cá nhân"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              TÚ
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
