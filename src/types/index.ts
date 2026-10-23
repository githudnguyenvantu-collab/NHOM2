/**
 * DISCI - Core Type Definitions
 * Designed for personalized home workout, safety tiers, and budget equipment in Vietnam.
 */

export type WorkoutGoal = 'muscle_gain' | 'fat_loss' | 'endurance' | 'general_health';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

export type SpaceType = 'dorm_small' | 'bedroom' | 'living_room' | 'outdoor_park';

export type SafetyTier = 'good_progress' | 'caution' | 'high_alert';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  workoutGoal: WorkoutGoal;
  workoutsPerWeek: number;
  sessionDurationMinutes: number;
  activityLevel: ActivityLevel;
  spaceType: SpaceType;
  dormitoryMode: boolean; // Tập trong không gian nhỏ - ít tiếng ồn
  availableEquipment: string[]; // e.g. ['bodyweight', 'resistance_band', 'dumbbell_pair']
  equipmentBudgetVnd: number;
  selfReportedRestrictions: string[]; // e.g. ['Đau lưng dưới nhẹ', 'Khớp gối cần chú ý']
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BodyMetricRecord {
  id: string;
  date: string; // ISO string
  weightKg: number;
  restingHeartRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  bmi: number;
  safetyTier: SafetyTier;
  source: 'manual' | 'device_sync';
  notes?: string;
  flaggedWeightJump?: boolean; // > 2kg change alert
}

export interface HealthRecord {
  id: string;
  checkupDate: string;
  clinicFacility: string;
  systolicBp: number;
  diastolicBp: number;
  restingHeartRate: number;
  fastingBloodGlucoseMgDl?: number;
  totalCholesterolMgDl?: number;
  ldlCholesterolMgDl?: number;
  triglyceridesMgDl?: number;
  musculoskeletalNotes?: string;
  doctorExerciseRecommendation?: string; // e.g. "Chỉ tập nhẹ, không chạy nhảy" or "Lưu ý khớp gối"
  doctorHaltExercise: boolean;
  notes?: string;
  fileAttachmentName?: string;
  consentGrantedForWorkoutPersonalization: boolean;
  updatedAt: string;
}

export interface HealthSafetyAlert {
  id: string;
  metric: string;
  value: string;
  threshold: string;
  tier: SafetyTier;
  reason: string;
  workoutImpact: string;
  substituteGuidance: string;
  nextAction: string;
  updatedAt: string;
}

export interface HealthSafetyAssessment {
  overallTier: SafetyTier;
  alerts: HealthSafetyAlert[];
  doctorOverrideActive: boolean;
  canExerciseSafely: boolean;
  summaryAdvice: string;
}

export interface ExerciseItem {
  id: string;
  nameVi: string;
  nameEn: string;
  muscleGroups: string[];
  equipmentRequired: string[]; // 'none', 'resistance_band', 'dumbbell', 'chair', 'pull_up_bar'
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isQuietFriendly: boolean; // Ký túc xá / phòng trọ
  isLowImpact: boolean; // Không tạo áp lực khớp gối/cột sống
  category: 'home' | 'outdoor' | 'bodyweight' | 'band' | 'dumbbell' | 'pullup' | 'cardio_walk' | 'recovery';
  stepByStepInstructions: string[];
  correctFormCues: string[];
  commonMistakes: string[];
  breathingTechnique: string;
  defaultSets: number;
  defaultRepsOrDuration: string; // e.g. "10-12 lần" or "45 giây"
  restSeconds: number;
  safetyNotes: string;
  contraindications: string[]; // when NOT to do it (e.g. 'knee_pain', 'high_bp')
  substituteExerciseId?: string;
  substituteReason?: string;
  imageUrl?: string;
}

export interface WorkoutSessionExercise {
  exerciseId: string;
  sets: number;
  repsOrDuration: string;
  restSeconds: number;
  completedSets: number;
  isCompleted: boolean;
  wasSubstituted: boolean;
  originalExerciseId?: string;
  substitutionReason?: string;
}

export interface WorkoutDayPlan {
  dayOfWeek: number; // 1 = Thứ 2, 7 = Chủ nhật
  dayName: string; // "Thứ Hai"
  isRestDay: boolean;
  focusArea: string; // "Toàn thân & Cơ lõi", "Phần dưới ít va đập", "Nghỉ ngơi tích cực"
  estimatedMinutes: number;
  difficulty: 'Dễ' | 'Trung bình' | 'Thử thách';
  warmupMinutes: number;
  warmupDescription: string;
  exercises: WorkoutSessionExercise[];
  cooldownMinutes: number;
  cooldownDescription: string;
  selectionReason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  skipReason?: string;
}

