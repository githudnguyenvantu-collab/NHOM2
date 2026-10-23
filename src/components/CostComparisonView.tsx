import React, { useState } from 'react';
import { calculateCostComparison } from '../utils/rules';
import { DollarSign, TrendingDown, PiggyBank, Calculator, CheckCircle2, Info } from 'lucide-react';

export const CostComparisonView: React.FC = () => {
  const [initialEquipmentCost, setInitialEquipmentCost] = useState<number>(353000); // Dây mini band (79k) + Thảm NBR (145k) + Dây power band (129k)
  const [monthlySupplementsCost, setMonthlySupplementsCost] = useState<number>(0);
  const [gymMonthlyFee, setGymMonthlyFee] = useState<number>(450000);
  const [ptMonthlyFee, setPtMonthlyFee] = useState<number>(0);
  const [commuteMonthlyFee, setCommuteMonthlyFee] = useState<number>(120000);
  const [months, setMonths] = useState<number>(6);

  const comparison = calculateCostComparison(
    initialEquipmentCost,
    monthlySupplementsCost,
    gymMonthlyFee,
    ptMonthlyFee,
    commuteMonthlyFee,
    months
  );

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          Phân tích tài chính cá nhân
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          So sánh chi phí: Tập tại nhà (DISCI) vs Phòng Gym
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tự do điều chỉnh thông số thực tế tại khu vực bạn sinh sống để có kết quả chính xác nhất
        </p>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Home Workout Total */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Tập tại nhà với DISCI ({months} tháng)
          </div>
          <div className="text-3xl font-black text-emerald-900 font-mono">
            {formatVnd(comparison.homeTotalCost)}
          </div>
          <div className="text-xs text-emerald-700 space-y-1 pt-2 border-t border-emerald-200/80">
            <div>• Chi phí mua dụng cụ ban đầu: <span className="font-semibold font-mono">{formatVnd(comparison.homeBreakdown.initial)}</span></div>
            <div>• Chi phí phát sinh định kỳ: <span className="font-semibold font-mono">{formatVnd(comparison.homeBreakdown.recurring)}</span></div>
            <div>• Phí phần mềm: <span className="font-bold">0 VNĐ (Miễn phí hoàn toàn)</span></div>
          </div>
        </div>

        {/* Traditional Gym Total */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Phòng Gym truyền thống ({months} tháng)
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {formatVnd(comparison.gymTotalCost)}
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
            <div>• Vé tập thẻ tháng: <span className="font-semibold font-mono">{formatVnd(comparison.gymBreakdown.membership)}</span></div>
            <div>• Thuê huấn luyện viên (PT): <span className="font-semibold font-mono">{formatVnd(comparison.gymBreakdown.pt)}</span></div>
            <div>• Xăng xe / di chuyển: <span className="font-semibold font-mono">{formatVnd(comparison.gymBreakdown.commute)}</span></div>
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/20 space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" />
              Khoản tiết kiệm dự kiến
            </div>
            <div className="text-3xl font-black font-mono mt-2">
              {formatVnd(comparison.savingsVnd)}
            </div>
            <div className="text-xs text-emerald-100 mt-1 font-semibold">
              Tiết kiệm {comparison.savingsPercent}% ngân sách thể thao
            </div>
          </div>

          <div className="text-[11px] text-emerald-50/90 pt-3 border-t border-emerald-400/40">
            Số tiền này đủ để bạn trang trải bữa ăn dinh dưỡng chất lượng cao hoặc các chi phí học tập thiết yếu khác.
          </div>
        </div>
      </div>

      {/* Input Adjuster Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          Tùy chỉnh thông số chi phí của bạn
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          {/* Mốc thời gian */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Khoảng thời gian so sánh
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 6, 12].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    months === m
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m} tháng
                </button>
              ))}
            </div>
          </div>

          {/* Dụng cụ ban đầu */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Chi phí mua dụng cụ tập ở nhà ban đầu
            </label>
            <input
              type="number"
              step="50000"
              value={initialEquipmentCost}
              onChange={e => setInitialEquipmentCost(parseInt(e.target.value) || 0)}
              className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200 bg-slate-50"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Dây kháng lực, thảm tập, xà đơn (dùng lâu dài 2–3 năm)
            </span>
          </div>

          {/* Vé phòng gym tháng */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Phí phòng gym địa phương (VNĐ / tháng)
            </label>
            <input
              type="number"
              step="50000"
              value={gymMonthlyFee}
              onChange={e => setGymMonthlyFee(parseInt(e.target.value) || 0)}
              className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200 bg-slate-50"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Mặt bằng phòng gym bình dân 350k - 600k/tháng
            </span>
          </div>

          {/* Chi phí di chuyển */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Chi phí xăng xe / gửi xe đi gym (VNĐ / tháng)
            </label>
            <input
              type="number"
              step="20000"
              value={commuteMonthlyFee}
              onChange={e => setCommuteMonthlyFee(parseInt(e.target.value) || 0)}
              className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200 bg-slate-50"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ước tính khoảng 100k - 200k/tháng
            </span>
          </div>

          {/* Phí PT nếu có */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Phí thuê Huấn luyện viên cá nhân PT (VNĐ / tháng)
            </label>
            <input
              type="number"
              step="100000"
              value={ptMonthlyFee}
              onChange={e => setPtMonthlyFee(parseInt(e.target.value) || 0)}
              className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200 bg-slate-50"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Để 0 VNĐ nếu bạn tự tập tại phòng gym
            </span>
          </div>
        </div>

        {/* Disclaimer requested by Section 26 */}
        <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700">Nguyên tắc khách quan: </span>
            DISCI không khẳng định chắc chắn rằng tập tại nhà luôn rẻ hơn phòng gym cho mọi trường hợp; kết quả phụ thuộc hoàn toàn vào nhu cầu dụng cụ và giá phòng tập thực tế tại địa phương bạn nhập.
          </div>
        </div>
      </div>
    </div>
  );
};
