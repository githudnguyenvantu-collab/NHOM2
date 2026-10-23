import {
  UserProfile,
  BodyMetricRecord,
  HealthRecord,
  HealthSafetyAssessment,
  HealthSafetyAlert,
  SafetyTier,
  ProductItem,
  WorkoutDayPlan,
  WorkoutSessionExercise,
  ExerciseItem
} from '../types';

/**
 * Tính toán chỉ số BMI và phân loại tham khảo
 * BMI = Cân nặng (kg) / [Chiều cao (m)]²
 */
export function calculateBMI(heightCm: number, weightKg: number): {
  bmi: number;
  label: string;
  tier: SafetyTier;
  explanation: string;
} {
  if (!heightCm || heightCm <= 50 || !weightKg || weightKg <= 20) {
    return {
      bmi: 0,
      label: 'Chưa đủ dữ liệu',
      tier: 'good_progress',
      explanation: 'Vui lòng nhập chiều cao và cân nặng hợp lệ để tính toán.'
    };
  }

  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  let label = 'Bình thường';
  let tier: SafetyTier = 'good_progress';
  let explanation = 'Chỉ số khối cơ thể nằm trong ngưỡng cân đối tham khảo.';

  // Theo ngưỡng quy định trong Mục 12.1 của đề xuất DISCI:
  // Cảnh báo cao: < 18.5 hoặc >= 30
  // Mức lưu ý: từ 25 đến dưới 30
  // Bình thường: 18.5 đến dưới 25
  if (bmi < 18.5) {
    label = 'Thiếu cân (Cảnh báo cao)';
    tier = 'high_alert';
    explanation = 'BMI dưới 18.5. Cần thận trọng, tránh các bài tập tiêu hao năng lượng quá mức, nên tham khảo ý kiến chuyên gia dinh dưỡng.';
  } else if (bmi >= 30) {
    label = 'Béo phì độ 2 (Cảnh báo cao)';
    tier = 'high_alert';
    explanation = 'BMI từ 30 trở lên. Áp lực lên khớp gối và hệ tim mạch cao, tuyệt đối ưu tiên bài tập ít va đập và bắt đầu nhẹ nhàng.';
  } else if (bmi >= 25) {
    label = 'Thừa cân (Mức lưu ý)';
    tier = 'caution';
    explanation = 'BMI từ 25. Cần lưu ý giảm áp lực lên các khớp chịu tải và kiểm soát cường độ vừa phải.';
  }

  return { bmi, label, tier, explanation };
}

/**
 * Tính toán TDEE (Tổng năng lượng tiêu hao hằng ngày)
 * Sử dụng công thức chuyển hóa cơ bản Mifflin-St Jeor được công nhận rộng rãi
 */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'
): {
  bmr: number;
  tdee: number;
  activityMultiplier: number;
  formulaDescription: string;
} {
  if (!weightKg || !heightCm || !age) {
    return {
      bmr: 0,
      tdee: 0,
      activityMultiplier: 1.2,
      formulaDescription: 'Chưa đủ dữ liệu chiều cao, cân nặng hoặc tuổi để tính TDEE.'
    };
  }

  // Mifflin-St Jeor:
  // Nam: BMR = 10 * W + 6.25 * H - 5 * A + 5
  // Nữ: BMR = 10 * W + 6.25 * H - 5 * A - 161
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }
  bmr = Math.round(bmr);

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };

  const activityMultiplier = multipliers[activityLevel] || 1.2;
  const tdee = Math.round(bmr * activityMultiplier);

  const multiplierDescriptions = {
    sedentary: 'Ít vận động (làm việc văn phòng, ít đi lại)',
    light: 'Vận động nhẹ (tập 1–3 buổi/tuần)',
    moderate: 'Vận động vừa (tập 3–5 buổi/tuần)',
    very_active: 'Vận động nhiều (tập 6–7 buổi/tuần)',
    extra_active: 'Vận động rất nặng (lao động thể lực hoặc VĐV)'
  };

  return {
    bmr,
    tdee,
    activityMultiplier,
    formulaDescription: `BMR (${bmr} kcal theo Mifflin-St Jeor) × Hệ số vận động ${activityMultiplier} (${multiplierDescriptions[activityLevel]}). Số liệu mang tính ước tính tham khảo.`
  };
}

/**
 * Kiểm tra biến động cân nặng > 2kg so với lần đo liền trước
 */
export function checkWeightJump(
  currentWeight: number,
  previousWeight?: number
): {
  hasJump: boolean;
  differenceKg: number;
  message?: string;
} {
  if (previousWeight === undefined || previousWeight === null || previousWeight <= 0) {
    return { hasJump: false, differenceKg: 0 };
  }

  const diff = Math.round(Math.abs(currentWeight - previousWeight) * 10) / 10;
  if (diff > 2.0) {
    return {
      hasJump: true,
      differenceKg: diff,
      message: `Cân nặng thay đổi ${diff} kg so với lần đo trước. Hệ thống cần bạn xác nhận lại số đo này trước khi cập nhật lịch tập (lưu ý: không tự suy diễn nguyên nhân y tế).`
    };
  }

  return { hasJump: false, differenceKg: diff };
}

