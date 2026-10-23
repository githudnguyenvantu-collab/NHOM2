import React, { useState } from 'react';
import { Search, Filter, Dumbbell, ShieldCheck, ArrowRightLeft, Sparkles, ChevronRight, Moon } from 'lucide-react';
import { ExerciseItem } from '../types';
import { EXERCISE_LIBRARY } from '../data/mockData';

interface ExerciseLibraryViewProps {
  onSelectExercise: (exercise: ExerciseItem) => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ onSelectExercise }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [onlyQuiet, setOnlyQuiet] = useState(false);
  const [onlyLowImpact, setOnlyLowImpact] = useState(false);

  const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = ex.nameVi.toLowerCase().includes(q) || ex.nameEn.toLowerCase().includes(q);
      const matchMuscle = ex.muscleGroups.some(m => m.toLowerCase().includes(q));
      if (!matchName && !matchMuscle) return false;
    }

    // Category
    if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
      return false;
    }

    // Difficulty
    if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) {
      return false;
    }

    // Quiet filter (Ký túc xá)
    if (onlyQuiet && !ex.isQuietFriendly) {
      return false;
    }

    // Low-impact filter
    if (onlyLowImpact && !ex.isLowImpact) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          Kho bài tập khoa học & an toàn
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Thư viện bài tập tại nhà
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Có hướng dẫn từng bước, cách thở chuẩn, lỗi thường gặp và bài thay thế an toàn
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài tập hoặc nhóm cơ (ngực, đùi, lưng, tay, cơ lõi)..."
            className="w-full h-11 pl-10 pr-4 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Category & Attribute Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'bodyweight', label: 'Trọng lượng cơ thể' },
              { id: 'band', label: 'Dây kháng lực' },
              { id: 'cardio_walk', label: 'Cardio & Đi bộ' },
              { id: 'recovery', label: 'Phục hồi & Cơ lõi' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyQuiet(!onlyQuiet)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                onlyQuiet
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Chỉ bài êm phòng trọ</span>
            </button>

            <button
              onClick={() => setOnlyLowImpact(!onlyLowImpact)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                onlyLowImpact
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ít va đập (Khớp an toàn)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            onClick={() => onSelectExercise(exercise)}
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-emerald-700 capitalize">
                  {exercise.category}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {exercise.difficulty === 'beginner' ? 'Cơ bản' : 'Trung bình'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors leading-snug">
                {exercise.nameVi}
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                {exercise.nameEn}
              </div>

              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-400">Cơ tác động: </span>
                  <span className="font-medium text-slate-800">{exercise.muscleGroups.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400">Dụng cụ: </span>
                  <span className="font-medium text-slate-700">
                    {exercise.equipmentRequired.includes('none') ? 'Không cần dụng cụ' : exercise.equipmentRequired.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {exercise.isQuietFriendly && (
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    Êm phòng trọ
                  </span>
                )}
                {exercise.isLowImpact && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Bảo vệ khớp
                  </span>
                )}
              </div>

              <span className="text-slate-400 group-hover:text-emerald-600 font-bold flex items-center gap-1">
                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
