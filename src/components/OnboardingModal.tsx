import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Scale, Dumbbell, Home, Shield } from 'lucide-react';
import { UserProfile, WorkoutGoal, ActivityLevel, SpaceType } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile
}) => {
  const [step, setStep] = useState<number>(1);
  const [fullName, setFullName] = useState(currentProfile.fullName || 'Nguyễn Văn Tú');
  const [age, setAge] = useState<number>(currentProfile.age || 23);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentProfile.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(currentProfile.heightCm || 172);
  const [weightKg, setWeightKg] = useState<number>(currentProfile.weightKg || 66.5);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(currentProfile.targetWeightKg || 68.0);
  const [goal, setGoal] = useState<WorkoutGoal>(currentProfile.workoutGoal || 'muscle_gain');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number>(currentProfile.workoutsPerWeek || 4);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(currentProfile.sessionDurationMinutes || 35);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(currentProfile.activityLevel || 'moderate');
  const [spaceType, setSpaceType] = useState<SpaceType>(currentProfile.spaceType || 'dorm_small');
  const [dormitoryMode, setDormitoryMode] = useState<boolean>(currentProfile.dormitoryMode ?? true);
  const [budgetVnd, setBudgetVnd] = useState<number>(currentProfile.equipmentBudgetVnd || 500000);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(currentProfile.availableEquipment || ['resistance_band', 'mat']);
  const [restrictions, setRestrictions] = useState<string>(currentProfile.selfReportedRestrictions?.join(', ') || 'Chú ý khớp gối khi vận động mạnh');

  if (!isOpen) return null;

  const handleEquipmentToggle = (item: string) => {
    setAvailableEquipment(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentProfile,
      fullName: fullName.trim() || 'Người dùng DISCI',
      age,
      gender,
      heightCm,
      weightKg,
      targetWeightKg,
      workoutGoal: goal,
      workoutsPerWeek,
      sessionDurationMinutes,
      activityLevel,
      spaceType,
      dormitoryMode,
      equipmentBudgetVnd: budgetVnd,
      availableEquipment,
      selfReportedRestrictions: restrictions.split(',').map(s => s.trim()).filter(Boolean),
      hasCompletedOnboarding: true,
      updatedAt: new Date().toISOString()
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header & Step progress */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Bước {step} / 3: {step === 1 ? 'Chỉ số cơ thể' : step === 2 ? 'Mục tiêu & Thời gian' : 'Không gian & Ngân sách'}
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
              Thiết lập hồ sơ cá nhân hóa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="h-1 bg-slate-100 w-full">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <form onSubmit={step === 3 ? handleFinish : e => { e.preventDefault(); setStep(s => s + 1); }} className="p-5 space-y-5 text-xs text-slate-700">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Họ và tên của bạn:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tuổi:</label>
                  <input
                    type="number"
                    min="16"
                    max="80"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value) || 20)}
                    className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Giới tính sinh học:</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full h-10 px-3 font-semibold rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Chiều cao (cm):</label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    value={heightCm}
                    onChange={e => setHeightCm(parseInt(e.target.value) || 160)}
                    className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Cân nặng (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="180"
                    value={weightKg}
                    onChange={e => setWeightKg(parseFloat(e.target.value) || 50)}
                    className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Cân nặng mục tiêu hướng tới (kg):</label>
                <input
                  type="number"
                  step="0.5"
                  value={targetWeightKg}
                  onChange={e => setTargetWeightKg(parseFloat(e.target.value) || 50)}
                  className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Mục tiêu tập luyện chính:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'muscle_gain', label: 'Tăng cơ nạc' },
                    { id: 'fat_loss', label: 'Giảm mỡ & Săn chắc' },
                    { id: 'endurance', label: 'Tăng sức bền' },
                    { id: 'general_health', label: 'Nâng cao sức khỏe' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id as any)}
                      className={`py-3 px-3 rounded-xl font-bold border transition-all text-left ${
                        goal === g.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Số buổi/tuần:</label>
                  <select
                    value={workoutsPerWeek}
                    onChange={e => setWorkoutsPerWeek(parseInt(e.target.value))}
                    className="w-full h-10 px-3 font-bold rounded-xl border border-slate-200 bg-white"
                  >
                    {[2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} buổi mỗi tuần</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Thời lượng/buổi:</label>
                  <select
                    value={sessionDurationMinutes}
                    onChange={e => setSessionDurationMinutes(parseInt(e.target.value))}
                    className="w-full h-10 px-3 font-bold rounded-xl border border-slate-200 bg-white"
                  >
                    {[20, 30, 35, 45, 60].map(m => (
                      <option key={m} value={m}>{m} phút</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Mức vận động hiện tại:</label>
                <select
                  value={activityLevel}
                  onChange={e => setActivityLevel(e.target.value as any)}
                  className="w-full h-10 px-3 font-medium rounded-xl border border-slate-200 bg-white"
                >
                  <option value="sedentary">Ít vận động (ngồi máy tính nhiều)</option>
                  <option value="light">Vận động nhẹ (đi bộ nhẹ 1-3 ngày/tuần)</option>
                  <option value="moderate">Vận động vừa (tập 3-5 ngày/tuần)</option>
                  <option value="very_active">Vận động nhiều (tập 6-7 ngày/tuần)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Chế độ Ký túc xá switch */}
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-teal-950 block text-xs">
                    Chế độ Ký túc xá / Phòng trọ (Ít tiếng ồn)
                  </span>
                  <span className="text-[11px] text-teal-800 block mt-0.5">
                    Tự động thay các bài bật nhảy bằng bài êm không làm rung sàn
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dormitoryMode}
                  onChange={e => setDormitoryMode(e.target.checked)}
                  className="w-5 h-5 rounded text-teal-600"
                />
              </div>

              {/* Dụng cụ hiện có */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Dụng cụ bạn đã có sẵn:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'resistance_band', label: 'Dây kháng lực' },
                    { id: 'mat', label: 'Thảm tập thể dục' },
                    { id: 'dumbbell', label: 'Tạ tay' },
                    { id: 'pullup', label: 'Xà đơn' }
                  ].map(eq => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => handleEquipmentToggle(eq.id)}
                      className={`p-2.5 rounded-xl border font-semibold text-xs transition-all ${
                        availableEquipment.includes(eq.id)
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {availableEquipment.includes(eq.id) ? '✓ ' : '+ '}
                      {eq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ngân sách mua đồ */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Ngân sách dự kiến mua dụng cụ (VNĐ):
                </label>
                <input
                  type="number"
                  step="50000"
                  value={budgetVnd}
                  onChange={e => setBudgetVnd(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 font-mono font-bold rounded-xl border border-slate-200"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Hệ thống sẽ không gợi ý các sản phẩm vượt quá ngân sách này.
                </span>
              </div>

              {/* Hạn chế vận động */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Các hạn chế hoặc vùng đau cần chú ý:
                </label>
                <input
                  type="text"
                  value={restrictions}
                  onChange={e => setRestrictions(e.target.value)}
                  placeholder="Ví dụ: Đau gối khi nhảy, mỏi thắt lưng..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            ) : <div></div>}

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>{step === 3 ? 'Hoàn tất & Cập nhật' : 'Tiếp theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