/**
 * Đánh giá an toàn sức khỏe 3 mức (Tiến bộ tốt, Mức lưu ý, Cảnh báo cao)
 * Theo Bảng cấu hình ngưỡng Mục 12.1 và ưu tiên chỉ định bác sĩ Mục 12.3
 */
export function evaluateHealthSafety(
  currentMetrics: {
    weightKg: number;
    heightCm: number;
    systolicBp?: number;
    diastolicBp?: number;
    restingHeartRate?: number;
  },
  previousMetrics?: {
    weightKg: number;
  },
  healthRecord?: HealthRecord | null,
  consentGranted: boolean = false
): HealthSafetyAssessment {
  const alerts: HealthSafetyAlert[] = [];
  let overallTier: SafetyTier = 'good_progress';
  let doctorOverrideActive = false;
  let canExerciseSafely = true;
  const now = new Date().toISOString();

  // 1. Đánh giá BMI
  const bmiResult = calculateBMI(currentMetrics.heightCm, currentMetrics.weightKg);
  if (bmiResult.tier === 'high_alert') {
    alerts.push({
      id: 'alert_bmi_high',
      metric: 'Chỉ số BMI',
      value: `${bmiResult.bmi}`,
      threshold: 'BMI < 18.5 hoặc >= 30',
      tier: 'high_alert',
      reason: bmiResult.explanation,
      workoutImpact: 'Tạm dừng các bài tập bật nhảy va đập mạnh hoặc nâng tạ nặng.',
      substituteGuidance: 'Chuyển sang đi bộ tại chỗ, tập thăng bằng nhẹ và các bài tập ít áp lực khớp.',
      nextAction: 'Theo dõi dinh dưỡng và tham khảo ý kiến nhân viên y tế nếu duy trì kéo dài.',
      updatedAt: now
    });
    overallTier = 'high_alert';
  } else if (bmiResult.tier === 'caution') {
    alerts.push({
      id: 'alert_bmi_caution',
      metric: 'Chỉ số BMI',
      value: `${bmiResult.bmi}`,
      threshold: 'BMI từ 25 đến dưới 30',
      tier: 'caution',
      reason: 'BMI mức thừa cân, cần giảm tải áp lực xương khớp.',
      workoutImpact: 'Giảm các bài tập bật nhảy liên tục, ưu tiên tập với ghế hỗ trợ.',
      substituteGuidance: 'Thay squat sâu bằng box squat (ngồi chạm ghế), thay jumping jacks bằng step jacks.',
      nextAction: 'Duy trì lịch tập vừa sức kết hợp điều chỉnh chế độ ăn.',
      updatedAt: now
    });
    overallTier = 'caution';
  }

  // 2. Biến động cân nặng > 2kg
  if (previousMetrics?.weightKg) {
    const jump = checkWeightJump(currentMetrics.weightKg, previousMetrics.weightKg);
    if (jump.hasJump) {
      alerts.push({
        id: 'alert_weight_jump',
        metric: 'Biến động cân nặng',
        value: `Thay đổi ${jump.differenceKg} kg`,
        threshold: 'Biến động > 2 kg so với lần trước',
        tier: 'caution',
        reason: jump.message || 'Cân nặng thay đổi đột ngột so với dữ liệu liền trước.',
        workoutImpact: 'Giữ nguyên cường độ hiện tại, chưa tăng tải cho tới khi số đo ổn định.',
        substituteGuidance: 'Tiếp tục các bài tập quen thuộc, chú ý bổ sung đủ nước.',
        nextAction: 'Kiểm tra lại cân vào buổi sáng sau khi thức dậy để xác nhận độ chính xác.',
        updatedAt: now
      });
      if (overallTier !== 'high_alert') overallTier = 'caution';
    }
  }

  // 3. Đánh giá Huyết áp
  const sys = currentMetrics.systolicBp;
  const dia = currentMetrics.diastolicBp;
  if (sys !== undefined && dia !== undefined && sys > 0 && dia > 0) {
    if (sys >= 140 || dia >= 90 || sys < 90 || dia < 60) {
      alerts.push({
        id: 'alert_bp_high',
        metric: 'Huyết áp',
        value: `${sys}/${dia} mmHg`,
        threshold: 'Tâm thu >= 140 hoặc Tâm trương >= 90; hoặc < 90/60 mmHg',
        tier: 'high_alert',
        reason: 'Huyết áp nằm ngoài ngưỡng an toàn cho phép tập luyện cường độ cao.',
        workoutImpact: 'Tạm dừng toàn bộ bài tập nặng, không nín thở gồng bụng (Valsalva), không dốc ngược người.',
        substituteGuidance: 'Chỉ thực hiện các bài tập thở thư giãn, vươn vai nhẹ nhàng và nghỉ ngơi.',
        nextAction: 'Đo lại huyết áp sau 15 phút nghỉ ngơi. Nếu huyết áp vẫn cao hoặc kèm chóng mặt, hãy tới cơ sở y tế.',
        updatedAt: now
      });
      overallTier = 'high_alert';
    } else if (sys >= 130 || dia >= 85) {
      alerts.push({
        id: 'alert_bp_caution',
        metric: 'Huyết áp',
        value: `${sys}/${dia} mmHg`,
        threshold: 'Tâm thu từ 130 hoặc Tâm trương từ 85 mmHg',
        tier: 'caution',
        reason: 'Huyết áp ở mức tiền tăng huyết áp/lưu ý.',
        workoutImpact: 'Giảm 20% cường độ bài tập, tránh gánh tạ nặng qua đầu và bài tập nín thở kéo dài.',
        substituteGuidance: 'Ưu tiên bài tập nhịp nhàng với dây kháng lực nhẹ, đi bộ nhịp điệu.',
        nextAction: 'Kiểm tra huyết áp định kỳ hằng tuần và ghi nhận nhật ký.',
        updatedAt: now
      });
      if (overallTier !== 'high_alert') overallTier = 'caution';
    }
  }

  // 4. Đánh giá Nhịp tim nghỉ
  const hr = currentMetrics.restingHeartRate;
  if (hr !== undefined && hr > 0) {
    if (hr > 100 || hr < 50) {
      alerts.push({
        id: 'alert_hr_high',
        metric: 'Nhịp tim nghỉ',
        value: `${hr} lần/phút`,
        threshold: 'Nhịp tim nghỉ > 100 hoặc < 50 lần/phút',
        tier: 'high_alert',
        reason: hr > 100 
          ? 'Nhịp tim nghỉ nhanh bất thường (>100 lần/phút), tim có thể đang quá tải hoặc cơ thể thiếu ngủ, sốt.'
          : 'Nhịp tim nghỉ dưới 50 lần/phút (trừ trường hợp VĐV sức bền được xác nhận, cần áp dụng quy tắc thận trọng).',
        workoutImpact: 'Không thực hiện các bài HIIT hoặc chạy nhanh. Tăng thời gian nghỉ giữa các hiệp.',
        substituteGuidance: 'Tập thở bụng, đi bộ nhẹ nhàng trong 10-15 phút.',
        nextAction: 'Nghỉ ngơi, uống đủ nước và kiểm tra lại khi cơ thể bình tĩnh hoàn toàn.',
        updatedAt: now
      });
      overallTier = 'high_alert';
    } else if (hr >= 90) {
      alerts.push({
        id: 'alert_hr_caution',
        metric: 'Nhịp tim nghỉ',
        value: `${hr} lần/phút`,
        threshold: 'Nhịp tim nghỉ từ 90 lần/phút',
        tier: 'caution',
        reason: 'Nhịp tim nghỉ hơi cao, dấu hiệu cơ thể chưa phục hồi hoàn toàn hoặc căng thẳng.',
        workoutImpact: 'Kéo dài thời gian nghỉ giữa các hiệp từ 60s lên 90s.',
        substituteGuidance: 'Giảm 1 hiệp trong các bài chính.',
        nextAction: 'Đảm bảo ngủ đủ 7-8 tiếng và hạn chế caffeine trước giờ tập.',
        updatedAt: now
      });
      if (overallTier !== 'high_alert') overallTier = 'caution';
    }
  }

  // 5. Đánh giá Dữ liệu khám sức khỏe (chỉ khi có dữ liệu VÀ người dùng ĐÃ ĐỒNG Ý SỬ DỤNG)
  if (healthRecord && consentGranted) {
    // 5.1 Ưu tiên chỉ định bác sĩ - Điều kiện dừng tập
    if (healthRecord.doctorHaltExercise) {
      doctorOverrideActive = true;
      canExerciseSafely = false;
      overallTier = 'high_alert';
      alerts.push({
        id: 'alert_doctor_halt',
        metric: 'Khuyến cáo của bác sĩ',
        value: healthRecord.doctorExerciseRecommendation || 'Tạm ngừng tập',
        threshold: 'Chỉ định bác sĩ: Tạm ngừng tập luyện',
        tier: 'high_alert',
        reason: 'Bác sĩ ghi nhận tình trạng cần tạm dừng tập để theo dõi hoặc điều trị.',
        workoutImpact: 'TUYỆT ĐỐI TẠM DỪNG: Thuật toán không tự tạo lịch tập cho tới khi bác sĩ cho phép.',
        substituteGuidance: 'Nghỉ ngơi hoàn toàn, tuân thủ phác đồ điều trị của bác sĩ.',
        nextAction: 'Tái khám định kỳ và xin ý kiến bác sĩ trước khi bắt đầu vận động trở lại.',
        updatedAt: now
      });
    }

    // 5.2 Khuyến cáo vận động của bác sĩ
    if (healthRecord.doctorExerciseRecommendation && !healthRecord.doctorHaltExercise) {
      const docRec = healthRecord.doctorExerciseRecommendation.toLowerCase();
      if (docRec.includes('chỉ tập nhẹ') || docRec.includes('không chạy') || docRec.includes('không nhảy') || docRec.includes('không tải nặng')) {
        doctorOverrideActive = true;
        alerts.push({
          id: 'alert_doctor_light',
          metric: 'Khuyến cáo của bác sĩ',
          value: healthRecord.doctorExerciseRecommendation,
          threshold: 'Bác sĩ yêu cầu hạn chế va đập/tải nặng',
          tier: 'caution',
          reason: 'Bác sĩ ghi nhận chỉ định tập nhẹ và không chạy nhảy/tải nặng.',
          workoutImpact: 'Loại bỏ hoàn toàn các bài bật nhảy và tạ nặng, chỉ giữ các bài tập thân dưới ít va đập.',
          substituteGuidance: 'Áp dụng đi bộ nhẹ, squat ghế chậm, bài tập dây kháng lực nhẹ.',
          nextAction: 'Luôn lắng nghe cơ thể và dừng ngay nếu có cảm giác đau khó chịu.',
          updatedAt: now
        });
        if (overallTier !== 'high_alert') overallTier = 'caution';
      }
    }

    // 5.3 Lưu ý xương khớp từ bác sĩ
    if (healthRecord.musculoskeletalNotes) {
      const jointNote = healthRecord.musculoskeletalNotes.toLowerCase();
      if (jointNote.includes('gối') || jointNote.includes('khớp gối')) {
        alerts.push({
          id: 'alert_doctor_knee',
          metric: 'Xương khớp (Gối)',
          value: healthRecord.musculoskeletalNotes,
          threshold: 'Ghi nhận lưu ý khớp gối từ bác sĩ',
          tier: 'caution',
          reason: 'Khớp gối cần được bảo vệ khỏi áp lực cắt và va đập dội ngược.',
          workoutImpact: 'Thay thế bài squat thông thường và lunge bằng bài không dồn tải lên gối.',
          substituteGuidance: 'Sử dụng bài glute bridge (cầu mông), clamshell, hamstring curl với dây thun.',
          nextAction: 'Không gập gối quá 90 độ khi chưa có sự hướng dẫn chuyên môn.',
          updatedAt: now
        });
        if (overallTier !== 'high_alert') overallTier = 'caution';
      }
      if (jointNote.includes('lưng') || jointNote.includes('cột sống')) {
        alerts.push({
          id: 'alert_doctor_back',
          metric: 'Xương khớp (Lưng dưới)',
          value: healthRecord.musculoskeletalNotes,
          threshold: 'Ghi nhận lưu ý cột sống/lưng dưới từ bác sĩ',
          tier: 'caution',
          reason: 'Cột sống cần tránh các bài uốn cong gập người tải nặng.',
          workoutImpact: 'Loại bỏ gập bụng truyền thống (sit-up) và deadlift nặng.',
          substituteGuidance: 'Thay bằng bài bird-dog, dead bug, side plank có gối chống.',
          nextAction: 'Giữ lưng ở vị trí trung tính trong suốt mọi chuyển động.',
          updatedAt: now
        });
        if (overallTier !== 'high_alert') overallTier = 'caution';
      }
    }

    // 5.4 Đường huyết đói
    const glu = healthRecord.fastingBloodGlucoseMgDl;
    if (glu !== undefined && glu > 0) {
      if (glu >= 126 || glu < 70) {
        alerts.push({
          id: 'alert_glucose_high',
          metric: 'Đường huyết đói',
          value: `${glu} mg/dL`,
          threshold: 'Đường huyết đói >= 126 hoặc < 70 mg/dL',
          tier: 'high_alert',
          reason: glu >= 126 
            ? 'Đường huyết đói ở ngưỡng nghi ngờ đái tháo đường, cần đánh giá y khoa.'
            : 'Đường huyết đói thấp (<70 mg/dL), nguy cơ hạ đường huyết khi vận động.',
          workoutImpact: 'Tránh các buổi tập nặng lúc đói. Luôn chuẩn bị sẵn viên đường hoặc trái cây.',
          substituteGuidance: 'Vận động nhẹ nhàng 20 phút sau ăn 1 giờ.',
          nextAction: 'Đến cơ sở y tế để được bác sĩ chuyên khoa nội tiết tư vấn.',
          updatedAt: now
        });
        overallTier = 'high_alert';
      } else if (glu >= 100) {
        alerts.push({
          id: 'alert_glucose_caution',
          metric: 'Đường huyết đói',
          value: `${glu} mg/dL`,
          threshold: 'Đường huyết đói từ 100 đến dưới 126 mg/dL',
          tier: 'caution',
          reason: 'Mức tiền đái tháo đường, cần cải thiện độ nhạy insulin qua vận động bền bỉ.',
          workoutImpact: 'Tập luyện đều đặn hằng ngày với cường độ trung bình.',
          substituteGuidance: 'Đi bộ nhanh, đạp xe nhẹ nhàng, các bài tập nhóm cơ lớn.',
          nextAction: 'Hạn chế đồ uống có đường và kiểm tra lại sau 3 tháng.',
          updatedAt: now
        });
        if (overallTier !== 'high_alert') overallTier = 'caution';
      }
    }

    // 5.5 Mỡ máu (Cholesterol, LDL, Triglycerides)
    const chol = healthRecord.totalCholesterolMgDl;
    const ldl = healthRecord.ldlCholesterolMgDl;
    const trig = healthRecord.triglyceridesMgDl;
    if ((chol && chol >= 200) || (ldl && ldl >= 160) || (trig && trig >= 200)) {
      alerts.push({
        id: 'alert_lipid_caution',
        metric: 'Bộ mỡ máu',
        value: `TC: ${chol || '-'}, LDL: ${ldl || '-'}, TG: ${trig || '-'} mg/dL`,
        threshold: 'Cholesterol toàn phần >= 200 hoặc LDL >= 160 hoặc TG >= 200 mg/dL',
        tier: 'caution',
        reason: 'Chỉ số mỡ máu cần lưu ý, tăng nguy cơ xơ vữa mạch máu nếu tập quá sức đột ngột.',
        workoutImpact: 'Khởi động kỹ ít nhất 10 phút, không tăng cường độ đột ngột.',
        substituteGuidance: 'Ưu tiên bài tập sức bền nhịp nhàng (aerobic vừa sức).',
        nextAction: 'Tái khám định kỳ và trao đổi với bác sĩ về chế độ ăn giảm chất béo bão hòa.',
        updatedAt: now
      });
      if (overallTier !== 'high_alert') overallTier = 'caution';
    }
  }

  // Tóm tắt lời khuyên
  let summaryAdvice = 'Thể trạng ổn định. Bạn có thể duy trì lịch tập tiến bộ và tăng khối lượng từ từ theo nguyên tắc an toàn.';
  if (overallTier === 'high_alert') {
    summaryAdvice = 'Hệ thống phát hiện một hoặc nhiều chỉ số ở mức CẢNH BÁO CAO. Ưu tiên hàng đầu là an toàn, nghỉ ngơi và tham khảo ý kiến nhân viên y tế.';
  } else if (overallTier === 'caution') {
    summaryAdvice = 'Có chỉ số ở MỨC LƯU Ý. Lịch tập đã được tự động điều chỉnh giảm áp lực và thay thế bằng các bài tập an toàn hơn.';
  }

  return {
    overallTier,
    alerts,
    doctorOverrideActive,
    canExerciseSafely,
    summaryAdvice
  };
}