export interface WorkoutSessionLog {
  id: string;
  date: string;
  dayOfWeek: number;
  durationMinutes: number;
  rpeRating: number; // 1 - 10
  completionRatePercent: number;
  reportedPain: boolean;
  painLocation?: string;
  reportedFatigue: boolean;
  userNotes?: string;
  completedExercisesCount: number;
}

export interface DailyRecoveryCheckin {
  id: string;
  date: string;
  sleepQuality: 'du' | 'it'; // Đủ / Ít
  muscleSoreness: 'khong' | 'nhe' | 'nhieu'; // Không / Nhẹ / Nhiều
  fatigueLevel: 'on' | 'met'; // Ổn / Mệt
  systemAdjustmentResult: 'keep_schedule' | 'reduce_intensity' | 'light_recovery' | 'mandatory_rest';
  adjustmentExplanation: string;
  completedAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'band' | 'dumbbell' | 'pullup' | 'mat' | 'support' | 'treadmill' | 'nutrition';
  priceVnd: number;
  updatedDate: string;
  image: string;
  description: string;
  suitableFor: string;
  safetyNotes: string;
  necessityLevel: 'essential' | 'recommended' | 'optional';
  recommendationReason: string;
  isRestrictedForHighAlert: boolean;
  isRestrictedForHighGlucose: boolean;
  isDormFriendly: boolean;
  isDemoData: boolean;
}

export interface CostComparisonConfig {
  initialEquipmentCost: number;
  monthlySupplementsCost: number;
  gymMonthlyFee: number;
  ptMonthlyFee: number;
  commuteMonthlyFee: number;
  monthsCalculated: number;
}

export interface CartItem {
  productId: string;
  product: ProductItem;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  items: CartItem[];
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  paymentMethod: 'cod' | 'vietqr' | 'momo';
  paymentStatus: 'pending' | 'paid';
  deliveryStatus: 'processing' | 'shipping' | 'delivered';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
  };
  createdAt: string;
}

export interface MealItem {
  name: string;
  portion: string;
  caloriesKcal: number;
  proteinGrams: number;
  costVnd: number;
  notes: string;
}

export interface DayNutritionPlan {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
  totalCalories: number;
  totalProteinGrams: number;
  estimatedDailyCostVnd: number;
  calorieTarget: number;
  proteinTarget: number;
}

export interface CommunityUser {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  workoutGoal: string;
  streakDays: number;
  badges: string[];
  isFriend: boolean;
  friendRequestStatus: 'none' | 'pending_sent' | 'pending_received';
  isBlocked: boolean;
  mutualFriendsCount: number;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorGoal: string;
  createdAt: string;
  timestamp: number;
  caption: string;
  mediaUrl?: string;
  attachedWorkout?: {
    title: string;
    durationMinutes: number;
    completedExercisesCount: number;
    date: string;
  };
  attachedBadge?: {
    id: string;
    name: string;
    icon: string;
  };
  streakDays: number;
  likesCount: number;
  userHasLiked: boolean;
  cheeredUserIds: string[];
  commentsCount: number;
  comments: CommunityComment[];
  privacy: 'public' | 'friends' | 'only_me';
  groupId?: string;
  groupName?: string;
  isHidden?: boolean;
  isReported?: boolean;
  attachedWeight?: number; // Only shown if user actively toggles it on (never default!)
}

export interface CommunityGroup {
  id: string;
  name: string;
  coverImage: string;
  description: string;
  isPrivate: boolean;
  membersCount: number;
  memberIds: string[];
  adminIds: string[];
  rules: string[];
  currentChallenge?: string;
  createdAt: string;
  isUserMember: boolean;
  pendingJoinRequest: boolean;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  image: string;
  description: string;
  goalDescription: string;
  startDate: string;
  endDate: string;
  targetType: 'workouts_count' | 'active_minutes' | 'streak_days';
  targetValue: number;
  currentProgress: number;
  isJoined: boolean;
  isCompleted: boolean;
  participantsCount: number;
  participantAvatars: string[];
  badgeReward: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  score: number;
  unitLabel: string;
  badgeTitle: string;
  isCurrentUser: boolean;
}

export interface CommunityNotification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'post_cheer' | 'post_comment' | 'group_invite' | 'challenge_milestone' | 'badge_earned';
  title: string;
  description: string;
  createdAt: string;
  timestamp: number;
  isRead: boolean;
  targetTab: 'feed' | 'friends' | 'groups' | 'challenges' | 'badges';
  targetId?: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'group' | 'user';
  targetId: string;
  reason: string;
  details: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  unlockedAt?: string;
  isPublic: boolean;
  isUnlocked: boolean;
}

export interface TraceabilityItem {
  sectionNumber: number;
  sectionTitle: string;
  originalRequirement: string;
  implementedFeature: string;
  relatedScreen: string;
  codeModule: string;
  status: 'completed' | 'post_mvp_ready' | 'external_integration_adapter';
  verificationMethod: string;
  notes: string;
}
