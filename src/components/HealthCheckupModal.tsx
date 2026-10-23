import React, { useState } from 'react';
import { X, Stethoscope, ShieldCheck, Trash2, FileText, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HealthRecord } from '../types';

interface HealthCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HealthRecord | null;
  onSave: (record: HealthRecord | null) => void;
}

export const HealthCheckupModal: React.FC<HealthCheckupModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave
}) => {
  const [clinicFacility, setClinicFacility] = useState(record?.clinicFacility || 'Bệnh viện Bạch Mai (Khám định kỳ)');
  const [checkupDate, setCheckupDate] = useState(record?.checkupDate || '2026-10-01');
  const [systolicBp, setSystolicBp] = useState<number>(record?.systolicBp || 120);
  const [diastolicBp, setDiastolicBp] = useState<number>(record?.diastolicBp || 80);
  const [restingHr, setRestingHr] = useState<number>(record?.restingHeartRate || 68);
  const [glucose, setGlucose] = useState<number>(record?.fastingBloodGlucoseMgDl || 92);
  const [cholesterol, setCholesterol] = useState<number>(record?.totalCholesterolMgDl || 175);
  const [ldl, setLdl] = useState<number>(record?.ldlCholesterolMgDl || 110);
  const [triglycerides, setTriglycerides] = useState<number>(record?.triglyceridesMgDl || 120);
  const [musculoskeletalNotes, setMusculoskeletalNotes] = useState(record?.musculoskeletalNotes || 'Khớp gối trái hơi lạo xạo nhẹ khi gập sâu.');
  const [doctorRecommendation, setDoctorRecommendation] = useState(record?.doctorExerciseRecommendation || 'Hạn chế các bài nhảy tiếp đất mạnh dồn lực lên khớp gối.');
  const [doctorHaltExercise, setDoctorHaltExercise] = useState<boolean>(record?.doctorHaltExercise || false);
  const [notes, setNotes] = useState(record?.notes || '');
  const [fileName, setFileName] = useState(record?.fileAttachmentName || 'Phieu_kham_dinh_ky_2026.pdf');
  const [consentGranted, setConsentGranted] = useState<boolean>(record?.consentGrantedForWorkoutPersonalization ?? true);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRecord: HealthRecord = {
      id: record?.id || `hr_${Date.now()}`,
      checkupDate,
      clinicFacility,
      systolicBp,
      diastolicBp,
      restingHeartRate: restingHr,
      fastingBloodGlucoseMgDl: glucose || undefined,
      totalCholesterolMgDl: cholesterol || undefined,
      ldlCholesterolMgDl: ldl || undefined,
      triglyceridesMgDl: triglycerides || undefined,
      musculoskeletalNotes: musculoskeletalNotes.trim() || undefined,
      doctorExerciseRecommendation: doctorRecommendation.trim() || undefined,
      doctorHaltExercise,
      notes: notes.trim() || undefined,
      fileAttachmentName: fileName || undefined,
      consentGrantedForWorkoutPersonalization: consentGranted,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedRecord);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ khám sức khỏe này khỏi thiết bị?')) {
      onSave(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hồ sơ kết quả khám sức khỏe
              </h2>
              <p className="text-xs text-slate-500">
                Không bắt buộc · Dữ liệu được bảo mật riêng tư cục bộ
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

        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs text-slate-700">
          {/* Explicit Consent Notice (Mục 11 bắt buộc) */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-teal-950 block text-sm">
                  Quyền riêng tư & Đồng ý sử dụng dữ liệu y tế
                </span>
                <p className="text-teal-900 leading-relaxed mt-0.5">
                  DISCI chỉ sử dụng các khuyến cáo từ phiếu khám này để tự động lọc bỏ các bài tập có hại cho bạn (ví dụ: thay bài squat khi đau gối). Dữ liệu của bạn được lưu riêng tư trên thiết bị và không bao giờ chia sẻ cho bên thứ ba.
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGranted}
                    onChange={e => setConsentGranted(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-bold text-teal-950">
                    Tôi đồng ý cho phép DISCI sử dụng dữ liệu khám để cá nhân hóa lịch tập an toàn
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Ngày khám & Cơ sở y tế */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cơ sở khám bệnh</label>
              <input
                type="text"
                value={clinicFacility}
                onChange={e => setClinicFacility(e.target.value)}
                placeholder="Ví dụ: Bệnh viện ĐHYD, Phòng khám đa khoa..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-emerald-500"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ngày khám</label>
              <input
                type="date"
                value={checkupDate}
                onChange={e => setCheckupDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Huyết áp & Nhịp tim tại phòng khám */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Huyết áp tâm thu</label>
              <input
                type="number"
                value={systolicBp}
                onChange={e => setSystolicBp(parseInt(e.target.value) || 0)}
                className="w-full h-10 text-center font-bold font-mono rounded-xl border border-slate-200"
              />
              <span className="text-[10px] text-slate-400 block text-center mt-0.5">mmHg</span>
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Huyết áp tâm trương</label>
              <input
                type="number"
                value={diastolicBp}
                onChange={e => setDiastolicBp(parseInt(e.target.value) || 0)}
                className="w-full h-10 text-center font-bold font-mono rounded-xl border border-slate-200"
              />
              <span className="text-[10px] text-slate-400 block text-center mt-0.5">mmHg</span>
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Nhịp tim nghỉ</label>
              <input
                type="number"
                value={restingHr}
                onChange={e => setRestingHr(parseInt(e.target.value) || 0)}
                className="w-full h-10 text-center font-bold font-mono rounded-xl border border-slate-200"
              />
              <span className="text-[10px] text-slate-400 block text-center mt-0.5">lần/phút</span>
            </div>
          </div>

          {/* Đường huyết & Bộ mỡ máu */}
          <div className="space-y-1">
            <span className="font-bold text-slate-800 block">Xét nghiệm sinh hóa máu (tùy chọn):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Đường huyết đói</label>
                <input
                  type="number"
                  value={glucose}
                  onChange={e => setGlucose(parseInt(e.target.value) || 0)}
                  className="w-full h-9 text-center font-mono rounded-lg border border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block text-center">mg/dL (&lt;100)</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Cholesterol</label>
                <input
                  type="number"
                  value={cholesterol}
                  onChange={e => setCholesterol(parseInt(e.target.value) || 0)}
                  className="w-full h-9 text-center font-mono rounded-lg border border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block text-center">mg/dL (&lt;200)</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">LDL (Xấu)</label>
                <input
                  type="number"
                  value={ldl}
                  onChange={e => setLdl(parseInt(e.target.value) || 0)}
                  className="w-full h-9 text-center font-mono rounded-lg border border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block text-center">mg/dL (&lt;130)</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Triglycerides</label>
                <input
                  type="number"
                  value={triglycerides}
                  onChange={e => setTriglycerides(parseInt(e.target.value) || 0)}
                  className="w-full h-9 text-center font-mono rounded-lg border border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block text-center">mg/dL (&lt;150)</span>
              </div>
            </div>
          </div>

          {/* Khuyến cáo bác sĩ & Xương khớp */}
          <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Tình trạng xương khớp được bác sĩ ghi nhận:
              </label>
              <input
                type="text"
                value={musculoskeletalNotes}
                onChange={e => setMusculoskeletalNotes(e.target.value)}
                placeholder="Ví dụ: Lưu ý khớp gối trái, thoái hóa nhẹ đốt sống L4-L5..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Khuyến cáo vận động của bác sĩ:
              </label>
              <input
                type="text"
                value={doctorRecommendation}
                onChange={e => setDoctorRecommendation(e.target.value)}
                placeholder="Ví dụ: Chỉ tập nhẹ, không chạy nhảy hay gánh tạ nặng..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            {/* Bác sĩ yêu cầu tạm ngừng tập */}
            <label className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={doctorHaltExercise}
                onChange={e => setDoctorHaltExercise(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-bold text-red-900">
                Bác sĩ chỉ định: TẠM NGỪNG TẬP LUYỆN (Thuật toán sẽ tự động dừng tạo lịch tập nặng)
              </span>
            </label>
          </div>

          {/* Tệp đính kèm phiếu khám */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">Tệp phiếu khám đính kèm:</label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-mono text-slate-800 truncate flex-1">{fileName}</span>
              <label className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer">
                Thay tệp
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              Hỗ trợ tệp ảnh và PDF. Không tự động diễn giải bằng AI nếu chưa có xác thực người dùng.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {record ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa kết quả khám</span>
              </button>
            ) : <div></div>}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Lưu hồ sơ khám
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