/**
 * Thuật toán tạo và đề xuất lịch tập 7 ngày cá nhân hóa
 */
export function generateWeeklySchedule(
  profile: UserProfile,
  safety: HealthSafetyAssessment,
  exercises: ExerciseItem[],
  dormitoryMode: boolean
): WorkoutDayPlan[] {
  const days: WorkoutDayPlan[] = [];
  const daysOfWeek = [
    { num: 1, name: 'Thứ Hai' },
    { num: 2, name: 'Thứ Ba' },
    { num: 3, name: 'Thứ Tư' },
    { num: 4, name: 'Thứ Năm' },
    { num: 5, name: 'Thứ Sáu' },
    { num: 6, name: 'Thứ Bảy' },
    { num: 7, name: 'Chủ Nhật' },
  ];

  // Nếu bác sĩ yêu cầu ngừng tập hoặc cảnh báo cao không thể tập an toàn:
  if (!safety.canExerciseSafely || (safety.doctorOverrideActive && safety.overallTier === 'high_alert')) {
    return daysOfWeek.map(d => ({
      dayOfWeek: d.num,
      dayName: d.name,
      isRestDay: true,
      focusArea: 'Nghỉ ngơi theo chỉ định bác sĩ',
      estimatedMinutes: 15,
      difficulty: 'Dễ',
      warmupMinutes: 5,
      warmupDescription: 'Thở sâu nhịp nhàng, thả lỏng cổ vai gáy tại chỗ.',
      exercises: [],
      cooldownMinutes: 5,
      cooldownDescription: 'Thư giãn hoàn toàn, theo dõi nhịp thở.',
      selectionReason: 'Bác sĩ khuyến cáo tạm dừng tập luyện để đảm bảo an toàn tối đa cho sức khỏe.',
      status: 'pending'
    }));
  }

  const workoutsCount = Math.min(Math.max(profile.workoutsPerWeek || 3, 2), 6);
  // Phân bố các ngày tập: ví dụ 3 ngày: Thứ 2, 4, 6; 4 ngày: Thứ 2, 3, 5, 7
  const isWorkoutDay = (dayNum: number): boolean => {
    if (workoutsCount === 2) return dayNum === 2 || dayNum === 5;
    if (workoutsCount === 3) return dayNum === 1 || dayNum === 3 || dayNum === 5;
    if (workoutsCount === 4) return dayNum === 1 || dayNum === 2 || dayNum === 4 || dayNum === 6;
    if (workoutsCount === 5) return dayNum === 1 || dayNum === 2 || dayNum === 3 || dayNum === 5 || dayNum === 6;
    return dayNum !== 7; // 6 ngày
  };

  // Helper chọn bài tập an toàn
  const pickSafeExercises = (
    targetCategory: string,
    limit: number,
    muscleGroupFilter?: string
  ): WorkoutSessionExercise[] => {
    const list: WorkoutSessionExercise[] = [];
    for (const ex of exercises) {
      if (list.length >= limit) break;

      // Kiểm tra xem bài có bị chống chỉ định không
      let isRestricted = false;
      let subReason = '';

      // 1. Kiểm tra chế độ Ký túc xá / phòng trọ (ít ồn)
      if (dormitoryMode && !ex.isQuietFriendly) {
        isRestricted = true;
        subReason = 'Thay bằng bài tập không nhảy để tránh gây tiếng ồn trong phòng trọ/ký túc xá.';
      }

      // 2. Kiểm tra cảnh báo sức khỏe & khuyến cáo bác sĩ
      if (safety.overallTier === 'caution' || safety.overallTier === 'high_alert') {
        if (!ex.isLowImpact) {
          isRestricted = true;
          subReason = 'Thay bằng bài tập ít va đập để bảo vệ hệ tim mạch và xương khớp theo khuyến cáo.';
        }
      }

      // 3. Kiểm tra hạn chế khớp gối
      const hasKneeAlert = safety.alerts.some(a => a.id.includes('knee'));
      if (hasKneeAlert && ex.contraindications.includes('knee_pain')) {
        isRestricted = true;
        subReason = 'Thay bài dồn tải khớp gối theo ghi nhận khuyến cáo của bác sĩ.';
      }

      // 4. Kiểm tra hạn chế lưng dưới
      const hasBackAlert = safety.alerts.some(a => a.id.includes('back'));
      if (hasBackAlert && ex.contraindications.includes('back_pain')) {
        isRestricted = true;
        subReason = 'Thay bài uốn lưng bằng bài ổn định thân người (core stability) theo khuyến cáo bác sĩ.';
      }

      // Nếu bài bị hạn chế nhưng có bài thay thế:
      if (isRestricted) {
        if (ex.substituteExerciseId) {
          const subEx = exercises.find(e => e.id === ex.substituteExerciseId);
          if (subEx && !list.some(item => item.exerciseId === subEx.id)) {
            list.push({
              exerciseId: subEx.id,
              sets: Math.max(subEx.defaultSets - (safety.overallTier === 'high_alert' ? 1 : 0), 2),
              repsOrDuration: subEx.defaultRepsOrDuration,
              restSeconds: safety.overallTier === 'caution' ? subEx.restSeconds + 20 : subEx.restSeconds,
              completedSets: 0,
              isCompleted: false,
              wasSubstituted: true,
              originalExerciseId: ex.id,
              substitutionReason: subReason || ex.substituteReason || 'Điều chỉnh để phù hợp với thể trạng'
            });
          }
        }
        continue;
      }

      // Bài tập hợp lệ, kiểm tra nhóm cơ và thiết bị người dùng có
      const userHasEquip = ex.equipmentRequired.every(eq => 
        eq === 'none' || eq === 'chair' || profile.availableEquipment.includes(eq)
      );

      if (userHasEquip) {
        if (!muscleGroupFilter || ex.muscleGroups.some(m => m.toLowerCase().includes(muscleGroupFilter.toLowerCase()))) {
          list.push({
            exerciseId: ex.id,
            sets: Math.max(ex.defaultSets - (safety.overallTier === 'caution' ? 1 : 0), 2),
            repsOrDuration: ex.defaultRepsOrDuration,
            restSeconds: safety.overallTier === 'caution' ? ex.restSeconds + 20 : ex.restSeconds,
            completedSets: 0,
            isCompleted: false,
            wasSubstituted: false
          });
        }
      }
    }

    return list;
  };

  daysOfWeek.forEach(d => {
    const workoutActive = isWorkoutDay(d.num);
    if (!workoutActive) {
      days.push({
        dayOfWeek: d.num,
        dayName: d.name,
        isRestDay: true,
        focusArea: 'Nghỉ ngơi tích cực & Phục hồi cơ',
        estimatedMinutes: 15,
        difficulty: 'Dễ',
        warmupMinutes: 3,
        warmupDescription: 'Xoay khớp nhẹ nhàng và đi dạo 500 bước.',
        exercises: [],
        cooldownMinutes: 5,
        cooldownDescription: 'Giãn cơ bắp chuối, đùi trước và hít thở sâu thư giãn.',
        selectionReason: 'Cơ thể cần ngày nghỉ ngơi để sợi cơ tổng hợp phục hồi, giảm tích tụ vi chấn thương.',
        status: 'pending'
      });
      return;
    }

    // Xác định phân vùng bài tập theo ngày
    let focus = 'Toàn thân & Cơ lõi';
    let exList: WorkoutSessionExercise[] = [];
    let reason = 'Tập toàn thân với các bài tập kiểm soát trọng lượng cơ thể.';

    if (d.num === 1 || d.num === 2) {
      focus = 'Thân trên & Cơ lõi vững chắc';
      exList = pickSafeExercises('upper', 4, 'ngực');
      if (exList.length < 3) exList = pickSafeExercises('bodyweight', 4);
      reason = dormitoryMode 
        ? 'Ưu tiên bài tập thân trên êm ái, kiểm soát hơi thở không phát ra tiếng động.'
        : 'Tập trung cơ ngực, vai, tay và cơ bụng trung tâm.';
    } else if (d.num === 3 || d.num === 4) {
      focus = 'Thân dưới & Thăng bằng ít va đập';
      exList = pickSafeExercises('lower', 4, 'chân');
      if (exList.length < 3) exList = pickSafeExercises('bodyweight', 4);
      reason = safety.overallTier === 'caution'
        ? 'Thay bài nhảy bằng bài ngồi chạm ghế và nâng mông để bảo vệ khớp gối tối đa.'
        : 'Phát triển sức mạnh cơ đùi và hông vững chắc.';
    } else {
      focus = 'Sức bền & Phục hồi chức năng';
      exList = pickSafeExercises('recovery', 3);
      if (exList.length < 2) exList = pickSafeExercises('bodyweight', 3);
      reason = 'Tăng cường tuần hoàn máu, giải tỏa axit lactic tích tụ sau tuần tập luyện.';
    }

    days.push({
      dayOfWeek: d.num,
      dayName: d.name,
      isRestDay: false,
      focusArea: focus,
      estimatedMinutes: profile.sessionDurationMinutes || 30,
      difficulty: safety.overallTier === 'caution' ? 'Dễ' : 'Trung bình',
      warmupMinutes: 5,
      warmupDescription: 'Khởi động xoay cổ tay, cổ chân, vươn người và nâng gối chậm (5 phút).',
      exercises: exList,
      cooldownMinutes: 5,
      cooldownDescription: 'Giãn cơ tĩnh: kéo giãn đùi sau, cơ ngực và hạ nhịp tim về mức bình thường.',
      selectionReason: reason,
      status: 'pending'
    });
  });

  return days;
}

