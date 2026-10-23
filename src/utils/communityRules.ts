/**
 * Pure functions and business logic for DISCI Community Subsystem
 * Guaranteed decoupled, testable with node:test.
 */

import {
  CommunityPost,
  CommunityUser,
  CommunityChallenge,
  LeaderboardEntry,
  WorkoutSessionLog,
  DailyRecoveryCheckin,
  BadgeItem
} from '../types';

/**
 * Kiểm tra xem người xem có được phép xem bài viết hay không
 * Tuân thủ 3 mức quyền riêng tư:
 * - 'only_me': chỉ tác giả
 * - 'friends': tác giả hoặc bạn bè
 * - 'public': tất cả (trừ khi bị chặn)
 */
export function canUserViewPost(
  post: CommunityPost,
  viewerId: string,
  viewerFriendIds: string[],
  blockedUserIds: string[]
): boolean {
  // Nếu bài bị ẩn do người dùng chọn ẩn
  if (post.isHidden) return false;

  // Nếu tác giả nằm trong danh sách chặn hoặc đã chặn người xem
  if (blockedUserIds.includes(post.authorId)) return false;

  // Nếu là chính tác giả
  if (post.authorId === viewerId) return true;

  // Quyền 'only_me' -> người khác không được xem
  if (post.privacy === 'only_me') return false;

  // Quyền 'friends' -> chỉ bạn bè được xem
  if (post.privacy === 'friends') {
    return viewerFriendIds.includes(post.authorId);
  }

  // Quyền 'public' -> xem được
  return true;
}

/**
 * Lọc và sắp xếp bài viết cho bảng tin của người dùng
 */
