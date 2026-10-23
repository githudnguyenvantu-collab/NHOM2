import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, SkipForward, AlertTriangle, HeartPulse, ChevronRight, CheckCircle2 } from 'lucide-react';
import { WorkoutDayPlan, WorkoutSessionLog, ExerciseItem } from '../types';
import { EXERCISE_LIBRARY } from '../data/mockData';

interface ActiveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayPlan: WorkoutDayPlan;
  onFinishSession: (log: WorkoutSessionLog) => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  isOpen,
  onClose,
  dayPlan,
  onFinishSession
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(60);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Pain and Fatigue state
  const [painReported, setPainReported] = useState(false);
  const [painLocation, setPainLocation] = useState('');
  const [fatigueReported, setFatigueReported] = useState(false);

  // Finishing state
  const [isCompleting, setIsCompleting] = useState(false);
  const [rpe, setRpe] = useState(6);
  const [userNotes, setUserNotes] = useState('');

  // Track completed exercises count
  const [completedExercisesCount, setCompletedExercisesCount] = useState(0);

  const currentSessionEx = dayPlan.exercises[currentExerciseIndex];
  const currentExDetail: ExerciseItem | undefined = EXERCISE_LIBRARY.find(
    e => e.id === currentSessionEx?.exerciseId
  );

  // Main workout elapsed timer
  useEffect(() => {
    if (!isOpen || isPaused || isCompleting) return;
    const timer = setInterval(() => {
      setWorkoutElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPaused, isCompleting]);

  // Rest countdown timer
  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setRestSecondsLeft(s => {
        if (s <= 1) {
          setIsResting(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isResting, restSecondsLeft]);

  if (!isOpen || !currentSessionEx || !currentExDetail) return null;

  const totalSets = currentSessionEx.sets || 3;

  const handleCompleteSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet(s => s + 1);
      setRestSecondsLeft(currentSessionEx.restSeconds || 45);
      setIsResting(true);
    } else {
      // Completed all sets for this exercise
      setCompletedExercisesCount(c => c + 1);
      if (currentExerciseIndex < dayPlan.exercises.length - 1) {
        setCurrentExerciseIndex(i => i + 1);
        setCurrentSet(1);
        setRestSecondsLeft(60);
        setIsResting(true);
      } else {
        // Done all exercises
        setIsCompleting(true);
      }
    }
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < dayPlan.exercises.length - 1) {
      setCurrentExerciseIndex(i => i + 1);
      setCurrentSet(1);
      setIsResting(false);
    } else {
      setIsCompleting(true);
    }
  };

  const handleReportPain = (location: string) => {
    setPainReported(true);
    setPainLocation(location);
    // Pause immediately for user safety
    setIsPaused(true);
  };

  const handleFinalSubmit = () => {
    const durationMinutes = Math.max(Math.round(workoutElapsedSeconds / 60), 1);
    const totalExercises = dayPlan.exercises.length;
    const completionRate = totalExercises > 0
      ? Math.round((completedExercisesCount / totalExercises) * 100)
      : 100;

    const log: WorkoutSessionLog = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString(),
      dayOfWeek: dayPlan.dayOfWeek,
      durationMinutes,
      rpeRating: rpe,
      completionRatePercent: completionRate,
      reportedPain: painReported,
      painLocation: painLocation || undefined,
      reportedFatigue: fatigueReported,
      userNotes: userNotes.trim() || undefined,
      completedExercisesCount
    };

    onFinishSession(log);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              {dayPlan.dayName} · {dayPlan.focusArea}
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
              <span>Thời gian: {formatTime(workoutElapsedSeconds)}</span>
              {isPaused && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                  Đang tạm dừng
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-600" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              aria-label="Đóng buổi tập"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar across exercises */}
        <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${((currentExerciseIndex + (currentSet / totalSets)) / dayPlan.exercises.length) * 100}%`
            }}
          ></div>
        </div>

        {/* Body Content */}
        {isCompleting ? (
          /* Completion Flow with RPE and notes */
          <div className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Chúc mừng bạn đã hoàn thành buổi tập!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tổng thời lượng: <span className="font-bold text-slate-800">{formatTime(workoutElapsedSeconds)}</span> · Hoàn thành <span className="font-bold text-emerald-700">{completedExercisesCount}/{dayPlan.exercises.length}</span> bài tập.
              </p>
            </div>

            {/* RPE 1-10 Stepper */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Mức độ gắng sức cảm nhận (Thang RPE 1–10)
                </label>
                <span className="text-sm font-extrabold text-emerald-700">
                  {rpe}/10 · {rpe <= 4 ? 'Rất nhẹ' : rpe <= 6 ? 'Vừa phải' : rpe <= 8 ? 'Thử thách tốt' : 'Rất nặng'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={e => setRpe(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>1 (Nhẹ nhàng)</span>
                <span>5 (Vừa sức)</span>
                <span>8 (Gắng sức tốt)</span>
                <span>10 (Kiệt sức)</span>
              </div>
            </div>

            {/* Feelings & Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Cảm nhận sau tập / Ghi chú cho lần tới:
              </label>
              <textarea
                value={userNotes}
                onChange={e => setUserNotes(e.target.value)}
                placeholder="Ví dụ: Đỡ mỏi lưng hơn, bài chống đẩy vào ghế rất vừa sức..."
                className="w-full h-20 p-3 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500"
              />
            </div>

            <button
              onClick={handleFinalSubmit}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
            >
              Lưu vào nhật ký tiến độ
            </button>
          </div>
        ) : (
          /* Active exercise execution */
          <div className="p-5 space-y-5">
            {/* Rest Timer Overlay if active */}
            {isResting && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-extrabold font-mono text-base">
                    {restSecondsLeft}s
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-900">Nghỉ ngơi thả lỏng</div>
                    <div className="text-[11px] text-teal-700">Hít thở sâu, chuẩn bị hiệp {currentSet}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsResting(false)}
                  className="px-3 py-1.5 bg-white text-teal-800 text-xs font-bold rounded-lg border border-teal-300 hover:bg-teal-100"
                >
                  Bỏ qua nghỉ
                </button>
              </div>
            )}

            {/* Exercise Header & Substitution Flag */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Bài {currentExerciseIndex + 1} / {dayPlan.exercises.length}</span>
                <span className="font-semibold text-slate-700">
                  Hiệp {currentSet} / {totalSets}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {currentExDetail.nameVi}
              </h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {currentExDetail.nameEn} · Nhóm cơ: {currentExDetail.muscleGroups.join(', ')}
              </div>

              {/* Substitution explanation badge if applied */}
              {currentSessionEx.wasSubstituted && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lý do chọn bài thay thế an toàn: </span>
                    {currentSessionEx.substitutionReason || 'Điều chỉnh để giảm áp lực va đập khớp theo quy tắc y tế.'}
                  </div>
                </div>
              )}
            </div>

            {/* Target Cues */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Mục tiêu hiệp này</span>
                <span className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5 block">
                  {currentSessionEx.repsOrDuration}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Thời gian nghỉ</span>
                <span className="text-lg font-extrabold text-slate-700 font-mono mt-0.5 block">
                  {currentSessionEx.restSeconds} giây
                </span>
              </div>
            </div>

            {/* Form Instructions & Breathing */}
            <div className="space-y-3 text-xs text-slate-700 bg-white border border-slate-100 p-4 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Cách thở chuẩn:</span>
                <p className="text-slate-600 leading-relaxed">{currentExDetail.breathingTechnique}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Điểm lưu ý tư thế (Cues):</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {currentExDetail.correctFormCues.map((cue, idx) => (
                    <li key={idx}>{cue}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-red-600 block mb-0.5">Lỗi thường gặp:</span>
                <p className="text-slate-500">{currentExDetail.commonMistakes.join(' · ')}</p>
              </div>
            </div>

            {/* Pain / Fatigue Reporting Section */}
            {painReported ? (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Bạn đã báo đau tại vùng: {painLocation}
                </div>
                <p className="leading-relaxed">
                  Nguyên tắc an toàn DISCI: Không tiếp tục bài tập đang gây đau. Bạn có muốn chuyển sang bài tập thay thế êm hơn hoặc kết thúc buổi tập sớm để nghỉ ngơi?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSkipExercise}
                    className="px-3 py-1.5 bg-white border border-red-300 text-red-700 font-semibold rounded-lg"
                  >
                    Đổi bài tập khác
                  </button>
                  <button
                    onClick={() => setIsCompleting(true)}
                    className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg"
                  >
                    Dừng tập hôm nay
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReportPain('Khớp gối')}
                    className="px-2.5 py-1 text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 rounded-lg"
                  >
                    Báo đau gối
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportPain('Lưng dưới')}
                    className="px-2.5 py-1 text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 rounded-lg"
                  >
                    Báo đau lưng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFatigueReported(true);
                      setRestSecondsLeft(s => s + 30);
                      setIsResting(true);
                    }}
                    className="px-2.5 py-1 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 border border-slate-200 rounded-lg"
                  >
                    Báo mệt (+30s nghỉ)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSkipExercise}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
                >
                  <span>Bỏ bài này</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Complete Set Button (Large CTA) */}
            <button
              onClick={handleCompleteSet}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Hoàn thành Hiệp {currentSet} ({currentSessionEx.repsOrDuration})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