/**
 * Thuật toán đề xuất sản phẩm tiết kiệm và phù hợp
 * TUÂN THỦ NGHIÊM NGẶT:
 * 1. Kiểm tra an toàn trước
 * 2. Loại sản phẩm không phù hợp
 * 3. Loại sản phẩm người dùng đã có
 * 4. Mặc định SẮP XẾP THEO GIÁ TĂNG DẦN (Giá thấp đến cao)
 * 5. Báo cáo so sánh chi phí với phòng gym
 */
export function recommendProducts(
  catalog: ProductItem[],
  profile: UserProfile,
  safety: HealthSafetyAssessment,
  healthRecord?: HealthRecord | null,
  sortOrder: 'price_asc' | 'price_desc' | 'priority' = 'price_asc'
): {
  recommendedList: ProductItem[];
  filteredOutList: { product: ProductItem; reason: string }[];
  totalInvestmentVnd: number;
} {
  const recommended: ProductItem[] = [];
  const filteredOut: { product: ProductItem; reason: string }[] = [];

  for (const p of catalog) {
    // 1. Kiểm tra cảnh báo cao
    if (safety.overallTier === 'high_alert' && p.isRestrictedForHighAlert) {
      filteredOut.push({
        product: p,
        reason: 'Hệ thống đang có CẢNH BÁO CAO. Tạm ngừng đề xuất dụng cụ nặng hoặc thực phẩm bổ sung theo quy tắc an toàn.'
      });
      continue;
    }

    // 2. Kiểm tra đường huyết cao nếu có
    const glu = healthRecord?.fastingBloodGlucoseMgDl;
    if (glu && glu >= 126 && p.isRestrictedForHighGlucose) {
      filteredOut.push({
        product: p,
        reason: 'Chỉ số đường huyết đói cao (>= 126 mg/dL). Tuyệt đối không đề xuất sản phẩm bổ sung chứa nhiều đường tự do.'
      });
      continue;
    }

    // 3. Kiểm tra sản phẩm người dùng đã có
    if (profile.availableEquipment.includes(p.category)) {
      filteredOut.push({
        product: p,
        reason: 'Bạn đã sở hữu dụng cụ này trong hồ sơ trang bị.'
      });
      continue;
    }

    // 4. Kiểm tra chế độ ký túc xá
    if (profile.dormitoryMode && !p.isDormFriendly) {
      filteredOut.push({
        product: p,
        reason: 'Sản phẩm cồng kềnh, không phù hợp không gian hẹp hoặc ký túc xá.'
      });
      continue;
    }

    // 5. Kiểm tra ngân sách
    if (profile.equipmentBudgetVnd > 0 && p.priceVnd > profile.equipmentBudgetVnd * 1.5) {
      filteredOut.push({
        product: p,
        reason: 'Vượt quá ngưỡng ngân sách dự kiến của bạn.'
      });
      continue;
    }

    recommended.push(p);
  }

  // Sắp xếp: Mặc định giá thấp đến cao
  if (sortOrder === 'price_asc') {
    recommended.sort((a, b) => a.priceVnd - b.priceVnd);
  } else if (sortOrder === 'price_desc') {
    recommended.sort((a, b) => b.priceVnd - a.priceVnd);
  } else if (sortOrder === 'priority') {
    const priorityWeight = { essential: 1, recommended: 2, optional: 3 };
    recommended.sort((a, b) => priorityWeight[a.necessityLevel] - priorityWeight[b.necessityLevel]);
  }

  const totalInvestmentVnd = recommended
    .filter(p => p.necessityLevel === 'essential' || p.necessityLevel === 'recommended')
    .reduce((sum, p) => sum + p.priceVnd, 0);

  return {
    recommendedList: recommended,
    filteredOutList: filteredOut,
    totalInvestmentVnd
  };
}

