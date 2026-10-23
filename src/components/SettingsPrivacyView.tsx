import React, { useState } from 'react';
import { UserProfile, HealthRecord } from '../types';
import { StorageService } from '../services/storage';
import { Shield, ShieldAlert, Download, Trash2, Bell, FileText, Info, Lock, CheckCircle2, User, RefreshCw } from 'lucide-react';

interface SettingsPrivacyViewProps {
  profile: UserProfile;
  healthRecord: HealthRecord | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onRefreshData: () => void;
  onOpenCheckupModal: () => void;
}

export const SettingsPrivacyView: React.FC<SettingsPrivacyViewProps> = ({
  profile,
  healthRecord,
  onUpdateProfile,
  onRefreshData,
  onOpenCheckupModal
}) => {
  const [allowHealthDataConsent, setAllowHealthDataConsent] = useState(
    healthRecord?.consentGrantedForWorkoutPersonalization ?? true
  );
  const [allowCommunityShare, setAllowCommunityShare] = useState(true);
  const [notifyWorkouts, setNotifyWorkouts] = useState(true);
  const [notifyCheckin, setNotifyCheckin] = useState(true);
  const [notifyTime, setNotifyTime] = useState('07:00');
  const [message, setMessage] = useState<string | null>(null);

  const handleToggleHealthConsent = (checked: boolean) => {
    setAllowHealthDataConsent(checked);
    if (healthRecord) {
      const updated = {
        ...healthRecord,
        consentGrantedForWorkoutPersonalization: checked
      };
      StorageService.saveHealthRecord(updated);
      onRefreshData();
      setMessage(checked 
        ? 'Đã bật cấp quyền sử dụng dữ liệu khám để cá nhân hóa bài tập an toàn.'
        : 'Đã thu hồi quyền. Thuật toán sẽ không dùng dữ liệu khám để điều chỉnh bài tập nữa.'
      );
    }
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportAllUserData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DISCI_UserData_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Đã xuất toàn bộ dữ liệu ứng dụng của bạn ra tệp JSON thành công.');
  };

  const handleDeleteHealthRecords = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ kết quả khám bệnh đã lưu trên thiết bị?')) {
      StorageService.clearHealthRecordsOnly();
      onRefreshData();
      setMessage('Đã xóa dữ liệu khám sức khỏe khỏi thiết bị.');
    }
  };

  const handleResetAllData = () => {
    if (confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ hồ sơ, lịch tập, chỉ số và đơn hàng trên thiết bị và đưa ứng dụng về trạng thái ban đầu. Bạn có chắc chắn không?')) {
      StorageService.resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          Trung tâm quyền riêng tư & Cài đặt hệ thống
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Cài đặt & Quyền riêng tư dữ liệu
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dữ liệu sức khỏe là thông tin nhạy cảm. Bạn toàn quyền kiểm soát, tải về hoặc xóa bỏ bất cứ lúc nào.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Privacy & Consent */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Consent Manager */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Quản lý sự đồng ý sử dụng dữ liệu (Consent Management)
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">
                    Sử dụng kết quả khám để cá nhân hóa lịch tập
                  </span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Cho phép thuật toán đọc các khuyến cáo của bác sĩ (ví dụ: đau gối, lưng dưới) để tự động lọc bài tập có nguy cơ chấn thương.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowHealthDataConsent}
                  onChange={e => handleToggleHealthConsent(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 cursor-pointer mt-1"
                />
              </div>

              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">
                    Quyền chia sẻ hoạt động với cộng đồng
                  </span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Cho phép hiển thị bài đăng và cổ vũ trên bảng tin. Cân nặng của bạn luôn được ẩn mặc định theo chính sách bảo mật.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowCommunityShare}
                  onChange={e => setAllowCommunityShare(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>

          {/* 2. Notifications & Reminders (Section 33) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              Cấu hình nhắc nhở & Thông báo
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Nhắc lịch tập hằng ngày</span>
                  <span className="text-slate-400">Thông báo trước giờ tập dự kiến</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWorkouts}
                  onChange={e => setNotifyWorkouts(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Nhắc Check-in phục hồi buổi sáng</span>
                  <span className="text-slate-400">Đánh giá nhanh trạng thái ngủ & đau cơ trong 10 giây</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCheckin}
                  onChange={e => setNotifyCheckin(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-800">Khung giờ nhắc buổi sáng:</span>
                <input
                  type="time"
                  value={notifyTime}
                  onChange={e => setNotifyTime(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. Official Disclaimer (Section 37) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 space-y-2 text-xs text-amber-950">
            <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
              <Info className="w-4 h-4" />
              Tuyên bố miễn trừ trách nhiệm y tế chính thức (DISCI Medical Disclaimer)
            </div>
            <p className="leading-relaxed text-slate-700">
              "DISCI là ứng dụng hỗ trợ lập kế hoạch luyện tập và theo dõi tiến độ, không phải công cụ chẩn đoán hoặc điều trị y tế. Các chỉ số và khuyến nghị chỉ mang tính tham khảo. Khuyến cáo của bác sĩ được ưu tiên hàng đầu. Khi có dấu hiệu bất thường hoặc đau kéo dài, hãy ngừng tập và tham khảo nhân viên y tế."
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              DISCI không cam kết ngăn ngừa hay loại bỏ hoàn toàn 100% rủi ro chấn thương; ứng dụng hỗ trợ điều chỉnh giảm tải và nhắc nhở an toàn dựa trên dữ liệu bạn cung cấp. DISCI không bán hoặc gợi ý thuốc.
            </div>
          </div>
        </div>

        {/* Right Column: Data Rights & Account Actions */}
        <div className="space-y-6">
          {/* User Profile Mini Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Tài khoản hiện tại
            </h3>
            <div className="space-y-1">
              <div className="font-bold text-slate-800">{profile.fullName}</div>
              <div className="text-slate-500 font-mono">{profile.email}</div>
              <div className="text-slate-400 text-[11px] mt-1">
                Gói sử dụng: <span className="font-semibold text-emerald-700">Miễn phí trọn đời (MVP)</span>
              </div>
            </div>
          </div>

          {/* Data Export & Erase Actions (Section 36) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600" />
              Quyền quản trị dữ liệu
            </h3>

            <div className="space-y-2.5">
              {/* Export JSON */}
              <button
                onClick={handleExportData}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Xuất toàn bộ dữ liệu (JSON)</span>
              </button>

              {/* Clear health records */}
              <button
                onClick={handleDeleteHealthRecords}
                className="w-full py-2.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa kết quả khám sức khỏe</span>
              </button>

              {/* Reset all data */}
              <button
                onClick={handleResetAllData}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Đặt lại ứng dụng & Xóa tài khoản</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Tuân thủ quy định bảo vệ dữ liệu cá nhân tại Việt Nam (Nghị định 13/2023/NĐ-CP).
            </p>
          </div>

          {/* App Specifications */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700">Thông tin ứng dụng DISCI</div>
            <div>Phiên bản: <span className="font-mono">1.0.0-mvp</span></div>
            <div>Mã định danh Applet: <span className="font-mono text-[10px]">6f18551e</span></div>
            <div>Ngôn ngữ: Tiếng Việt (VNĐ, kg, cm, mmHg)</div>
            <div>Đối tượng: Người dùng 18-30 tuổi tại Việt Nam</div>
          </div>
        </div>
      </div>
    </div>
  );
};
