import {
  UserProfile,
  BodyMetricRecord,
  HealthRecord,
  WorkoutDayPlan,
  WorkoutSessionLog,
  DailyRecoveryCheckin,
  CartItem,
  OrderRecord,
  CommunityUser,
  CommunityPost,
  CommunityComment,
  CommunityGroup,
  CommunityChallenge,
  CommunityNotification,
  ContentReport,
  BadgeItem
} from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_BODY_METRICS,
  INITIAL_HEALTH_RECORD,
  EXERCISE_LIBRARY,
  COMMUNITY_USERS,
  INITIAL_COMMUNITY_POSTS,
  COMMUNITY_GROUPS,
  COMMUNITY_CHALLENGES,
  COMMUNITY_BADGES,
  COMMUNITY_NOTIFICATIONS
} from '../data/mockData';
import { generateWeeklySchedule, evaluateHealthSafety } from '../utils/rules';
import { toggleCheerPost } from '../utils/communityRules';

const STORAGE_KEYS = {
  PROFILE: 'disci_user_profile_v1',
  METRICS: 'disci_body_metrics_v1',
  HEALTH_RECORD: 'disci_health_record_v1',
  WORKOUT_SCHEDULE: 'disci_workout_schedule_v1',
  WORKOUT_LOGS: 'disci_workout_logs_v1',
  RECOVERY_CHECKINS: 'disci_recovery_checkins_v1',
  CART: 'disci_cart_items_v1',
  ORDERS: 'disci_orders_v1',
  DORMITORY_MODE: 'disci_dormitory_mode_v1',
  CONSENT_SETTINGS: 'disci_consent_settings_v1',
  SYNC_TIMESTAMP: 'disci_last_sync_timestamp_v1',
  COMMUNITY_POSTS: 'disci_community_posts_v1',
  COMMUNITY_USERS: 'disci_community_users_v1',
  COMMUNITY_GROUPS: 'disci_community_groups_v1',
  COMMUNITY_CHALLENGES: 'disci_community_challenges_v1',
  COMMUNITY_BADGES: 'disci_community_badges_v1',
  COMMUNITY_NOTIFICATIONS: 'disci_community_notifications_v1',
  CONTENT_REPORTS: 'disci_content_reports_v1',
  BLOCKED_USERS: 'disci_blocked_users_v1'
};