/**
 * Tính toán so sánh chi phí: Tập tại nhà (DISCI) vs Tập Gym truyền thống
 */
export function calculateCostComparison(
  initialEquipmentVnd: number,
  monthlySupplementsVnd: number,
  gymMonthlyFeeVnd: number = 450000,
  ptMonthlyFeeVnd: number = 0,
  commuteMonthlyFeeVnd: number = 150000,
  months: number = 6
): {
  homeTotalCost: number;
  gymTotalCost: number;
  savingsVnd: number;
  savingsPercent: number;
  homeBreakdown: { initial: number; recurring: number };
  gymBreakdown: { membership: number; pt: number; commute: number };
} {
  const homeTotalCost = initialEquipmentVnd + (monthlySupplementsVnd * months);
  const gymMembership = gymMonthlyFeeVnd * months;
  const gymPt = ptMonthlyFeeVnd * months;
  const gymCommute = commuteMonthlyFeeVnd * months;
  const gymTotalCost = gymMembership + gymPt + gymCommute;

  const savingsVnd = Math.max(gymTotalCost - homeTotalCost, 0);
  const savingsPercent = gymTotalCost > 0 ? Math.round((savingsVnd / gymTotalCost) * 100) : 0;

  return {
    homeTotalCost,
    gymTotalCost,
    savingsVnd,
    savingsPercent,
    homeBreakdown: {
      initial: initialEquipmentVnd,
      recurring: monthlySupplementsVnd * months
    },
    gymBreakdown: {
      membership: gymMembership,
      pt: gymPt,
      commute: gymCommute
    }
  };
}

