import React from 'react';
import { UserProfile, BodyMetricRecord, HealthRecord, HealthSafetyAssessment, ProductItem } from '../types';
import { calculateBMI, calculateTDEE } from '../utils/rules';
import { SafetyAlertBanner } from './SafetyAlertBanner';
import { ProductRecommendationSection } from './ProductRecommendationSection';
import { Scale, Activity, Flame, Stethoscope, HeartPulse, ShieldAlert, ArrowUpRight, Edit3 } from 'lucide-react';

interface BodyReportViewProps {
  profile: UserProfile;
  metrics: BodyMetricRecord[];
  healthRecord: HealthRecord | null;
  safety: HealthSafetyAssessment;
  onOpenQuickMetrics: () => void;
  onOpenCheckupModal: () => void;
  onAddToCart: (product: ProductItem) => void;
  onNavigateToCostComparison: () => void;
  onEditProfile: () => void;
}

export const BodyReportView: React.FC<BodyReportViewProps> = ({
  profile,
  metrics,
  healthRecord,
  safety,
  onOpenQuickMetrics,
  onOpenCheckupModal,
  onAddToCart,
  onNavigateToCostComparison,
  onEditProfile
}) => {
  const latestMetric = metrics[0] || {
    weightKg: profile.weightKg,
    restingHeartRate: 72,
    systolicBp: 120,
    diastolicBp: 80
  };

  const bmiData = calculateBMI(profile.heightCm, latestMetric.weightKg);
  const tdeeData = calculateTDEE(
    latestMetric.weightKg,
    profile.heightCm,
    profile.age,
    profile.gender,
    profile.activityLevel
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Báo cáo sức khỏe & thể trạng cá nhân
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Báo cáo thể trạng toàn diện
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật lần cuối: {new Date(latestMetric.date || Date.now()).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCheckupModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs"
          >
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>Kết quả khám bệnh</span>
          </button>
          <button
            onClick={onOpenQuickMetrics}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
          >
            <Activity className="w-4 h-4" />
            <span>Cập nhật số đo</span>
          </button>
        </div>
      </div>

      {/* 2. Three-Tier Safety Alert Banner */}
      <SafetyAlertBanner safety={safety} onOpenCheckupModal={onOpenCheckupModal} />

      {/* 3. Core Metrics Grid (BMI, TDEE, Weight, BP) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BMI Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              Chỉ số BMI
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                bmiData.tier === 'high_alert'
                  ? 'bg-red-100 text-red-800'
                  : bmiData.tier === 'caution'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {bmiData.label}
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {bmiData.bmi}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Công thức: {latestMetric.weightKg}kg / ({profile.heightCm / 100}m)²
            </div>
          </div>

          <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
            {bmiData.explanation}
          </div>
        </div>

        {/* TDEE Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              Năng lượng TDEE
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
              Ước tính
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {tdeeData.tdee} <span className="text-sm font-semibold text-slate-500">kcal/ngày</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              BMR cơ bản: {tdeeData.bmr} kcal (Mifflin-St Jeor)
            </div>
          </div>

          <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
            Hệ số vận động: {tdeeData.activityMultiplier} ({profile.workoutsPerWeek} buổi/tuần).
          </div>
        </div>

        {/* Huyết áp Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-red-500" />
              Huyết áp
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {latestMetric.systolicBp && latestMetric.systolicBp >= 140 ? 'Cao' : latestMetric.systolicBp && latestMetric.systolicBp >= 130 ? 'Lưu ý' : 'Bình thường'}
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {latestMetric.systolicBp || 120}/{latestMetric.diastolicBp || 80}
              <span className="text-sm font-semibold text-slate-500 ml-1">mmHg</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Nhịp tim nghỉ: {latestMetric.restingHeartRate || 72} lần/phút
            </div>
          </div>

          <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
            Ngưỡng an toàn: Tâm thu &lt;130 và tâm trương &lt;85 mmHg.
          </div>
        </div>

        {/* Hồ sơ thể lực & Mục tiêu Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mục tiêu cá nhân
              </span>
              <button
                onClick={onEditProfile}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
                title="Sửa hồ sơ"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2">
              <div className="text-base font-extrabold text-slate-900">
                {profile.workoutGoal === 'muscle_gain' ? 'Tăng cơ nạc' : profile.workoutGoal === 'fat_loss' ? 'Giảm mỡ & Săn chắc' : 'Tăng sức bền thể lực'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {profile.age} tuổi · {profile.heightCm} cm · {latestMetric.weightKg} kg
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100">
            Không gian: {profile.spaceType === 'dorm_small' ? 'Ký túc xá / Phòng trọ' : 'Phòng riêng'} · {profile.workoutsPerWeek} buổi/tuần ({profile.sessionDurationMinutes} phút/buổi).
          </div>
        </div>
      </div>

      {/* 4. Health Checkup Summary Card (Mục 11) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Kết quả khám sức khỏe đã tích hợp
            </h3>
          </div>
          <button
            onClick={onOpenCheckupModal}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            {healthRecord ? 'Xem & Chỉnh sửa phiếu khám' : '+ Nhập phiếu khám định kỳ'}
          </button>
        </div>

        {healthRecord ? (
          <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Nơi khám:</span>
              <span className="font-semibold text-slate-800">{healthRecord.clinicFacility}</span>
              <span className="text-slate-400 block text-[10px] mt-0.5">Ngày: {healthRecord.checkupDate}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Ghi nhận xương khớp:</span>
              <span className="font-semibold text-slate-800">
                {healthRecord.musculoskeletalNotes || 'Không phát hiện bất thường'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Khuyến cáo của bác sĩ:</span>
              <span className="font-semibold text-emerald-800">
                {healthRecord.doctorExerciseRecommendation || 'Vận động thể thao điều độ'}
              </span>
              <div className="text-[10px] text-teal-600 mt-0.5">
                {healthRecord.consentGrantedForWorkoutPersonalization ? '✓ Đã cấp quyền cá nhân hóa lịch tập' : '✕ Chưa cấp quyền'}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-3 text-xs text-slate-500">
            Bạn chưa nhập phiếu khám sức khỏe định kỳ. Chức năng này không bắt buộc; nếu có kết quả khám từ bệnh viện, bạn có thể nhập để hệ thống tự động loại bỏ các bài tập gây hại khớp hoặc tim mạch.
          </div>
        )}
      </div>

      {/* 5. GỢI Ý SẢN PHẨM PHÙ HỢP VỚI BẠN (NẰM NGAY DƯỚI BÁO CÁO THỂ TRẠNG - PHẦN XI MỤC 23) */}
      <ProductRecommendationSection
        profile={profile}
        safety={safety}
        onAddToCart={onAddToCart}
        onNavigateToCostComparison={onNavigateToCostComparison}
      />
    </div>
  );
};
