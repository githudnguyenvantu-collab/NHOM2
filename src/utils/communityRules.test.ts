import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  canUserViewPost,
  filterPostsForUser,
  toggleCheerPost,
  calculateUserStreak,
  calculateChallengeProgress,
  computeLeaderboard,
  evaluateUserBadges
} from './communityRules';
import { CommunityPost, CommunityUser, CommunityChallenge, WorkoutSessionLog, BadgeItem } from '../types';

describe('Community Subsystem Pure Logic Tests', () => {
  const currentUserId = 'user_001';
  const friendId = 'user_002';
  const strangerId = 'user_003';
  const blockedId = 'user_004';

  const mockPosts: CommunityPost[] = [
    {
      id: 'p1',
      authorId: strangerId,
      authorName: 'Stranger',
      authorHandle: '@stranger',
      authorAvatar: '',
      authorGoal: 'Sức khỏe',
      createdAt: '1h',
      timestamp: 1000,
      caption: 'Công khai cho mọi người',
      likesCount: 2,
      userHasLiked: false,
      cheeredUserIds: ['user_x', 'user_y'],
      commentsCount: 0,
      comments: [],
      privacy: 'public',
      streakDays: 4
    },
    {
      id: 'p2',
      authorId: friendId,
      authorName: 'Friend',
      authorHandle: '@friend',
      authorAvatar: '',
      authorGoal: 'Tăng cơ',
      createdAt: '2h',
      timestamp: 2000,
      caption: 'Chỉ dành cho bạn bè',
      likesCount: 1,
      userHasLiked: false,
      cheeredUserIds: ['user_z'],
      commentsCount: 0,
      comments: [],
      privacy: 'friends',
      streakDays: 6
    },
    {
      id: 'p3',
      authorId: strangerId,
      authorName: 'Stranger',
      authorHandle: '@stranger',
      authorAvatar: '',
      authorGoal: 'Sức khỏe',
      createdAt: '3h',
      timestamp: 3000,
      caption: 'Bài riêng tư của người lạ',
      likesCount: 0,
      userHasLiked: false,
      cheeredUserIds: [],
      commentsCount: 0,
      comments: [],
      privacy: 'only_me',
      streakDays: 2
    },
    {
      id: 'p4',
      authorId: blockedId,
      authorName: 'Blocked User',
      authorHandle: '@blocked',
      authorAvatar: '',
      authorGoal: 'Giảm mỡ',
      createdAt: '4h',
      timestamp: 4000,
      caption: 'Bài viết của người bị chặn',
      likesCount: 0,
      userHasLiked: false,
      cheeredUserIds: [],
      commentsCount: 0,
      comments: [],
      privacy: 'public',
      streakDays: 1
    }
  ];

  test('canUserViewPost respects public, friends, only_me, and blocked policies', () => {
    const friendIds = [friendId];
    const blockedIds = [blockedId];

    // Public post from stranger -> viewable
    assert.equal(canUserViewPost(mockPosts[0], currentUserId, friendIds, blockedIds), true);

    // Friends-only post from friend -> viewable
    assert.equal(canUserViewPost(mockPosts[1], currentUserId, friendIds, blockedIds), true);

    // Friends-only post from stranger -> NOT viewable
    assert.equal(canUserViewPost(mockPosts[1], strangerId, [], []), false);

    // Only_me post from stranger -> NOT viewable by current user
    assert.equal(canUserViewPost(mockPosts[2], currentUserId, friendIds, blockedIds), false);

    // Only_me post from current user -> viewable by current user
    const ownOnlyMePost: CommunityPost = { ...mockPosts[2], authorId: currentUserId };
    assert.equal(canUserViewPost(ownOnlyMePost, currentUserId, friendIds, blockedIds), true);

    // Post from blocked user -> NOT viewable even if public
    assert.equal(canUserViewPost(mockPosts[3], currentUserId, friendIds, blockedIds), false);
  });

  test('filterPostsForUser correctly filters out blocked, private, and sorts by newest', () => {
    const filtered = filterPostsForUser(
      mockPosts,
      currentUserId,
      [friendId],
      [blockedId],
      'all'
    );

    // Should include p2 (timestamp 2000) and p1 (timestamp 1000)
    // p3 is only_me of stranger, p4 is blocked user
    assert.equal(filtered.length, 2);
    assert.equal(filtered[0].id, 'p2'); // newer
    assert.equal(filtered[1].id, 'p1');
  });

  test('toggleCheerPost is idempotent and correctly updates cheeredUserIds and likesCount', () => {
    const basePost = mockPosts[0]; // currently cheered by user_x, user_y (2 likes)

    // User adds cheer
    const cheered = toggleCheerPost(basePost, currentUserId);
    assert.equal(cheered.likesCount, 3);
    assert.equal(cheered.userHasLiked, true);
    assert.ok(cheered.cheeredUserIds.includes(currentUserId));

    // User uncheers (same user clicks again)
    const uncheered = toggleCheerPost(cheered, currentUserId);
    assert.equal(uncheered.likesCount, 2);
    assert.equal(uncheered.userHasLiked, false);
    assert.ok(!uncheered.cheeredUserIds.includes(currentUserId));
  });

  test('calculateUserStreak calculates consecutive days correctly from real workout logs', () => {
    const logs: WorkoutSessionLog[] = [
      {
        id: 'l1',
        date: '2026-10-22T08:00:00.000Z',
        dayOfWeek: 4,
        durationMinutes: 30,
        rpeRating: 7,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 4
      },
      {
        id: 'l2',
        date: '2026-10-21T08:00:00.000Z',
        dayOfWeek: 3,
        durationMinutes: 30,
        rpeRating: 6,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 4
      },
      {
        id: 'l3',
        date: '2026-10-20T08:00:00.000Z',
        dayOfWeek: 2,
        durationMinutes: 25,
        rpeRating: 6,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 3
      }
    ];

    const streak = calculateUserStreak(logs);
    assert.equal(streak, 3);
  });

  test('calculateChallengeProgress calculates percentage and completion from logs', () => {
    const challenge: CommunityChallenge = {
      id: 'c1',
      title: 'Thử thách 7 ngày kiên trì',
      image: '',
      description: 'Hoàn thành 3 buổi tập trong tuần',
      goalDescription: '3 buổi tập',
      startDate: '2026-10-15T00:00:00.000Z',
      endDate: '2026-10-25T23:59:59.000Z',
      targetType: 'workouts_count',
      targetValue: 3,
      currentProgress: 0,
      isJoined: true,
      isCompleted: false,
      participantsCount: 42,
      participantAvatars: [],
      badgeReward: {
        id: 'b1',
        name: 'Chiến binh tuần',
        icon: 'Award',
        description: 'Hoàn thành thử thách'
      }
    };

    const logs: WorkoutSessionLog[] = [
      {
        id: 'l1',
        date: '2026-10-18T08:00:00.000Z',
        dayOfWeek: 1,
        durationMinutes: 30,
        rpeRating: 7,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 4
      },
      {
        id: 'l2',
        date: '2026-10-20T08:00:00.000Z',
        dayOfWeek: 3,
        durationMinutes: 30,
        rpeRating: 6,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 4
      }
    ];

    const progress = calculateChallengeProgress(challenge, logs);
    assert.equal(progress.currentProgress, 2);
    assert.equal(progress.percent, 67);
    assert.equal(progress.isCompleted, false);
  });

  test('computeLeaderboard ranks purely by workouts/minutes and strictly never exposes health/weight data', () => {
    const users: CommunityUser[] = [
      {
        id: 'u1',
        fullName: 'Trần Văn An',
        handle: '@an_tran',
        avatarUrl: '',
        bio: '',
        workoutGoal: 'Tăng cơ',
        streakDays: 10,
        badges: [],
        isFriend: true,
        friendRequestStatus: 'none',
        isBlocked: false,
        mutualFriendsCount: 3
      },
      {
        id: currentUserId,
        fullName: 'Nguyễn Văn Tú',
        handle: '@tu_nguyen',
        avatarUrl: '',
        bio: '',
        workoutGoal: 'Tăng cơ',
        streakDays: 5,
        badges: [],
        isFriend: false,
        friendRequestStatus: 'none',
        isBlocked: false,
        mutualFriendsCount: 0
      }
    ];

    const logs: WorkoutSessionLog[] = [
      {
        id: 'l1',
        date: '2026-10-20T00:00:00Z',
        dayOfWeek: 2,
        durationMinutes: 45,
        rpeRating: 7,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 5
      }
    ];

    const leaderboard = computeLeaderboard(users, currentUserId, logs, 'week', 'workouts');
    assert.equal(leaderboard.length, 2);
    // Ensure no weight or BMI or health keys exist on entries
    leaderboard.forEach(entry => {
      assert.equal((entry as any).weightKg, undefined);
      assert.equal((entry as any).bmi, undefined);
      assert.equal((entry as any).bloodPressure, undefined);
      assert.ok(entry.score >= 0);
      assert.ok(entry.unitLabel === 'buổi tập');
    });
  });

  test('evaluateUserBadges unlocks badges based on actual logs and streak', () => {
    const badges: BadgeItem[] = [
      {
        id: 'badge_first_step',
        name: 'Bước khởi đầu',
        description: 'Hoàn thành buổi tập đầu tiên',
        icon: 'Footprints',
        tier: 'bronze',
        isPublic: true,
        isUnlocked: false
      },
      {
        id: 'badge_streak_7',
        name: 'Chiến binh 7 ngày',
        description: 'Duy trì chuỗi 7 ngày',
        icon: 'Flame',
        tier: 'silver',
        isPublic: true,
        isUnlocked: false
      }
    ];

    const logs: WorkoutSessionLog[] = [
      {
        id: 'l1',
        date: '2026-10-20T00:00:00Z',
        dayOfWeek: 2,
        durationMinutes: 30,
        rpeRating: 7,
        completionRatePercent: 100,
        reportedPain: false,
        reportedFatigue: false,
        completedExercisesCount: 4
      }
    ];

    const evaluated = evaluateUserBadges(badges, logs, 7, 0);
    assert.equal(evaluated[0].isUnlocked, true); // 1 workout >= 1
    assert.equal(evaluated[1].isUnlocked, true); // streak 7 >= 7
  });
});