/**
 * Tính toán mục tiêu dinh dưỡng theo TDEE và mục tiêu tập luyện
 */
export function calculateNutritionTargets(
  tdee: number,
  weightKg: number,
  goal: 'muscle_gain' | 'fat_loss' | 'endurance' | 'general_health'
): {
  calorieTarget: number;
  proteinGramsTarget: number;
  explanation: string;
} {
  if (!tdee || !weightKg) {
    return {
      calorieTarget: 2000,
      proteinGramsTarget: 80,
      explanation: 'Dữ liệu ước tính chuẩn mặc định.'
    };
  }

  let deltaCal = 0;
  let proteinRatio = 1.2; // g/kg

  switch (goal) {
    case 'fat_loss':
      deltaCal = -400; // TDEE - 400 kcal
      proteinRatio = 1.4; // bảo toàn cơ bắp
      break;
    case 'muscle_gain':
      deltaCal = 300; // TDEE + 300 kcal
      proteinRatio = 1.6; // phát triển sợi cơ
      break;
    case 'endurance':
      deltaCal = 100; // TDEE + 100 kcal
      proteinRatio = 1.3;
      break;
    case 'general_health':
    default:
      deltaCal = 0;
      proteinRatio = 1.1;
      break;
  }

  const calorieTarget = Math.max(tdee + deltaCal, 1200);
  const proteinGramsTarget = Math.round(weightKg * proteinRatio);

  return {
    calorieTarget,
    proteinGramsTarget,
    explanation: `Mục tiêu ${goal === 'fat_loss' ? 'giảm mỡ' : goal === 'muscle_gain' ? 'tăng cơ' : 'rèn luyện sức khỏe'}: Điều chỉnh ${deltaCal >= 0 ? '+' : ''}${deltaCal} kcal so với TDEE (${tdee} kcal). Lượng đạm ${proteinRatio}g/kg cân nặng.`
  };
}
