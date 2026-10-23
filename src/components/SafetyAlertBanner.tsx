import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Stethoscope, HeartPulse, Info } from 'lucide-react';
import { HealthSafetyAssessment, HealthSafetyAlert } from '../types';

interface SafetyAlertBannerProps {
  safety: HealthSafetyAssessment;
  onOpenCheckupModal?: () => void;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ safety, onOpenCheckupModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (safety.overallTier === 'good_progress' && safety.alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-sm text-emerald-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-emerald-900">
              Trạng thái an toàn: Tiến bộ tốt
            </div>
            <div className="text-xs text-emerald-700 mt-0.5">
              Các chỉ số cơ thể nằm trong ngưỡng an toàn cho phép tăng khối lượng từ từ theo nguyên tắc khoa học.
            </div>
          </div>
        </div>
        {onOpenCheckupModal && (
          <button
            onClick={onOpenCheckupModal}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shrink-0"
          >
            Hồ sơ khám bệnh
          </button>
        )}
      </div>
    );
  }

  const isHighAlert = safety.overallTier === 'high_alert';

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm transition-all ${
        isHighAlert
          ? 'bg-red-50/90 border-red-200 text-red-950'
          : 'bg-amber-50/90 border-amber-200 text-amber-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isHighAlert ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
            }`}
          >
            {isHighAlert ? (
              <AlertOctagon className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm">
                {isHighAlert ? 'CẢNH BÁO CAO - CẦN THẬN TRỌNG TẬP LUYỆN' : 'MỨC LƯU Ý SỨC KHỎE'}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  isHighAlert ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {safety.alerts.length} chỉ số cần lưu ý
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed text-slate-700">
              {safety.summaryAdvice}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white shrink-0 self-start sm:self-auto ${
            isHighAlert
              ? 'border-red-300 text-red-700 hover:bg-red-50'
              : 'border-amber-300 text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span>{isExpanded ? 'Thu gọn chi tiết' : 'Xem quy tắc & bài thay thế'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Details: 8 items per alert requested in Section 12 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4">
          {safety.alerts.map(alert => (
            <div
              key={alert.id}
              className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  {alert.metric}: <span className="text-slate-800 font-semibold">{alert.value}</span>
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    alert.tier === 'high_alert'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {alert.tier === 'high_alert' ? 'Cảnh báo cao' : 'Mức lưu ý'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500 font-medium">Ngưỡng tham khảo: </span>
                  <span className="font-medium text-slate-800">{alert.threshold}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Lý do: </span>
                  <span className="font-medium text-slate-800">{alert.reason}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-800">Ảnh hưởng lịch tập: </span>
                  <span className="text-slate-700">{alert.workoutImpact}</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-700">Bài tập thay thế / điều chỉnh: </span>
                  <span className="text-slate-700">{alert.substituteGuidance}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-700">Khuyến nghị tiếp theo: </span>
                  <span className="text-slate-700">{alert.nextAction}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Emergency Notice */}
          <div className="text-[11px] text-slate-600 bg-white/70 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Lưu ý an toàn tuyệt đối: </span>
              DISCI là công cụ hỗ trợ lập lịch tập và theo dõi tiến độ, không phải công cụ chẩn đoán hoặc điều trị y tế.
              Nếu bạn cảm thấy tức ngực, chóng mặt dữ dội, khó thở bất thường, hãy ngừng tập ngay lập tức và tìm kiếm sự trợ giúp y tế khẩn cấp.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
