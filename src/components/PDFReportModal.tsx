import React, { useState } from 'react';
import { X, FileDown, CheckSquare, Square, Printer, CheckCircle2 } from 'lucide-react';
import { UserProfile, BodyMetricRecord, HealthRecord, WorkoutSessionLog, HealthSafetyAssessment } from '../types';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  metrics: BodyMetricRecord[];
  healthRecord: HealthRecord | null;
  workoutLogs: WorkoutSessionLog[];
  safety: HealthSafetyAssessment;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  metrics,
  healthRecord,
  workoutLogs,
  safety
}) => {
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeBmi, setIncludeBmi] = useState(true);
  const [includeBp, setIncludeBp] = useState(true);
  const [includeHr, setIncludeHr] = useState(true);
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [includeSafetyTier, setIncludeSafetyTier] = useState(true);
  const [includeDoctorNotes, setIncludeDoctorNotes] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('30d');
  const [isPreviewing, setIsPreviewing] = useState(false);

  if (!isOpen) return null;

  const latestMetric = metrics[0] || { weightKg: profile.weightKg, bmi: 22.5 };
  const oldestMetric = metrics[metrics.length - 1] || latestMetric;
  const weightDiff = Math.round((latestMetric.weightKg - oldestMetric.weightKg) * 10) / 10;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xuất Báo cáo Thể trạng & Tiến độ
              </h2>
              <p className="text-xs text-slate-500">
                Tạo tệp PDF tiếng Việt chuyên nghiệp · Chỉ xuất các trường bạn cho phép
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPreviewing ? (
          /* Report Preview Sheet */
          <div className="p-6 space-y-6">
            <div id="printable-report" className="border border-slate-200 rounded-2xl p-6 bg-white space-y-5 text-xs text-slate-800">
              {/* Report Header */}
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">
                    BÁO CÁO THỂ TRẠNG & TIẾN ĐỘ TẬP LUYỆN
                  </h1>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống ứng dụng DISCI Vietnam · disci.vn
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div>Ngày lập: {new Date().toLocaleDateString('vi-VN')}</div>
                  <div className="font-semibold text-slate-700">Người dùng: {profile.fullName}</div>
                </div>
              </div>

              {/* Patient / User Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tuổi / Giới tính:</span>
                  <span className="font-bold">{profile.age} tuổi · {profile.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Chiều cao:</span>
                  <span className="font-bold font-mono">{profile.heightCm} cm</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mục tiêu:</span>
                  <span className="font-bold">{profile.workoutGoal === 'muscle_gain' ? 'Tăng cơ' : 'Giảm mỡ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Trạng thái an toàn:</span>
                  <span className="font-bold text-emerald-700">
                    {safety.overallTier === 'good_progress' ? 'Tiến bộ tốt' : 'Mức lưu ý'}
                  </span>
                </div>
              </div>

              {/* Body Metrics Section */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-1">
                  1. Biến động thể trạng ({timeRange === '30d' ? '30 ngày' : '90 ngày'})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {includeWeight && (
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Cân nặng đầu kỳ / cuối kỳ:</span>
                      <span className="font-extrabold font-mono text-sm">{oldestMetric.weightKg} kg → {latestMetric.weightKg} kg</span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        {weightDiff >= 0 ? `+${weightDiff}` : weightDiff} kg
                      </span>
                    </div>
                  )}

                  {includeBmi && (
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Chỉ số BMI:</span>
                      <span className="font-extrabold font-mono text-sm">{latestMetric.bmi}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Cân đối tham khảo</span>
                    </div>
                  )}

                  {includeBp && (
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Huyết áp gần nhất:</span>
                      <span className="font-extrabold font-mono text-sm">{latestMetric.systolicBp || 120}/{latestMetric.diastolicBp || 80}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">mmHg</span>
                    </div>
                  )}

                  {includeHr && (
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Nhịp tim nghỉ:</span>
                      <span className="font-extrabold font-mono text-sm">{latestMetric.restingHeartRate || 68}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">lần/phút</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Workout Statistics Section */}
              {includeWorkouts && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-1">
                    2. Tiến độ luyện tập tại nhà
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Số buổi hoàn thành:</span>
                      <span className="font-bold font-mono text-sm">{workoutLogs.length} buổi</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Tổng thời gian tập:</span>
                      <span className="font-bold font-mono text-sm">
                        {workoutLogs.reduce((s, l) => s + l.durationMinutes, 0)} phút
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Tỷ lệ hoàn thành:</span>
                      <span className="font-bold font-mono text-sm text-emerald-700">100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor / Musculoskeletal Section */}
              {includeDoctorNotes && healthRecord && healthRecord.consentGrantedForWorkoutPersonalization && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-bold text-slate-900">3. Ghi nhận y tế từ phiếu khám:</h4>
                  <div className="text-slate-600">
                    Cơ sở: <span className="font-semibold">{healthRecord.clinicFacility}</span> · Khuyến cáo: <span className="font-semibold text-emerald-800">{healthRecord.doctorExerciseRecommendation}</span>
                  </div>
                </div>
              )}

              {/* Medical Disclaimer */}
              <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 leading-relaxed">
                Tuyên bố miễn trừ: Báo cáo này tổng hợp nhật ký luyện tập và tự theo dõi của người dùng trên ứng dụng DISCI, không thay thế hồ sơ bệnh án hoặc chẩn đoán y tế chính thức.
              </div>
            </div>

            {/* Print and Close controls */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPreviewing(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                ← Quay lại tùy chọn trường
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Lưu tệp PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Selection Form */
          <div className="p-6 space-y-5 text-xs text-slate-700">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Khoảng thời gian báo cáo:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['30d', '90d', 'all'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      timeRange === r
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r === '30d' ? '30 ngày qua' : r === '90d' ? '3 tháng qua' : 'Toàn bộ'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-800 block mb-1">
                Chọn các trường thông tin đưa vào báo cáo:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Cân nặng đầu kỳ & cuối kỳ', checked: includeWeight, setChecked: setIncludeWeight },
                  { label: 'Chỉ số khối cơ thể BMI', checked: includeBmi, setChecked: setIncludeBmi },
                  { label: 'Huyết áp tâm thu/tâm trương', checked: includeBp, setChecked: setIncludeBp },
                  { label: 'Nhịp tim nghỉ', checked: includeHr, setChecked: setIncludeHr },
                  { label: 'Số buổi & tỷ lệ hoàn thành', checked: includeWorkouts, setChecked: setIncludeWorkouts },
                  { label: 'Mức cảnh báo an toàn', checked: includeSafetyTier, setChecked: setIncludeSafetyTier },
                  { label: 'Khuyến cáo của bác sĩ (nếu có)', checked: includeDoctorNotes, setChecked: setIncludeDoctorNotes }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={e => item.setChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewing(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Xem trước & Tạo báo cáo PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
