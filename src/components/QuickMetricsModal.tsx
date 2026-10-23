import React, { useState } from 'react';
import { X, Plus, Minus, Check, AlertTriangle, ArrowRight, HeartPulse, Scale, Activity } from 'lucide-react';
import { BodyMetricRecord, SafetyTier } from '../types';
import { calculateBMI, checkWeightJump, evaluateHealthSafety } from '../utils/rules';

interface QuickMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestRecord?: BodyMetricRecord;
  heightCm: number;
  onSave: (record: BodyMetricRecord) => void;
}

export const QuickMetricsModal: React.FC<QuickMetricsModalProps> = ({
  isOpen,
  onClose,
  latestRecord,
  heightCm,
  onSave
}) => {
  const [weight, setWeight] = useState<number>(latestRecord?.weightKg || 65.0);
  const [restingHr, setRestingHr] = useState<number>(latestRecord?.restingHeartRate || 72);
  const [systolicBp, setSystolicBp] = useState<number>(latestRecord?.systolicBp || 120);
  const [diastolicBp, setDiastolicBp] = useState<number>(latestRecord?.diastolicBp || 80);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showWeightJumpConfirm, setShowWeightJumpConfirm] = useState<boolean>(false);
  const [weightJumpMessage, setWeightJumpMessage] = useState<string>('');

  if (!isOpen) return null;

  // Real-time calculations
  const bmiInfo = calculateBMI(heightCm, weight);
  const weightJump = checkWeightJump(weight, latestRecord?.weightKg);

  // Status badges for fields
  const getBpStatus = (): { text: string; color: string } => {
    if (systolicBp >= 140 || diastolicBp >= 90 || systolicBp < 90 || diastolicBp < 60) {
      return { text: 'Cảnh báo cao', color: 'text-red-700 bg-red-50 border-red-200' };
    }
    if (systolicBp >= 130 || diastolicBp >= 85) {
      return { text: 'Cần theo dõi', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { text: 'Bình thường', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const getHrStatus = (): { text: string; color: string } => {
    if (restingHr > 100 || restingHr < 50) {
      return { text: 'Cảnh báo cao', color: 'text-red-700 bg-red-50 border-red-200' };
    }
    if (restingHr >= 90) {
      return { text: 'Cần theo dõi', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { text: 'Bình thường', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const bpStatus = getBpStatus();
  const hrStatus = getHrStatus();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra biến động cân nặng > 2kg
    if (weightJump.hasJump && !showWeightJumpConfirm) {
      setWeightJumpMessage(weightJump.message || 'Cân nặng thay đổi hơn 2 kg so với lần trước.');
      setShowWeightJumpConfirm(true);
      return;
    }

    setIsSubmitting(true);

    const safetyAssessment = evaluateHealthSafety({
      weightKg: weight,
      heightCm,
      systolicBp,
      diastolicBp,
      restingHeartRate: restingHr
    }, latestRecord ? { weightKg: latestRecord.weightKg } : undefined);

    const newRecord: BodyMetricRecord = {
      id: `bm_${Date.now()}`,
      date: new Date().toISOString(),
      weightKg: Math.round(weight * 10) / 10,
      restingHeartRate: restingHr,
      systolicBp,
      diastolicBp,
      bmi: bmiInfo.bmi,
      safetyTier: safetyAssessment.overallTier,
      source: 'manual',
      notes: notes.trim() || undefined,
      flaggedWeightJump: weightJump.hasJump
    };

    setTimeout(() => {
      onSave(newRecord);
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Nhập chỉ số nhanh
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật số đo trong dưới 1 phút để hiệu chỉnh lịch tập an toàn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weight Jump Confirmation Alert (if triggered) */}
        {showWeightJumpConfirm && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Xác nhận thay đổi cân nặng</div>
                <div className="mt-1 text-slate-700 leading-relaxed">
                  {weightJumpMessage}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWeightJumpConfirm(false);
                      // Tiếp tục submit
                      handleSubmit({ preventDefault: () => {} } as any);
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
                  >
                    Xác nhận đúng {weight} kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWeightJumpConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 font-semibold rounded-lg"
                  >
                    Nhập lại số đo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 1. Cân nặng với nút tăng giảm to */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                Cân nặng hiện tại
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${bmiInfo.tier === 'high_alert' ? 'bg-red-50 text-red-700 border-red-200' : bmiInfo.tier === 'caution' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                BMI {bmiInfo.bmi} · {bmiInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWeight(w => Math.max(Math.round((w - 0.5) * 10) / 10, 30))}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
                aria-label="Giảm 0.5 kg"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weight}
                  onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full h-12 text-center text-2xl font-bold font-mono rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50 focus:bg-white"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  kg
                </span>
              </div>

              <button
                type="button"
                onClick={() => setWeight(w => Math.round((w + 0.5) * 10) / 10)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
                aria-label="Tăng 0.5 kg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Nhịp tim nghỉ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Nhịp tim nghỉ (Resting HR)
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${hrStatus.color}`}>
                {hrStatus.text}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRestingHr(hr => Math.max(hr - 1, 40))}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
                aria-label="Giảm 1 nhịp tim"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  step="1"
                  min="40"
                  max="160"
                  value={restingHr}
                  onChange={e => setRestingHr(parseInt(e.target.value) || 0)}
                  className="w-full h-12 text-center text-2xl font-bold font-mono rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50 focus:bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  lần/phút
                </span>
              </div>

              <button
                type="button"
                onClick={() => setRestingHr(hr => hr + 1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
                aria-label="Tăng 1 nhịp tim"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3. Huyết áp theo cặp Tâm thu / Tâm trương */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Huyết áp (Tâm thu / Tâm trương)
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${bpStatus.color}`}>
                {bpStatus.text}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="70"
                  max="220"
                  value={systolicBp}
                  onChange={e => setSystolicBp(parseInt(e.target.value) || 0)}
                  className="w-full h-11 text-center font-bold font-mono rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50"
                  placeholder="Tâm thu"
                />
                <span className="text-[10px] text-slate-400 block text-center mt-1">
                  Tâm thu (mmHg)
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="40"
                  max="140"
                  value={diastolicBp}
                  onChange={e => setDiastolicBp(parseInt(e.target.value) || 0)}
                  className="w-full h-11 text-center font-bold font-mono rounded-xl border border-slate-200 focus:outline-emerald-500 bg-slate-50"
                  placeholder="Tâm trương"
                />
                <span className="text-[10px] text-slate-400 block text-center mt-1">
                  Tâm trương (mmHg)
                </span>
              </div>
            </div>
          </div>

          {/* 4. Ghi chú tùy chọn */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Ghi chú thêm (thể trạng, cảm giác buổi sáng)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ví dụ: Đo sau khi ngủ dậy, cảm thấy hơi mỏi vai..."
              className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 focus:outline-emerald-500"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Đang lưu số liệu...' : 'Lưu chỉ số & Hiệu chỉnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
