import React, { useState } from 'react';
import { WorkoutDayPlan, WorkoutSessionExercise, ExerciseItem, UserProfile, HealthSafetyAssessment } from '../types';
import { EXERCISE_LIBRARY } from '../data/mockData';
import { Calendar, Play, CheckCircle2, XCircle, RotateCcw, Clock, ArrowRightLeft, Sparkles, Moon, Info, ChevronRight } from 'lucide-react';

interface ScheduleViewProps {
  schedule: WorkoutDayPlan[];
  profile: UserProfile;
  safety: HealthSafetyAssessment;
  dormitoryMode: boolean;
  onToggleDormitory: () => void;
  onStartSession: (dayPlan: WorkoutDayPlan) => void;
  onSelectExerciseDetail: (exercise: ExerciseItem) => void;
  onRegenerateSchedule: () => void;
  onUpdateDayPlan: (updatedPlan: WorkoutDayPlan) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  profile,
  safety,
  dormitoryMode,
  onToggleDormitory,
  onStartSession,
  onSelectExerciseDetail,
  onRegenerateSchedule,
  onUpdateDayPlan
}) => {
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);

  const selectedDay = schedule.find(d => d.dayOfWeek === selectedDayNum) || schedule[0];

  const handleMarkSkipped = () => {
    const reason = prompt('Nhập lý do bỏ buổi tập (để hệ thống điều chỉnh khối lượng phù hợp):', 'Bận việc học/làm');
    if (reason) {
      onUpdateDayPlan({
        ...selectedDay,
        status: 'skipped',
        skipReason: reason
      });
    }
  };

  const handleMarkCompletedManually = () => {
    onUpdateDayPlan({
      ...selectedDay,
      status: 'completed'
    });
  };

  const handleResetDayStatus = () => {
    onUpdateDayPlan({
      ...selectedDay,
      status: 'pending'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Dormitory Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Lịch tập cá nhân hóa 7 ngày
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Kế hoạch rèn luyện tuần này
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động cân bằng giữa mục tiêu và các khuyến cáo y tế của bạn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDormitory}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              dormitoryMode
                ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-xs'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-4 h-4 text-teal-600" />
            <span>Chế độ Ký túc xá: {dormitoryMode ? 'BẬT (Bài êm)' : 'TẮT'}</span>
          </button>

          <button
            onClick={onRegenerateSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs"
            title="Tạo lại lịch theo thể trạng hiện tại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tạo lại lịch</span>
          </button>
        </div>
      </div>

      {/* 7-Day Horizontal Selector */}
      <div className="grid grid-cols-7 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {schedule.map(d => {
          const isSelected = d.dayOfWeek === selectedDayNum;
          const isDone = d.status === 'completed';
          const isSkipped = d.status === 'skipped';

          return (
            <button
              key={d.dayOfWeek}
              onClick={() => setSelectedDayNum(d.dayOfWeek)}
              className={`flex flex-col items-center py-2.5 sm:py-3 px-1 rounded-xl transition-all relative ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="text-[10px] sm:text-xs font-semibold uppercase">
                {d.dayName.replace('Thứ ', 'T')}
              </span>
              <span className="text-xs sm:text-sm font-bold mt-0.5">
                {d.isRestDay ? 'Nghỉ' : 'Tập'}
              </span>

              {/* Status indicator dot */}
              {isDone && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></span>
              )}
              {isSkipped && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Day Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 uppercase">
                {selectedDay.dayName}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-500">
                Thời lượng dự kiến: {selectedDay.estimatedMinutes} phút
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-500">
                Độ khó: {selectedDay.difficulty}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mt-1">
              {selectedDay.focusArea}
            </h2>

            {/* Selection Reasoning */}
            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Lý do lựa chọn bài tập: </span>
                {selectedDay.selectionReason}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {!selectedDay.isRestDay && selectedDay.status !== 'completed' && (
              <button
                onClick={() => onStartSession(selectedDay)}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-transform"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt đầu tập ngay</span>
              </button>
            )}

            {selectedDay.status === 'completed' ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã hoàn thành buổi tập
                </span>
                <button
                  onClick={handleResetDayStatus}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Tập lại
                </button>
              </div>
            ) : selectedDay.status === 'skipped' ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                  <XCircle className="w-4 h-4" />
                  Đã bỏ buổi ({selectedDay.skipReason})
                </span>
                <button
                  onClick={handleResetDayStatus}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Tập bù
                </button>
              </div>
            ) : !selectedDay.isRestDay ? (
              <>
                <button
                  onClick={handleMarkCompletedManually}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Ghi nhận hoàn thành
                </button>
                <button
                  onClick={handleMarkSkipped}
                  className="px-3 py-2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  Bỏ buổi này
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Rest Day view */}
        {selectedDay.isRestDay ? (
          <div className="p-8 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Hôm nay là ngày nghỉ ngơi & phục hồi cơ
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {selectedDay.selectionReason} Bạn có thể đi bộ nhẹ nhàng 15–20 phút, bổ sung đủ nước và ngủ đủ giấc để cơ thể nạp lại năng lượng.
            </p>
          </div>
        ) : (
          /* Exercise List */
          <div className="space-y-4">
            {/* Warm-up row */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3 text-xs">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Khởi động chung ({selectedDay.warmupMinutes} phút):
                </span>
                <span className="text-slate-600">{selectedDay.warmupDescription}</span>
              </div>
            </div>

            {/* List of exercises */}
            <div className="space-y-3">
              {selectedDay.exercises.map((sessionEx, idx) => {
                const exDetail = EXERCISE_LIBRARY.find(e => e.id === sessionEx.exerciseId);
                if (!exDetail) return null;

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectExerciseDetail(exDetail)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 bg-white group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                        0{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                            {exDetail.nameVi}
                          </h4>
                          {sessionEx.wasSubstituted && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Đã thay bài an toàn
                            </span>
                          )}
                          {exDetail.isQuietFriendly && (
                            <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                              Êm
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span>{sessionEx.sets} hiệp × {sessionEx.repsOrDuration}</span>
                          <span>·</span>
                          <span>Nghỉ {sessionEx.restSeconds}s</span>
                          <span>·</span>
                          <span>Cơ: {exDetail.muscleGroups.join(', ')}</span>
                        </div>

                        {sessionEx.substitutionReason && (
                          <div className="text-[11px] text-amber-800 mt-1">
                            Lý do: {sessionEx.substitutionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600">
                      <span className="text-xs font-semibold hidden sm:inline">Xem hướng dẫn</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cool-down row */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3 text-xs">
              <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Giãn cơ & Hạ nhiệt ({selectedDay.cooldownMinutes} phút):
                </span>
                <span className="text-slate-600">{selectedDay.cooldownDescription}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
