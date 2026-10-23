import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMI,
  calculateTDEE,
  checkWeightJump,
  evaluateHealthSafety,
  recommendProducts,
  calculateCostComparison,
  calculateNutritionTargets
} from './rules';
import { ProductItem, UserProfile, HealthRecord } from '../types';

test('BMI calculation: correct formula and tiers', () => {
  // Height 170cm, Weight 65kg -> BMI = 65 / (1.7^2) = 22.49 -> 22.5 (Normal)
  const normal = calculateBMI(170, 65);
  assert.equal(normal.bmi, 22.5);
  assert.equal(normal.tier, 'good_progress');

  // Height 170cm, Weight 75kg -> BMI = 75 / 2.89 = 25.95 -> 26.0 (Caution >= 25)
  const caution = calculateBMI(170, 75);
  assert.equal(caution.bmi, 26.0);
  assert.equal(caution.tier, 'caution');

  // Height 170cm, Weight 90kg -> BMI = 90 / 2.89 = 31.1 (High Alert >= 30)
  const highAlert = calculateBMI(170, 90);
  assert.equal(highAlert.bmi, 31.1);
  assert.equal(highAlert.tier, 'high_alert');

  // Height 170cm, Weight 50kg -> BMI = 50 / 2.89 = 17.3 (High Alert < 18.5)
  const underweight = calculateBMI(170, 50);
  assert.equal(underweight.bmi, 17.3);
  assert.equal(underweight.tier, 'high_alert');
});

test('TDEE calculation: Mifflin-St Jeor formula and activity multipliers', () => {
  // Male: 170cm, 65kg, 25 years old, moderate (1.55)
  // BMR = 10*65 + 6.25*170 - 5*25 + 5 = 650 + 1062.5 - 125 + 5 = 1592.5 -> 1593
  // TDEE = 1593 * 1.55 = 2469
  const maleResult = calculateTDEE(65, 170, 25, 'male', 'moderate');
  assert.equal(maleResult.bmr, 1593);
  assert.equal(maleResult.tdee, 2469);
  assert.equal(maleResult.activityMultiplier, 1.55);

  // Female: 160cm, 50kg, 22 years old, sedentary (1.2)
  // BMR = 10*50 + 6.25*160 - 5*22 - 161 = 500 + 1000 - 110 - 161 = 1229
  // TDEE = 1229 * 1.2 = 1475
  const femaleResult = calculateTDEE(50, 160, 22, 'female', 'sedentary');
  assert.equal(femaleResult.bmr, 1229);
  assert.equal(femaleResult.tdee, 1475);
});

test('Weight jump detection: triggers when change > 2.0 kg', () => {
  const noJump = checkWeightJump(65.5, 66.0);
  assert.equal(noJump.hasJump, false);
  assert.equal(noJump.differenceKg, 0.5);

  const hasJump = checkWeightJump(68.5, 66.0);
  assert.equal(hasJump.hasJump, true);
  assert.equal(hasJump.differenceKg, 2.5);
  assert.match(hasJump.message || '', /Cân nặng thay đổi 2.5 kg/);
});

test('Health safety 3-tier rules: Blood pressure and heart rate thresholds', () => {
  // Normal BP (120/80)
  const normalAssessment = evaluateHealthSafety({
    weightKg: 65,
    heightCm: 170,
    systolicBp: 120,
    diastolicBp: 80,
    restingHeartRate: 70
  });
  assert.equal(normalAssessment.overallTier, 'good_progress');
  assert.equal(normalAssessment.alerts.length, 0);

  // Caution BP (135/85) -> caution
  const cautionAssessment = evaluateHealthSafety({
    weightKg: 65,
    heightCm: 170,
    systolicBp: 135,
    diastolicBp: 85,
    restingHeartRate: 72
  });
  assert.equal(cautionAssessment.overallTier, 'caution');
  assert.ok(cautionAssessment.alerts.some(a => a.metric === 'Huyết áp' && a.tier === 'caution'));

  // High alert BP (145/95) -> high_alert
  const highBpAssessment = evaluateHealthSafety({
    weightKg: 65,
    heightCm: 170,
    systolicBp: 145,
    diastolicBp: 95,
    restingHeartRate: 72
  });
  assert.equal(highBpAssessment.overallTier, 'high_alert');

  // High alert HR (> 100)
  const highHrAssessment = evaluateHealthSafety({
    weightKg: 65,
    heightCm: 170,
    systolicBp: 120,
    diastolicBp: 80,
    restingHeartRate: 105
  });
  assert.equal(highHrAssessment.overallTier, 'high_alert');
});

test('Doctor recommendation strictly overrides algorithm', () => {
  const dummyHealthRecord: HealthRecord = {
    id: 'hr_1',
    checkupDate: '2026-10-15',
    clinicFacility: 'Bệnh viện Bạch Mai',
    systolicBp: 120,
    diastolicBp: 80,
    restingHeartRate: 70,
    doctorHaltExercise: true,
    doctorExerciseRecommendation: 'Tạm ngừng tập, chờ kết quả xét nghiệm bổ sung',
    consentGrantedForWorkoutPersonalization: true,
    updatedAt: new Date().toISOString()
  };

  const assessment = evaluateHealthSafety(
    { weightKg: 65, heightCm: 170 },
    undefined,
    dummyHealthRecord,
    true // consent granted
  );

  assert.equal(assessment.overallTier, 'high_alert');
  assert.equal(assessment.canExerciseSafely, false);
  assert.equal(assessment.doctorOverrideActive, true);
  assert.ok(assessment.alerts.some(a => a.id === 'alert_doctor_halt'));
});

