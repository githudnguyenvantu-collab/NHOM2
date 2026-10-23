import React from 'react';
import { UserProfile, WorkoutDayPlan, BodyMetricRecord, HealthSafetyAssessment } from '../types';
import { Play, Activity, Calendar, Moon, Sparkles, TrendingUp, ShieldCheck, HeartPulse, Scale, CheckCircle2, ChevronRight, Utensils, Award } from 'lucide-react';
import { SafetyAlertBanner } from './SafetyAlertBanner';

interface OverviewViewProps {
  profile: UserProfile;
  schedule: WorkoutDayPlan[];
  metrics: BodyMetricRecord[];
  safety: HealthSafetyAssessment;
  dormitoryMode: boolean;
  onToggleDormitory: () => void;
  onStartSession: (dayPlan: WorkoutDayPlan) => void;
  onNavigate: (tab: string) => void;
  onOpenQuickMetrics: () => void;
  onOpenRecoveryCheckin: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  profile,
  schedule,
  metrics,
  safety,
  dormitoryMode,
  onToggleDormitory,
  onStartSession,
  onNavigate,
  onOpenQuickMetrics,
  onOpenRecoveryCheckin
}) => {
  // Determine today's day of week (1 = Monday, 7 = Sunday)
  const todayJs = new Date().getDay(); // 0 is Sun, 1 is Mon...
  const todayNum = todayJs === 0 ? 7 : todayJs;
  const todayPlan = schedule.find(d => d.dayOfWeek === todayNum) || schedule[0];

  const latestMetric = metrics[0] || { weightKg: profile.weightKg, bmi: 22.5, restingHeartRate: 72 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Personal Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Luyện tập khoa học · Giảm rủi ro chấn thương
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Chào {profile.fullName}, sẵn sàng rèn luyện hôm nay?
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục tiêu: <span className="font-semibold text-slate-700">{profile.workoutGoal === 'muscle_gain' ? 'Tăng cơ nạc' : 'Giảm mỡ & Săn chắc'}</span> · {profile.workoutsPerWeek} buổi/tuần
          </p>
        </div>

        {/* Quick Check-in Button */}
        <button
          onClick={onOpenRecoveryCheckin}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-emerald-700 transition-all shrink-0"
        >
          <Moon className="w-4 h-4" />
          <span>Check-in phục hồi (10s)</span>
        </button>
      </div>

      {/* 2. Three-tier Safety Alert Banner */}
      <SafetyAlertBanner safety={safety} onOpenCheckupModal={() => onNavigate('body_report')} />

      {/* 3. Hero Card: Today's Workout */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                Buổi tập hôm nay ({todayPlan.dayName})
              </span>
              {dormitoryMode && (
                <span className="bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-full border border-teal-500/30">
                  Chế độ Ký túc xá: Êm
                </span>
              )}
            </div>

            <div className="text-xs font-mono text-slate-400">
              {todayPlan.estimatedMinutes} phút · Độ khó: {todayPlan.difficulty}
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {todayPlan.focusArea}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {todayPlan.selectionReason}
            </p>
          </div>

          {/* Exercises Snapshot */}
          {!todayPlan.isRestDay && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {todayPlan.exercises.slice(0, 4).map((ex, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 text-xs">
                  <div className="text-[10px] text-emerald-400 font-mono font-bold">Bài 0{idx + 1}</div>
                  <div className="font-semibold text-white truncate mt-0.5">{ex.repsOrDuration}</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{ex.sets} hiệp</div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!todayPlan.isRestDay ? (
              <button
                onClick={() => onStartSession(todayPlan)}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-transform"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt đầu buổi tập ngay</span>
              </button>
            ) : (
              <div className="text-xs text-teal-300 font-medium bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                Hôm nay là ngày nghỉ ngơi phục hồi cơ bắp. Hãy thả lỏng và ngủ đủ giấc.
              </div>
            )}

            <button
              onClick={() => onNavigate('schedule')}
              className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-2xl border border-white/20 transition-colors"
            >
              Xem chi tiết lịch 7 ngày
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Weight */}
        <div
          onClick={onOpenQuickMetrics}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600">
            <span className="text-[10px] font-bold uppercase">Cân nặng</span>
            <Scale className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {latestMetric.weightKg} <span className="text-xs text-slate-500 font-sans">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Nhấp để cập nhật</span>
        </div>

        {/* BMI */}
        <div
          onClick={() => onNavigate('body_report')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600">
            <span className="text-[10px] font-bold uppercase">BMI tham khảo</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {latestMetric.bmi}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Cân đối tham khảo</span>
        </div>

        {/* Resting HR */}
        <div
          onClick={onOpenQuickMetrics}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600">
            <span className="text-[10px] font-bold uppercase">Nhịp tim nghỉ</span>
            <HeartPulse className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {latestMetric.restingHeartRate || 72} <span className="text-xs text-slate-500 font-sans">bpm</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Ổn định</span>
        </div>

        {/* Dormitory mode quick toggle */}
        <div
          onClick={onToggleDormitory}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            dormitoryMode
              ? 'bg-teal-50/80 border-teal-300 text-teal-900'
              : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase">Chế độ phòng trọ</span>
            <Moon className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-black mt-1">
            {dormitoryMode ? 'ĐANG BẬT' : 'ĐANG TẮT'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {dormitoryMode ? 'Bài tập êm không nhảy' : 'Bật khi ở phòng trọ'}
          </span>
        </div>
      </div>

      {/* 5. Navigation Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shortcut 1: Báo cáo thể trạng & Gợi ý sản phẩm */}
        <div
          onClick={() => onNavigate('body_report')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
            Báo cáo thể trạng & Gợi ý sản phẩm
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Xem phân tích TDEE/BMI và danh mục thiết bị tiết kiệm giá sinh viên phù hợp với hồ sơ của bạn.
          </p>
        </div>

        {/* Shortcut 2: So sánh chi phí */}
        <div
          onClick={() => onNavigate('cost_comparison')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
            So sánh chi phí với phòng Gym
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ước tính số tiền bạn có thể tiết kiệm được khi tự rèn luyện tại nhà so với vé tháng và tiền thuê PT.
          </p>
        </div>

        {/* Shortcut 3: Thư viện bài tập */}
        <div
          onClick={() => onNavigate('library')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-slate-900 transition-colors">
            Thư viện bài tập & Hướng dẫn kỹ thuật
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tra cứu tư thế chuẩn, cách thở, các lỗi sai phổ biến và các bài tập thay thế an toàn cho khớp.
          </p>
        </div>
      </div>
    </div>
  );
};