export function filterPostsForUser(
  posts: CommunityPost[],
  currentUserId: string,
  friendIds: string[],
  blockedUserIds: string[],
  feedFilter: 'all' | 'friends' | 'groups',
  userGroupIds: string[] = []
): CommunityPost[] {
  return posts
    .filter(post => {
      // Kiểm tra quyền xem cơ bản và danh sách chặn
      if (!canUserViewPost(post, currentUserId, friendIds, blockedUserIds)) {
        return false;
      }

      // Bộ lọc danh mục
      if (feedFilter === 'friends') {
        return post.authorId === currentUserId || friendIds.includes(post.authorId);
      }
      if (feedFilter === 'groups') {
        return post.groupId ? userGroupIds.includes(post.groupId) : false;
      }

      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Cổ vũ / Bỏ cổ vũ bài viết (Đảm bảo tính duy nhất Idempotent)
 */
export function toggleCheerPost(
  post: CommunityPost,
  userId: string
): CommunityPost {
  const cheeredIds = post.cheeredUserIds || [];
  const alreadyCheered = cheeredIds.includes(userId);

  let updatedCheeredIds: string[];
  if (alreadyCheered) {
    updatedCheeredIds = cheeredIds.filter(id => id !== userId);
  } else {
    updatedCheeredIds = [...cheeredIds, userId];
  }

  return {
    ...post,
    cheeredUserIds: updatedCheeredIds,
    likesCount: updatedCheeredIds.length,
    userHasLiked: !alreadyCheered
  };
}

/**
 * Tính toán chuỗi ngày kiên trì (streak) từ nhật ký tập và check-in phục hồi thực tế
 */
export function calculateUserStreak(
  workoutLogs: WorkoutSessionLog[],
  recoveryCheckins: DailyRecoveryCheckin[] = []
): number {
  // Tập hợp các ngày có hoạt động (YYYY-MM-DD)
  const activeDates = new Set<string>();

  workoutLogs.forEach(log => {
    try {
      const dateStr = log.date.split('T')[0];
      if (dateStr) activeDates.add(dateStr);
    } catch {
      // ignore parsing error
    }
  });

  recoveryCheckins.forEach(chk => {
    try {
      const dateStr = chk.date.split('T')[0];
      if (dateStr) activeDates.add(dateStr);
    } catch {
      // ignore
    }
  });

  if (activeDates.size === 0) return 0;

  // Sắp xếp ngày giảm dần
  const sortedDates = Array.from(activeDates).sort().reverse();
  
  // Tính số ngày liên tiếp từ ngày gần nhất
  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const curr = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i + 1]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Tính toán tiến độ thử thách từ nhật ký tập thực tế
 */
export function calculateChallengeProgress(
  challenge: CommunityChallenge,
  workoutLogs: WorkoutSessionLog[]
): { currentProgress: number; isCompleted: boolean; percent: number } {
  const start = new Date(challenge.startDate).getTime();
  const end = new Date(challenge.endDate).getTime();

  // Lọc các buổi tập trong thời gian thử thách
  const validLogs = workoutLogs.filter(log => {
    const t = new Date(log.date).getTime();
    return t >= start && t <= end;
  });

  let current = 0;
  if (challenge.targetType === 'workouts_count') {
    current = validLogs.length;
  } else if (challenge.targetType === 'active_minutes') {
    current = validLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  } else if (challenge.targetType === 'streak_days') {
    current = calculateUserStreak(validLogs);
  }

  const target = Math.max(1, challenge.targetValue);
  const clampedCurrent = Math.min(current, target);
  const percent = Math.min(100, Math.round((clampedCurrent / target) * 100));
  const isCompleted = current >= target;

  return {
    currentProgress: current,
    isCompleted,
    percent
  };
}

/**
 * Tính toán bảng xếp hạng cộng đồng DISCI
 * QUY TẮC BẢO MẬT TUYỆT ĐỐI: Không bao giờ sử dụng cân nặng, BMI, huyết áp hoặc thông tin y tế!
 * Chỉ xếp hạng theo: Số buổi tập hoàn thành HOẶC Tổng số phút vận động tích cực.
 */
export function computeLeaderboard(
  users: CommunityUser[],
  currentUserId: string,
  currentUserLogs: WorkoutSessionLog[],
  period: 'week' | 'month' = 'week',
  rankingMetric: 'workouts' | 'minutes' = 'workouts'
): LeaderboardEntry[] {
  // Tính chỉ số cho người dùng hiện tại từ log thực
  const currentUserWorkouts = currentUserLogs.length;
  const currentUserMinutes = currentUserLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // Tạo điểm số cho danh sách
  const rawEntries = users.map(user => {
    const isCurrentUser = user.id === currentUserId;
    let score = 0;

    if (isCurrentUser) {
      score = rankingMetric === 'workouts' ? currentUserWorkouts : currentUserMinutes;
    } else {
      // Giả lập điểm số nhất quán dựa trên streakDays của user
      const baseWorkouts = Math.max(1, Math.round(user.streakDays * 0.8));
      const baseMinutes = baseWorkouts * 28;
      score = rankingMetric === 'workouts' ? baseWorkouts : baseMinutes;
    }

    let badgeTitle = 'Hội viên nỗ lực';
    if (score >= 15 || (rankingMetric === 'minutes' && score >= 400)) badgeTitle = 'Chiến binh DISCI';
    else if (score >= 8 || (rankingMetric === 'minutes' && score >= 200)) badgeTitle = 'Kỷ luật vàng';
    else if (score >= 4 || (rankingMetric === 'minutes' && score >= 100)) badgeTitle = 'Tiến bộ vững';

    return {
      userId: user.id,
      userName: user.fullName,
      userAvatar: user.avatarUrl,
      score,
      unitLabel: rankingMetric === 'workouts' ? 'buổi tập' : 'phút',
      badgeTitle,
      isCurrentUser
    };
  });

  // Sắp xếp điểm giảm dần
  rawEntries.sort((a, b) => b.score - a.score);

  // Gán thứ hạng
  return rawEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

/**
 * Đánh giá các huy hiệu đạt được của người dùng
 */
export function evaluateUserBadges(
  badges: BadgeItem[],
  workoutLogs: WorkoutSessionLog[],
  streakDays: number,
  joinedGroupsCount: number
): BadgeItem[] {
  const totalWorkouts = workoutLogs.length;
  const totalMinutes = workoutLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  return badges.map(badge => {
    let unlocked = badge.isUnlocked;

    switch (badge.id) {
      case 'badge_first_step':
        unlocked = totalWorkouts >= 1;
        break;
      case 'badge_streak_3':
        unlocked = streakDays >= 3;
        break;
      case 'badge_streak_7':
        unlocked = streakDays >= 7;
        break;
      case 'badge_century_minutes':
        unlocked = totalMinutes >= 100;
        break;
      case 'badge_team_player':
        unlocked = joinedGroupsCount >= 1;
        break;
      default:
        break;
    }

    return {
      ...badge,
      isUnlocked: unlocked
    };
  });
}
