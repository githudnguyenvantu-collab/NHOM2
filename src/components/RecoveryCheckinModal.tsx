import React, { useState } from 'react';
import { X, Moon, Zap, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { DailyRecoveryCheckin } from '../types';

interface RecoveryCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckin: (checkin: DailyRecoveryCheckin) => void;
}

export const RecoveryCheckinModal: React.FC<RecoveryCheckinModalProps> = ({
  isOpen,
  onClose,
  onSaveCheckin
}) => {
  const [sleep, setSleep] = useState<'du' | 'it'>('du');
  const [soreness, setSoreness] = useState<'khong' | 'nhe' | 'nhieu'>('khong');
  const [fatigue, setFatigue] = useState<'on' | 'met'>('on');
  const [result, setResult] = useState<DailyRecoveryCheckin | null>(null);

  if (!isOpen) return null;

  const handleCalculateResult = () => {
    let systemAdjustmentResult: 'keep_schedule' | 'reduce_intensity' | 'light_recovery' | 'mandatory_rest' = 'keep_schedule';
    let explanation = 'Phục hồi tốt, sẵn sàng cho buổi tập hôm nay theo đúng kế hoạch!';

    if (soreness === 'nhieu') {
      systemAdjustmentResult = 'mandatory_rest';
      explanation = 'Bạn báo ĐAU NHIỀU. Lịch hôm nay được chuyển sang NGHỈ NGƠI HOÀN TOÀN để tránh chấn thương cấp tính. Hãy chườm mát và theo dõi.';
    } else if (fatigue === 'met' && sleep === 'it') {
      systemAdjustmentResult = 'light_recovery';
      explanation = 'Cơ thể thiếu ngủ và mệt mỏi. Đã tự động thay buổi tập nặng hôm nay thành buổi GIÃN CƠ & ĐI BỘ PHỤC HỒI NHẸ 15 phút.';
    } else if (soreness === 'nhe' || fatigue === 'met' || sleep === 'it') {
      systemAdjustmentResult = 'reduce_intensity';
      explanation = 'Mức phục hồi trung bình. Hệ thống giảm 20% số hiệp và tăng thời gian nghỉ giữa các hiệp thêm 30 giây.';
    }

    const checkinRecord: DailyRecoveryCheckin = {
      id: `chk_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sleepQuality: sleep,
      muscleSoreness: soreness,
      fatigueLevel: fatigue,
      systemAdjustmentResult,
      adjustmentExplanation: explanation,
      completedAt: new Date().toISOString()
    };

    setResult(checkinRecord);
    onSaveCheckin(checkinRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Moon className="w-5 h-5 text-teal-600" />
              Check-in Phục hồi 10 Giây
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá nhanh trạng thái buổi sáng để tinh chỉnh buổi tập hôm nay
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          /* Result feedback */
          <div className="p-5 space-y-4">
            <div
              className={`p-4 rounded-xl border text-sm ${
                result.systemAdjustmentResult === 'mandatory_rest'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : result.systemAdjustmentResult === 'light_recovery'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : result.systemAdjustmentResult === 'reduce_intensity'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-base mb-1">
                {result.systemAdjustmentResult === 'mandatory_rest' ? (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                {result.systemAdjustmentResult === 'keep_schedule' && 'Giữ nguyên lịch tập'}
                {result.systemAdjustmentResult === 'reduce_intensity' && 'Tự động giảm 20% cường độ'}
                {result.systemAdjustmentResult === 'light_recovery' && 'Chuyển sang phục hồi nhẹ'}
                {result.systemAdjustmentResult === 'mandatory_rest' && 'Nghỉ ngơi hoàn toàn hôm nay'}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {result.adjustmentExplanation}
              </p>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              Check-in phục hồi chỉ mang tính tham khảo điều chỉnh tải trọng, không thay thế chẩn đoán y tế. Nếu đau nhức dai dẳng, vui lòng tham khảo bác sĩ hoặc chuyên gia vật lý trị liệu.
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              Đã hiểu & Áp dụng vào lịch tập
            </button>
          </div>
        ) : (
          /* Input questions */
          <div className="p-5 space-y-5">
            {/* 1. Giấc ngủ */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                1. Giấc ngủ đêm qua của bạn:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSleep('du')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    sleep === 'du'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Đủ giấc (&gt;= 7 tiếng)
                </button>
                <button
                  type="button"
                  onClick={() => setSleep('it')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    sleep === 'it'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ít ngủ (&lt; 6 tiếng, chập chờn)
                </button>
              </div>
            </div>

            {/* 2. Đau nhức cơ bắp */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                2. Cảm giác đau nhức cơ khớp:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSoreness('khong')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    soreness === 'khong'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Không đau
                </button>
                <button
                  type="button"
                  onClick={() => setSoreness('nhe')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    soreness === 'nhe'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Đau nhẹ (mỏi cơ)
                </button>
                <button
                  type="button"
                  onClick={() => setSoreness('nhieu')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    soreness === 'nhieu'
                      ? 'bg-red-50 border-red-500 text-red-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Đau nhiều / nhức khớp
                </button>
              </div>
            </div>

            {/* 3. Mức độ mệt mỏi */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                3. Tinh thần & mức độ mệt mỏi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFatigue('on')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    fatigue === 'on'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tỉnh táo, ổn định
                </button>
                <button
                  type="button"
                  onClick={() => setFatigue('met')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    fatigue === 'met'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Uể oải, mệt mỏi
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateResult}
              className="w-full py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
            >
              Lưu Check-in & Nhận phản hồi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
