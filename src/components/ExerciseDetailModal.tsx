import React from 'react';
import { X, Dumbbell, ShieldCheck, AlertCircle, ArrowRightLeft, Sparkles, Wind } from 'lucide-react';
import { ExerciseItem } from '../types';
import { EXERCISE_LIBRARY } from '../data/mockData';

interface ExerciseDetailModalProps {
  exercise: ExerciseItem | null;
  onClose: () => void;
  onSelectSubstitute?: (exercise: ExerciseItem) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  onSelectSubstitute
}) => {
  if (!exercise) return null;

  const substituteExercise = exercise.substituteExerciseId
    ? EXERCISE_LIBRARY.find(e => e.id === exercise.substituteExerciseId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-emerald-700 capitalize">{exercise.category}</span>
              <span>·</span>
              <span>Độ khó: {exercise.difficulty === 'beginner' ? 'Cơ bản' : exercise.difficulty === 'intermediate' ? 'Trung bình' : 'Nâng cao'}</span>
              {exercise.isQuietFriendly && (
                <>
                  <span>·</span>
                  <span className="text-teal-700 font-medium">Êm phòng trọ</span>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{exercise.nameVi}</h2>
            <div className="text-xs text-slate-400 font-mono">{exercise.nameEn}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs text-slate-700">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Số hiệp gợi ý</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5 block">
                {exercise.defaultSets} hiệp
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Số lần / thời gian</span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 block">
                {exercise.defaultRepsOrDuration}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Thời gian nghỉ</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5 block">
                {exercise.restSeconds}s
              </span>
            </div>
          </div>

          {/* Nhóm cơ & Thiết bị */}
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block">Nhóm cơ tác động chính:</span>
            <div className="text-slate-600">
              {exercise.muscleGroups.join(', ')}
            </div>
            <span className="font-bold text-slate-900 block pt-1">Dụng cụ cần thiết:</span>
            <div className="text-slate-600">
              {exercise.equipmentRequired.includes('none')
                ? 'Không cần dụng cụ (Trọng lượng cơ thể)'
                : exercise.equipmentRequired.join(', ')}
            </div>
          </div>

          {/* Hướng dẫn từng bước */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 block text-sm">Hướng dẫn từng bước chuẩn:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
              {exercise.stepByStepInstructions.map((step, idx) => (
                <li key={idx} className="pl-1">{step}</li>
              ))}
            </ol>
          </div>

          {/* Tư thế đúng & Cách thở */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950 block">Điểm mấu chốt tư thế (Cues):</span>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-900 mt-1">
                  {exercise.correctFormCues.map((cue, i) => (
                    <li key={i}>{cue}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-emerald-100">
              <Wind className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-teal-950 block">Cách thở chuẩn:</span>
                <span className="text-teal-900">{exercise.breathingTechnique}</span>
              </div>
            </div>
          </div>

          {/* Lỗi thường gặp & Lưu ý an toàn */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Lỗi thường gặp:</span>
                <span className="text-slate-600">{exercise.commonMistakes.join(' · ')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Lưu ý an toàn:</span>
                <span className="text-slate-600">{exercise.safetyNotes}</span>
              </div>
            </div>
          </div>

          {/* Bài tập thay thế tương ứng */}
          {substituteExercise && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                  Bài tập thay thế an toàn hơn:
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  Ít va đập
                </span>
              </div>
              <div className="text-slate-800 font-semibold">{substituteExercise.nameVi}</div>
              <p className="text-slate-500 text-[11px]">{exercise.substituteReason}</p>
              {onSelectSubstitute && (
                <button
                  type="button"
                  onClick={() => onSelectSubstitute(substituteExercise)}
                  className="w-full mt-1 py-2 text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50"
                >
                  Xem bài thay thế này
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
