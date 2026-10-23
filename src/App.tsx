import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  BodyMetricRecord,
  HealthRecord,
  WorkoutDayPlan,
  WorkoutSessionLog,
  DailyRecoveryCheckin,
  ExerciseItem,
  ProductItem,
  CartItem,
  OrderRecord
} from './types';
import { StorageService } from './services/storage';
import { evaluateHealthSafety, generateWeeklySchedule } from './utils/rules';
import { EXERCISE_LIBRARY } from './data/mockData';

// Component views & modals
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OverviewView } from './components/OverviewView';
import { ScheduleView } from './components/ScheduleView';
import { ExerciseLibraryView } from './components/ExerciseLibraryView';
import { ProgressView } from './components/ProgressView';
import { BodyReportView } from './components/BodyReportView';
import { CostComparisonView } from './components/CostComparisonView';
import { NutritionView } from './components/NutritionView';
import { CommunityView } from './components/CommunityView';
import { CartOrderView } from './components/CartOrderView';
import { DeviceSyncView } from './components/DeviceSyncView';
import { SettingsPrivacyView } from './components/SettingsPrivacyView';
import { TraceabilityMatrixView } from './components/TraceabilityMatrixView';

// Modals
import { QuickMetricsModal } from './components/QuickMetricsModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { RecoveryCheckinModal } from './components/RecoveryCheckinModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { HealthCheckupModal } from './components/HealthCheckupModal';
import { PDFReportModal } from './components/PDFReportModal';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Core Application Persistent State
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [metrics, setMetrics] = useState<BodyMetricRecord[]>(() => StorageService.getBodyMetrics());
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(() => StorageService.getHealthRecord());
  const [schedule, setSchedule] = useState<WorkoutDayPlan[]>(() => StorageService.getWorkoutSchedule());
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutSessionLog[]>(() => StorageService.getWorkoutLogs());
  const [cartItems, setCartItems] = useState<CartItem[]>(() => StorageService.getCartItems());
  const [orders, setOrders] = useState<OrderRecord[]>(() => StorageService.getOrders());
  const [dormitoryMode, setDormitoryMode] = useState<boolean>(() => profile.dormitoryMode ?? true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Active Modals
  const [isQuickMetricsOpen, setIsQuickMetricsOpen] = useState(false);
  const [isRecoveryCheckinOpen, setIsRecoveryCheckinOpen] = useState(false);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutDayPlan | null>(null);
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<ExerciseItem | null>(null);
  const [isHealthCheckupOpen, setIsHealthCheckupOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute 3-tier health safety assessment whenever metrics or healthRecord changes
  const latestMetric = metrics[0] || { weightKg: profile.weightKg, heightCm: profile.heightCm };
  const previousMetric = metrics[1] ? { weightKg: metrics[1].weightKg } : undefined;

  const safetyAssessment = evaluateHealthSafety(
    {
      weightKg: latestMetric.weightKg,
      heightCm: profile.heightCm,
      systolicBp: latestMetric.systolicBp,
      diastolicBp: latestMetric.diastolicBp,
      restingHeartRate: latestMetric.restingHeartRate
    },
    previousMetric,
    healthRecord,
    healthRecord?.consentGrantedForWorkoutPersonalization ?? false
  );

  // Toggle dormitory mode (Section 22)
  const handleToggleDormitory = () => {
    const nextVal = !dormitoryMode;
    setDormitoryMode(nextVal);
    const updatedProfile = { ...profile, dormitoryMode: nextVal };
    setProfile(updatedProfile);
    StorageService.saveProfile(updatedProfile);

    // Regenerate schedule with quiet/dormitory filters
    const newSchedule = generateWeeklySchedule(updatedProfile, safetyAssessment, EXERCISE_LIBRARY, nextVal);
    setSchedule(newSchedule);
    StorageService.saveWorkoutSchedule(newSchedule);
  };

  // Re-calculate schedule manually
  const handleRegenerateSchedule = () => {
    const newSchedule = generateWeeklySchedule(profile, safetyAssessment, EXERCISE_LIBRARY, dormitoryMode);
    setSchedule(newSchedule);
    StorageService.saveWorkoutSchedule(newSchedule);
  };

  // Save new body metric
  const handleSaveMetric = (newRecord: BodyMetricRecord) => {
    const updatedList = StorageService.addBodyMetric(newRecord);
    setMetrics(updatedList);
    // Re-evaluate and adapt schedule
    const newAssessment = evaluateHealthSafety(
      {
        weightKg: newRecord.weightKg,
        heightCm: profile.heightCm,
        systolicBp: newRecord.systolicBp,
        diastolicBp: newRecord.diastolicBp,
        restingHeartRate: newRecord.restingHeartRate
      },
      updatedList[1] ? { weightKg: updatedList[1].weightKg } : undefined,
      healthRecord,
      healthRecord?.consentGrantedForWorkoutPersonalization ?? false
    );
    const newSchedule = generateWeeklySchedule(profile, newAssessment, EXERCISE_LIBRARY, dormitoryMode);
    setSchedule(newSchedule);
    StorageService.saveWorkoutSchedule(newSchedule);
  };

  // Delete body metric
  const handleDeleteMetric = (id: string) => {
    const updated = StorageService.deleteBodyMetric(id);
    setMetrics(updated);
  };

  // Save health record
  const handleSaveHealthRecord = (record: HealthRecord | null) => {
    setHealthRecord(record);
    StorageService.saveHealthRecord(record);
    // Refresh schedule to reflect doctor recommendations immediately
    const newAssessment = evaluateHealthSafety(
      {
        weightKg: latestMetric.weightKg,
        heightCm: profile.heightCm,
        systolicBp: latestMetric.systolicBp,
        diastolicBp: latestMetric.diastolicBp,
        restingHeartRate: latestMetric.restingHeartRate
      },
      previousMetric,
      record,
      record?.consentGrantedForWorkoutPersonalization ?? false
    );
    const newSchedule = generateWeeklySchedule(profile, newAssessment, EXERCISE_LIBRARY, dormitoryMode);
    setSchedule(newSchedule);
    StorageService.saveWorkoutSchedule(newSchedule);
  };

  // Save recovery check-in
  const handleSaveRecoveryCheckin = (checkin: DailyRecoveryCheckin) => {
    StorageService.addRecoveryCheckin(checkin);
    // Adjust schedule based on checkin result
    if (checkin.systemAdjustmentResult === 'mandatory_rest' || checkin.systemAdjustmentResult === 'light_recovery') {
      const todayJs = new Date().getDay();
      const todayNum = todayJs === 0 ? 7 : todayJs;
      const updated = schedule.map(d => {
        if (d.dayOfWeek === todayNum) {
          return {
            ...d,
            isRestDay: true,
            focusArea: checkin.systemAdjustmentResult === 'mandatory_rest' ? 'Nghỉ ngơi theo báo cáo đau' : 'Phục hồi nhẹ nhàng 15 phút',
            selectionReason: checkin.adjustmentExplanation
          };
        }
        return d;
      });
      setSchedule(updated);
      StorageService.saveWorkoutSchedule(updated);
    }
  };

  // Finish active workout
  const handleFinishWorkout = (log: WorkoutSessionLog) => {
    const updatedLogs = StorageService.addWorkoutLog(log);
    setWorkoutLogs(updatedLogs);

    // Update the day plan status to completed
    const updatedSchedule = schedule.map(d => {
      if (d.dayOfWeek === log.dayOfWeek) {
        return { ...d, status: 'completed' as const };
      }
      return d;
    });
    setSchedule(updatedSchedule);
    StorageService.saveWorkoutSchedule(updatedSchedule);
  };

  // Cart operations
  const handleAddToCart = (product: ProductItem) => {
    const existing = cartItems.find(i => i.productId === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cartItems.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      updated = [...cartItems, { productId: product.id, product, quantity: 1 }];
    }
    setCartItems(updated);
    StorageService.saveCartItems(updated);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    let updated: CartItem[];
    if (quantity <= 0) {
      updated = cartItems.filter(i => i.productId !== productId);
    } else {
      updated = cartItems.map(i => i.productId === productId ? { ...i, quantity } : i);
    }
    setCartItems(updated);
    StorageService.saveCartItems(updated);
  };

  const handleRemoveCartItem = (productId: string) => {
    const updated = cartItems.filter(i => i.productId !== productId);
    setCartItems(updated);
    StorageService.saveCartItems(updated);
  };

  const handleCheckoutOrder = (order: OrderRecord) => {
    const updatedOrders = StorageService.addOrder(order);
    setOrders(updatedOrders);
    setCartItems([]);
  };

  const handleUpdateDayPlan = (updatedPlan: WorkoutDayPlan) => {
    const updated = schedule.map(d => d.dayOfWeek === updatedPlan.dayOfWeek ? updatedPlan : d);
    setSchedule(updated);
    StorageService.saveWorkoutSchedule(updated);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    StorageService.saveProfile(updatedProfile);
    const newSchedule = generateWeeklySchedule(updatedProfile, safetyAssessment, EXERCISE_LIBRARY, updatedProfile.dormitoryMode);
    setSchedule(newSchedule);
    StorageService.saveWorkoutSchedule(newSchedule);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-20 lg:pb-10 selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        safetyTier={safetyAssessment.overallTier}
        cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
        dormitoryMode={dormitoryMode}
        onToggleDormitory={handleToggleDormitory}
        isOffline={isOffline}
        onOpenQuickMetrics={() => setIsQuickMetricsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'overview' && (
          <OverviewView
            profile={profile}
            schedule={schedule}
            metrics={metrics}
            safety={safetyAssessment}
            dormitoryMode={dormitoryMode}
            onToggleDormitory={handleToggleDormitory}
            onStartSession={plan => setActiveWorkoutPlan(plan)}
            onNavigate={setCurrentTab}
            onOpenQuickMetrics={() => setIsQuickMetricsOpen(true)}
            onOpenRecoveryCheckin={() => setIsRecoveryCheckinOpen(true)}
          />
        )}

        {currentTab === 'schedule' && (
          <ScheduleView
            schedule={schedule}
            profile={profile}
            safety={safetyAssessment}
            dormitoryMode={dormitoryMode}
            onToggleDormitory={handleToggleDormitory}
            onStartSession={plan => setActiveWorkoutPlan(plan)}
            onSelectExerciseDetail={ex => setSelectedExerciseForModal(ex)}
            onRegenerateSchedule={handleRegenerateSchedule}
            onUpdateDayPlan={handleUpdateDayPlan}
          />
        )}

        {currentTab === 'library' && (
          <ExerciseLibraryView
            onSelectExercise={ex => setSelectedExerciseForModal(ex)}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressView
            metrics={metrics}
            workoutLogs={workoutLogs}
            profile={profile}
            onOpenQuickMetrics={() => setIsQuickMetricsOpen(true)}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
            onDeleteMetric={handleDeleteMetric}
          />
        )}

        {currentTab === 'body_report' && (
          <BodyReportView
            profile={profile}
            metrics={metrics}
            healthRecord={healthRecord}
            safety={safetyAssessment}
            onOpenQuickMetrics={() => setIsQuickMetricsOpen(true)}
            onOpenCheckupModal={() => setIsHealthCheckupOpen(true)}
            onAddToCart={handleAddToCart}
            onNavigateToCostComparison={() => setCurrentTab('cost_comparison')}
            onEditProfile={() => setIsOnboardingOpen(true)}
          />
        )}

        {currentTab === 'cost_comparison' && (
          <CostComparisonView />
        )}

        {currentTab === 'nutrition' && (
          <NutritionView profile={profile} />
        )}

        {currentTab === 'community' && (
          <CommunityView
            profile={profile}
            workoutLogs={workoutLogs}
            recoveryCheckins={StorageService.getRecoveryCheckins()}
          />
        )}

        {currentTab === 'cart' && (
          <CartOrderView
            cartItems={cartItems}
            orders={orders}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onCheckoutOrder={handleCheckoutOrder}
            onNavigateToCatalog={() => setCurrentTab('body_report')}
          />
        )}

        {currentTab === 'device_sync' && (
          <DeviceSyncView />
        )}

        {currentTab === 'settings' && (
          <SettingsPrivacyView
            profile={profile}
            healthRecord={healthRecord}
            onUpdateProfile={handleSaveProfile}
            onRefreshData={() => {
              setHealthRecord(StorageService.getHealthRecord());
              setMetrics(StorageService.getBodyMetrics());
              setProfile(StorageService.getProfile());
            }}
            onOpenCheckupModal={() => setIsHealthCheckupOpen(true)}
          />
        )}

        {currentTab === 'traceability' && (
          <TraceabilityMatrixView />
        )}
      </main>

      {/* Auxiliary Navigation Links Footer for Extended Subsystems */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <button onClick={() => setCurrentTab('overview')} className="hover:text-slate-900 transition-colors">Tổng quan</button>
            <button onClick={() => setCurrentTab('schedule')} className="hover:text-slate-900 transition-colors">Lịch tập</button>
            <button onClick={() => setCurrentTab('body_report')} className="hover:text-slate-900 transition-colors">Thể trạng & Gợi ý sản phẩm</button>
            <button onClick={() => setCurrentTab('cost_comparison')} className="hover:text-slate-900 transition-colors">So sánh chi phí Gym</button>
            <button onClick={() => setCurrentTab('nutrition')} className="hover:text-slate-900 transition-colors">Dinh dưỡng món Việt</button>
            <button onClick={() => setCurrentTab('community')} className="hover:text-slate-900 transition-colors">Cộng đồng 7 ngày</button>
            <button onClick={() => setCurrentTab('device_sync')} className="hover:text-slate-900 transition-colors">Đồng bộ thiết bị</button>
            <button onClick={() => setCurrentTab('cart')} className="hover:text-slate-900 transition-colors">Giỏ hàng dụng cụ</button>
            <button onClick={() => setCurrentTab('traceability')} className="hover:text-slate-900 transition-colors font-bold text-emerald-700">Kiểm kê 16 phần đề xuất</button>
            <button onClick={() => setCurrentTab('settings')} className="hover:text-slate-900 transition-colors">Cài đặt & Quyền riêng tư</button>
          </div>

          <div className="text-[11px] text-slate-400">
            © 2026 DISCI · Ứng dụng luyện tập tại nhà chi phí thấp & An toàn cho người dùng Việt Nam
          </div>
        </div>
      </footer>

      {/* Fixed Bottom Navigation for Mobile */}
      <BottomNav currentTab={currentTab} onNavigate={setCurrentTab} />

      {/* Interactive Modals */}
      <QuickMetricsModal
        isOpen={isQuickMetricsOpen}
        onClose={() => setIsQuickMetricsOpen(false)}
        latestRecord={metrics[0]}
        heightCm={profile.heightCm}
        onSave={handleSaveMetric}
      />

      <RecoveryCheckinModal
        isOpen={isRecoveryCheckinOpen}
        onClose={() => setIsRecoveryCheckinOpen(false)}
        onSaveCheckin={handleSaveRecoveryCheckin}
      />

      {activeWorkoutPlan && (
        <ActiveWorkoutModal
          isOpen={true}
          onClose={() => setActiveWorkoutPlan(null)}
          dayPlan={activeWorkoutPlan}
          onFinishSession={handleFinishWorkout}
        />
      )}

      <ExerciseDetailModal
        exercise={selectedExerciseForModal}
        onClose={() => setSelectedExerciseForModal(null)}
        onSelectSubstitute={subEx => setSelectedExerciseForModal(subEx)}
      />

      <HealthCheckupModal
        isOpen={isHealthCheckupOpen}
        onClose={() => setIsHealthCheckupOpen(false)}
        record={healthRecord}
        onSave={handleSaveHealthRecord}
      />

      <PDFReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        profile={profile}
        metrics={metrics}
        healthRecord={healthRecord}
        workoutLogs={workoutLogs}
        safety={safetyAssessment}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentProfile={profile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