test('Product recommendation: price ascending sort and high-alert restriction', () => {
  const mockCatalog: ProductItem[] = [
    {
      id: 'p1',
      name: 'Bộ tạ tay cao su 10kg',
      category: 'dumbbell',
      priceVnd: 450000,
      updatedDate: '2026-10-01',
      image: '/assets/dumbbells.jpg',
      description: 'Tạ tay luyện tập',
      suitableFor: 'Tăng cơ',
      safetyNotes: 'Khởi động kỹ',
      necessityLevel: 'recommended',
      recommendationReason: 'Tập thân trên',
      isRestrictedForHighAlert: true,
      isRestrictedForHighGlucose: false,
      isDormFriendly: true,
      isDemoData: true
    },
    {
      id: 'p2',
      name: 'Dây kháng lực mini band 5 cấp độ',
      category: 'band',
      priceVnd: 85000,
      updatedDate: '2026-10-01',
      image: '/assets/band.jpg',
      description: 'Dây kháng lực nhẹ',
      suitableFor: 'Mọi đối tượng',
      safetyNotes: 'Kiểm tra độ co giãn',
      necessityLevel: 'essential',
      recommendationReason: 'Tiết kiệm và cơ động',
      isRestrictedForHighAlert: false,
      isRestrictedForHighGlucose: false,
      isDormFriendly: true,
      isDemoData: true
    },
    {
      id: 'p3',
      name: 'Thảm tập yoga chống trượt NBR',
      category: 'mat',
      priceVnd: 160000,
      updatedDate: '2026-10-01',
      image: '/assets/mat.jpg',
      description: 'Thảm êm',
      suitableFor: 'Tập sàn',
      safetyNotes: 'Lau khô sau tập',
      necessityLevel: 'essential',
      recommendationReason: 'Bảo vệ khớp khuỷu và gối',
      isRestrictedForHighAlert: false,
      isRestrictedForHighGlucose: false,
      isDormFriendly: true,
      isDemoData: true
    }
  ];

  const mockProfile: UserProfile = {
    id: 'u1',
    email: 'test@example.com',
    fullName: 'Nguyen Van A',
    age: 24,
    gender: 'male',
    heightCm: 170,
    weightKg: 65,
    workoutGoal: 'muscle_gain',
    workoutsPerWeek: 3,
    sessionDurationMinutes: 30,
    activityLevel: 'moderate',
    spaceType: 'bedroom',
    dormitoryMode: false,
    availableEquipment: [],
    equipmentBudgetVnd: 1000000,
    selfReportedRestrictions: [],
    hasCompletedOnboarding: true,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01'
  };

  const normalSafety = evaluateHealthSafety({ weightKg: 65, heightCm: 170 });
  const result = recommendProducts(mockCatalog, mockProfile, normalSafety, null, 'price_asc');

  // Verify ascending sort: 85,000 -> 160,000 -> 450,000
  assert.equal(result.recommendedList.length, 3);
  assert.equal(result.recommendedList[0].priceVnd, 85000);
  assert.equal(result.recommendedList[1].priceVnd, 160000);
  assert.equal(result.recommendedList[2].priceVnd, 450000);

  // When High Alert is active, heavy dumbbell p1 must be filtered out
  const highAlertSafety = evaluateHealthSafety({
    weightKg: 65,
    heightCm: 170,
    systolicBp: 150,
    diastolicBp: 95
  });
  const highAlertResult = recommendProducts(mockCatalog, mockProfile, highAlertSafety, null, 'price_asc');
  assert.equal(highAlertResult.recommendedList.some(p => p.id === 'p1'), false);
  assert.ok(highAlertResult.filteredOutList.some(item => item.product.id === 'p1'));
});

test('Cost comparison calculation: computes savings accurately', () => {
  // Home initial: 500,000 VNĐ, monthly: 0 VNĐ
  // Gym: 400,000 VNĐ/mo, PT: 0, Commute: 100,000 VNĐ/mo => 500,000 * 6 = 3,000,000 VNĐ
  // Savings = 3,000,000 - 500,000 = 2,500,000 VNĐ
  const comp = calculateCostComparison(500000, 0, 400000, 0, 100000, 6);
  assert.equal(comp.homeTotalCost, 500000);
  assert.equal(comp.gymTotalCost, 3000000);
  assert.equal(comp.savingsVnd, 2500000);
  assert.equal(comp.savingsPercent, 83);
});

test('Nutrition target calculation: adjusts calories according to goal', () => {
  const fatLoss = calculateNutritionTargets(2200, 70, 'fat_loss');
  assert.equal(fatLoss.calorieTarget, 1800); // 2200 - 400
  assert.equal(fatLoss.proteinGramsTarget, 98); // 70 * 1.4

  const muscleGain = calculateNutritionTargets(2200, 70, 'muscle_gain');
  assert.equal(muscleGain.calorieTarget, 2500); // 2200 + 300
  assert.equal(muscleGain.proteinGramsTarget, 112); // 70 * 1.6
});
