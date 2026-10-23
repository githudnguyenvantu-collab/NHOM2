import React, { useState } from 'react';
import { UserProfile, MealItem } from '../types';
import { calculateNutritionTargets, calculateTDEE } from '../utils/rules';
import { SAMPLE_VIETNAMESE_MEALS } from '../data/mockData';
import { Utensils, Flame, Sparkles, DollarSign, Check, Info } from 'lucide-react';

interface NutritionViewProps {
  profile: UserProfile;
}

export const NutritionView: React.FC<NutritionViewProps> = ({ profile }) => {
  const tdeeInfo = calculateTDEE(
    profile.weightKg,
    profile.heightCm,
    profile.age,
    profile.gender,
    profile.activityLevel
  );

  const targets = calculateNutritionTargets(tdeeInfo.tdee, profile.weightKg, profile.workoutGoal);

  // Selected meals state
  const [selectedBreakfast, setSelectedBreakfast] = useState<MealItem>(SAMPLE_VIETNAMESE_MEALS[0].items[0]);
  const [selectedLunch, setSelectedLunch] = useState<MealItem>(SAMPLE_VIETNAMESE_MEALS[1].items[0]);
  const [selectedDinner, setSelectedDinner] = useState<MealItem>(SAMPLE_VIETNAMESE_MEALS[2].items[0]);
  const [selectedSnack, setSelectedSnack] = useState<MealItem>(SAMPLE_VIETNAMESE_MEALS[3].items[0]);

  const totalCalories = selectedBreakfast.caloriesKcal + selectedLunch.caloriesKcal + selectedDinner.caloriesKcal + selectedSnack.caloriesKcal;
  const totalProtein = selectedBreakfast.proteinGrams + selectedLunch.proteinGrams + selectedDinner.proteinGrams + selectedSnack.proteinGrams;
  const totalCostVnd = selectedBreakfast.costVnd + selectedLunch.costVnd + selectedDinner.costVnd + selectedSnack.costVnd;

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Post-MVP label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Dinh dưỡng thực chiến tiết kiệm
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
              Phân hệ mở rộng sau MVP
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Gợi ý thực đơn món Việt theo TDEE
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dựa trên các món ăn quen thuộc, giàu đạm và chi phí hợp lý cho sinh viên & nhân viên văn phòng
          </p>
        </div>
      </div>

      {/* Target Macros Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Mục tiêu Calo hằng ngày</span>
          <div className="text-3xl font-extrabold text-orange-600 font-mono">
            {targets.calorieTarget} <span className="text-sm font-semibold text-slate-500">kcal</span>
          </div>
          <p className="text-xs text-slate-500">
            {targets.explanation}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Mục tiêu lượng đạm (Protein)</span>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">
            {targets.proteinGramsTarget} <span className="text-sm font-semibold text-slate-500">g / ngày</span>
          </div>
          <p className="text-xs text-slate-500">
            Chiếm ~1.2 - 1.6 g/kg cân nặng ({profile.weightKg} kg) để phục hồi và phát triển cơ.
          </p>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Ước tính chi phí thực đơn</span>
          <div className="text-3xl font-extrabold text-emerald-950 font-mono">
            {formatVnd(totalCostVnd)}
          </div>
          <p className="text-xs text-emerald-800">
            Tổng cộng: {totalCalories} kcal · {totalProtein}g đạm cho cả 4 bữa ăn trong ngày.
          </p>
        </div>
      </div>

      {/* Meals Selection */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-600" />
          Tùy chọn món ăn trong ngày (Bấm để đổi món)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bữa sáng */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Bữa sáng</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{formatVnd(selectedBreakfast.costVnd)}</span>
            </div>
            <div className="space-y-1.5">
              {SAMPLE_VIETNAMESE_MEALS[0].items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedBreakfast(item)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    selectedBreakfast.name === item.name
                      ? 'bg-emerald-50 border-emerald-400 font-semibold'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-slate-900 font-bold">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.portion} · {item.notes}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-800">{item.caloriesKcal} kcal</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{item.proteinGrams}g đạm</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bữa trưa */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Bữa trưa (Bữa chính)</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{formatVnd(selectedLunch.costVnd)}</span>
            </div>
            <div className="space-y-1.5">
              {SAMPLE_VIETNAMESE_MEALS[1].items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedLunch(item)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    selectedLunch.name === item.name
                      ? 'bg-emerald-50 border-emerald-400 font-semibold'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-slate-900 font-bold">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.portion} · {item.notes}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-800">{item.caloriesKcal} kcal</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{item.proteinGrams}g đạm</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bữa tối */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Bữa tối (Dễ tiêu hóa)</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{formatVnd(selectedDinner.costVnd)}</span>
            </div>
            <div className="space-y-1.5">
              {SAMPLE_VIETNAMESE_MEALS[2].items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDinner(item)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    selectedDinner.name === item.name
                      ? 'bg-emerald-50 border-emerald-400 font-semibold'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-slate-900 font-bold">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.portion} · {item.notes}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-800">{item.caloriesKcal} kcal</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{item.proteinGrams}g đạm</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bữa phụ */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-sm text-slate-900">Bữa phụ trước/sau tập</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{formatVnd(selectedSnack.costVnd)}</span>
            </div>
            <div className="space-y-1.5">
              {SAMPLE_VIETNAMESE_MEALS[3].items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSnack(item)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    selectedSnack.name === item.name
                      ? 'bg-emerald-50 border-emerald-400 font-semibold'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-slate-900 font-bold">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.portion} · {item.notes}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-800">{item.caloriesKcal} kcal</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{item.proteinGrams}g đạm</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer for Nutrition */}
      <div className="text-[11px] text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700">Lưu ý dinh dưỡng: </span>
          Các giá trị TDEE và thực đơn trên chỉ mang tính ước tính tham khảo, không phải đơn thuốc hay chỉ định điều trị y khoa. Người có bệnh lý nền về thận, gan hoặc đái tháo đường cần tham khảo ý kiến bác sĩ chuyên khoa dinh dưỡng.
        </div>
      </div>
    </div>
  );
};