export class StorageService {
  /**
   * Lấy hồ sơ người dùng
   */
  static getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc profile từ localStorage:', e);
    }
    this.saveProfile(INITIAL_USER_PROFILE);
    return INITIAL_USER_PROFILE;
  }

  static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Lỗi lưu profile:', e);
    }
  }

  /**
   * Lấy lịch sử chỉ số cơ thể
   */
  static getBodyMetrics(): BodyMetricRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc body metrics:', e);
    }
    this.saveBodyMetrics(INITIAL_BODY_METRICS);
    return INITIAL_BODY_METRICS;
  }

  static saveBodyMetrics(metrics: BodyMetricRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
    } catch (e) {
      console.error('Lỗi lưu body metrics:', e);
    }
  }

  static addBodyMetric(metric: BodyMetricRecord): BodyMetricRecord[] {
    const list = this.getBodyMetrics();
    const updated = [metric, ...list];
    this.saveBodyMetrics(updated);

    // Cập nhật lại cân nặng mới nhất vào profile
    const profile = this.getProfile();
    profile.weightKg = metric.weightKg;
    profile.updatedAt = new Date().toISOString();
    this.saveProfile(profile);

    return updated;
  }

  static deleteBodyMetric(id: string): BodyMetricRecord[] {
    const list = this.getBodyMetrics().filter(m => m.id !== id);
    this.saveBodyMetrics(list);
    return list;
  }

  /**
   * Hồ sơ kết quả khám sức khỏe
   */
  static getHealthRecord(): HealthRecord | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORD);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc health record:', e);
    }
    this.saveHealthRecord(INITIAL_HEALTH_RECORD);
    return INITIAL_HEALTH_RECORD;
  }

  static saveHealthRecord(record: HealthRecord | null): void {
    try {
      if (record) {
        localStorage.setItem(STORAGE_KEYS.HEALTH_RECORD, JSON.stringify(record));
      } else {
        localStorage.removeItem(STORAGE_KEYS.HEALTH_RECORD);
      }
    } catch (e) {
      console.error('Lỗi lưu health record:', e);
    }
  }

  /**
   * Lịch tập 7 ngày
   */
  static getWorkoutSchedule(): WorkoutDayPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUT_SCHEDULE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc workout schedule:', e);
    }

    // Tự động khởi tạo lịch tuần dựa trên profile và an toàn
    const profile = this.getProfile();
    const health = this.getHealthRecord();
    const metrics = this.getBodyMetrics();
    const latestMetric = metrics[0] || { weightKg: profile.weightKg, heightCm: profile.heightCm };
    const safety = evaluateHealthSafety(
      { weightKg: latestMetric.weightKg, heightCm: profile.heightCm, systolicBp: latestMetric.systolicBp, diastolicBp: latestMetric.diastolicBp, restingHeartRate: latestMetric.restingHeartRate },
      metrics[1] ? { weightKg: metrics[1].weightKg } : undefined,
      health,
      health?.consentGrantedForWorkoutPersonalization ?? false
    );

    const schedule = generateWeeklySchedule(profile, safety, EXERCISE_LIBRARY, profile.dormitoryMode);
    this.saveWorkoutSchedule(schedule);
    return schedule;
  }

  static saveWorkoutSchedule(schedule: WorkoutDayPlan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.error('Lỗi lưu workout schedule:', e);
    }
  }

  /**
   * Nhật ký các buổi tập đã hoàn thành
   */
  static getWorkoutLogs(): WorkoutSessionLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc workout logs:', e);
    }
    return [
      {
        id: 'log_01',
        date: '2026-10-18T08:30:00.000Z',
        dayOfWeek: 1,
        durationMinutes: 32,
        rpeRating: 6,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        userNotes: 'Tập vào bàn chống đẩy rất êm, không đau cổ tay.',
        completedExercisesCount: 4
      },
      {
        id: 'log_02',
        date: '2026-10-20T08:30:00.000Z',
        dayOfWeek: 3,
        durationMinutes: 30,
        rpeRating: 7,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        userNotes: 'Bài box squat ngồi chạm ghế giúp khớp gối không bị nhức.',
        completedExercisesCount: 4
      }
    ];
  }

  static saveWorkoutLogs(logs: WorkoutSessionLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Lỗi lưu workout logs:', e);
    }
  }

  static addWorkoutLog(log: WorkoutSessionLog): WorkoutSessionLog[] {
    const list = this.getWorkoutLogs();
    const updated = [log, ...list];
    this.saveWorkoutLogs(updated);
    return updated;
  }

  /**
   * Check-in phục hồi hằng ngày
   */
  static getRecoveryCheckins(): DailyRecoveryCheckin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECOVERY_CHECKINS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc recovery checkins:', e);
    }
    return [
      {
        id: 'chk_01',
        date: '2026-10-21',
        sleepQuality: 'du',
        muscleSoreness: 'nhe',
        fatigueLevel: 'on',
        systemAdjustmentResult: 'keep_schedule',
        adjustmentExplanation: 'Phục hồi tốt, giữ nguyên lịch tập hôm nay.',
        completedAt: '2026-10-21T07:00:00.000Z'
      }
    ];
  }

  static saveRecoveryCheckins(checkins: DailyRecoveryCheckin[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECOVERY_CHECKINS, JSON.stringify(checkins));
    } catch (e) {
      console.error('Lỗi lưu recovery checkins:', e);
    }
  }

  static addRecoveryCheckin(checkin: DailyRecoveryCheckin): DailyRecoveryCheckin[] {
    const list = this.getRecoveryCheckins();
    const updated = [checkin, ...list.filter(c => c.date !== checkin.date)];
    this.saveRecoveryCheckins(updated);
    return updated;
  }

  /**
   * Giỏ hàng và Đơn hàng
   */
  static getCartItems(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc cart items:', e);
    }
    return [];
  }

  static saveCartItems(items: CartItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
    } catch (e) {
      console.error('Lỗi lưu cart items:', e);
    }
  }

  static getOrders(): OrderRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc orders:', e);
    }
    return [];
  }

  static saveOrders(orders: OrderRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Lỗi lưu orders:', e);
    }
  }

  static addOrder(order: OrderRecord): OrderRecord[] {
    const orders = [order, ...this.getOrders()];
    this.saveOrders(orders);
    this.saveCartItems([]); // Xóa giỏ hàng sau khi đặt thành công
    return orders;
  }

  /**
   * ==========================================
   * PHÂN HỆ CỘNG ĐỒNG DISCI - LƯU TRỮ VÀ XỬ LÝ
   * ==========================================
   */

  /**
   * Bài viết cộng đồng (Community Posts)
   */
  static getCommunityPosts(): CommunityPost[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc community posts:', e);
    }
    this.saveCommunityPosts(INITIAL_COMMUNITY_POSTS);
    return INITIAL_COMMUNITY_POSTS;
  }

  static saveCommunityPosts(posts: CommunityPost[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(posts));
    } catch (e) {
      console.error('Lỗi lưu community posts:', e);
    }
  }

  static addCommunityPost(post: CommunityPost): CommunityPost[] {
    const list = this.getCommunityPosts();
    const updated = [post, ...list];
    this.saveCommunityPosts(updated);
    return updated;
  }

  static updateCommunityPost(post: CommunityPost): CommunityPost[] {
    const list = this.getCommunityPosts();
    const updated = list.map(p => (p.id === post.id ? post : p));
    this.saveCommunityPosts(updated);
    return updated;
  }

  static deleteCommunityPost(postId: string): CommunityPost[] {
    const list = this.getCommunityPosts().filter(p => p.id !== postId);
    this.saveCommunityPosts(list);
    return list;
  }

  static togglePostCheer(postId: string, userId: string): CommunityPost[] {
    const list = this.getCommunityPosts();
    const updated = list.map(p => {
      if (p.id === postId) {
        return toggleCheerPost(p, userId);
      }
      return p;
    });
    this.saveCommunityPosts(updated);
    return updated;
  }

  static addCommentToPost(postId: string, comment: CommunityComment): CommunityPost[] {
    const list = this.getCommunityPosts();
    const updated = list.map(p => {
      if (p.id === postId) {
        const comments = p.comments || [];
        const newComments = [...comments, comment];
        return {
          ...p,
          comments: newComments,
          commentsCount: newComments.length
        };
      }
      return p;
    });
    this.saveCommunityPosts(updated);
    return updated;
  }

  static deleteCommentFromPost(postId: string, commentId: string): CommunityPost[] {
    const list = this.getCommunityPosts();
    const updated = list.map(p => {
      if (p.id === postId) {
        const newComments = (p.comments || []).filter(c => c.id !== commentId);
        return {
          ...p,
          comments: newComments,
          commentsCount: newComments.length
        };
      }
      return p;
    });
    this.saveCommunityPosts(updated);
    return updated;
  }

  /**
   * Người dùng và Bạn bè (Community Users & Friendships)
   */
  static getCommunityUsers(): CommunityUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc community users:', e);
    }
    this.saveCommunityUsers(COMMUNITY_USERS);
    return COMMUNITY_USERS;
  }

  static saveCommunityUsers(users: CommunityUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Lỗi lưu community users:', e);
    }
  }

  static updateFriendStatus(
    userId: string,
    friendRequestStatus: 'none' | 'pending_sent' | 'pending_received',
    isFriend: boolean
  ): CommunityUser[] {
    const users = this.getCommunityUsers().map(u => {
      if (u.id === userId) {
        return { ...u, friendRequestStatus, isFriend };
      }
      return u;
    });
    this.saveCommunityUsers(users);
    return users;
  }

  /**
   * Danh sách người dùng bị chặn (Blocked Users)
   */
  static getBlockedUserIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc blocked users:', e);
    }
    return [];
  }

  static saveBlockedUserIds(ids: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(ids));
    } catch (e) {
      console.error('Lỗi lưu blocked users:', e);
    }
  }

  static blockUser(userId: string): { blockedIds: string[]; users: CommunityUser[] } {
    const blocked = this.getBlockedUserIds();
    const updatedBlocked = Array.from(new Set([...blocked, userId]));
    this.saveBlockedUserIds(updatedBlocked);

    const users = this.getCommunityUsers().map(u => {
      if (u.id === userId) {
        return { ...u, isBlocked: true, isFriend: false, friendRequestStatus: 'none' as const };
      }
      return u;
    });
    this.saveCommunityUsers(users);

    return { blockedIds: updatedBlocked, users };
  }

  static unblockUser(userId: string): { blockedIds: string[]; users: CommunityUser[] } {
    const blocked = this.getBlockedUserIds().filter(id => id !== userId);
    this.saveBlockedUserIds(blocked);

    const users = this.getCommunityUsers().map(u => {
      if (u.id === userId) {
        return { ...u, isBlocked: false };
      }
      return u;
    });
    this.saveCommunityUsers(users);

    return { blockedIds: blocked, users };
  }

  /**
   * Nhóm tập luyện (Workout Groups)
   */
  static getCommunityGroups(): CommunityGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_GROUPS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc community groups:', e);
    }
    this.saveCommunityGroups(COMMUNITY_GROUPS);
    return COMMUNITY_GROUPS;
  }

  static saveCommunityGroups(groups: CommunityGroup[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.error('Lỗi lưu community groups:', e);
    }
  }

  static createCommunityGroup(group: CommunityGroup): CommunityGroup[] {
    const groups = [group, ...this.getCommunityGroups()];
    this.saveCommunityGroups(groups);
    return groups;
  }

  static toggleJoinGroup(groupId: string, userId: string): CommunityGroup[] {
    const groups = this.getCommunityGroups().map(g => {
      if (g.id === groupId) {
        const isMember = g.isUserMember;
        const newMembers = isMember
          ? g.memberIds.filter(id => id !== userId)
          : [...g.memberIds, userId];
        return {
          ...g,
          isUserMember: !isMember,
          memberIds: newMembers,
          membersCount: newMembers.length
        };
      }
      return g;
    });
    this.saveCommunityGroups(groups);
    return groups;
  }

  /**
   * Thử thách cộng đồng (Community Challenges)
   */
  static getCommunityChallenges(): CommunityChallenge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_CHALLENGES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc community challenges:', e);
    }
    this.saveCommunityChallenges(COMMUNITY_CHALLENGES);
    return COMMUNITY_CHALLENGES;
  }

  static saveCommunityChallenges(challenges: CommunityChallenge[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_CHALLENGES, JSON.stringify(challenges));
    } catch (e) {
      console.error('Lỗi lưu community challenges:', e);
    }
  }

  static toggleJoinChallenge(challengeId: string): CommunityChallenge[] {
    const challenges = this.getCommunityChallenges().map(c => {
      if (c.id === challengeId) {
        const nextJoined = !c.isJoined;
        return {
          ...c,
          isJoined: nextJoined,
          participantsCount: nextJoined ? c.participantsCount + 1 : Math.max(0, c.participantsCount - 1)
        };
      }
      return c;
    });
    this.saveCommunityChallenges(challenges);
    return challenges;
  }

  /**
   * Huy hiệu thành tích (Badges)
   */
  static getCommunityBadges(): BadgeItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_BADGES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc community badges:', e);
    }
    this.saveCommunityBadges(COMMUNITY_BADGES);
    return COMMUNITY_BADGES;
  }

  static saveCommunityBadges(badges: BadgeItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_BADGES, JSON.stringify(badges));
    } catch (e) {
      console.error('Lỗi lưu community badges:', e);
    }
  }

  static toggleBadgeVisibility(badgeId: string): BadgeItem[] {
    const badges = this.getCommunityBadges().map(b => {
      if (b.id === badgeId) {
        return { ...b, isPublic: !b.isPublic };
      }
      return b;
    });
    this.saveCommunityBadges(badges);
    return badges;
  }

  /**
   * Thông báo cộng đồng (Community Notifications)
   */
  static getCommunityNotifications(): CommunityNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc community notifications:', e);
    }
    this.saveCommunityNotifications(COMMUNITY_NOTIFICATIONS);
    return COMMUNITY_NOTIFICATIONS;
  }

  static saveCommunityNotifications(notifs: CommunityNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_NOTIFICATIONS, JSON.stringify(notifs));
    } catch (e) {
      console.error('Lỗi lưu community notifications:', e);
    }
  }

  static markNotificationAsRead(id: string): CommunityNotification[] {
    const list = this.getCommunityNotifications().map(n => {
      if (n.id === id) return { ...n, isRead: true };
      return n;
    });
    this.saveCommunityNotifications(list);
    return list;
  }

  static markAllNotificationsAsRead(): CommunityNotification[] {
    const list = this.getCommunityNotifications().map(n => ({ ...n, isRead: true }));
    this.saveCommunityNotifications(list);
    return list;
  }

  /**
   * Báo cáo vi phạm nội dung (Content Reports - Mục 43)
   */
  static getContentReports(): ContentReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTENT_REPORTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Lỗi đọc content reports:', e);
    }
    return [];
  }

  static submitContentReport(report: ContentReport): ContentReport[] {
    const list = [report, ...this.getContentReports()];
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT_REPORTS, JSON.stringify(list));
    } catch (e) {
      console.error('Lỗi lưu report:', e);
    }
    return list;
  }

  /**
   * Xuất toàn bộ dữ liệu người dùng ra JSON (Quyền riêng tư Mục 36)
   */
  static exportAllUserData(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      appVersion: 'DISCI v1.0.0 (MVP+ Community)',
      profile: this.getProfile(),
      bodyMetrics: this.getBodyMetrics(),
      healthRecord: this.getHealthRecord(),
      workoutSchedule: this.getWorkoutSchedule(),
      workoutLogs: this.getWorkoutLogs(),
      recoveryCheckins: this.getRecoveryCheckins(),
      orders: this.getOrders(),
      communityPosts: this.getCommunityPosts(),
      communityGroups: this.getCommunityGroups(),
      communityChallenges: this.getCommunityChallenges(),
      communityBadges: this.getCommunityBadges()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Xóa toàn bộ dữ liệu ứng dụng hoặc xóa riêng hồ sơ khám (Mục 36)
   */
  static clearHealthRecordsOnly(): void {
    localStorage.removeItem(STORAGE_KEYS.HEALTH_RECORD);
  }

  static resetAllData(): void {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
}
