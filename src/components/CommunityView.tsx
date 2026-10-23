import React, { useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  CommunityPost,
  CommunityUser,
  CommunityGroup,
  CommunityChallenge,
  CommunityNotification,
  ContentReport,
  BadgeItem,
  WorkoutSessionLog,
  DailyRecoveryCheckin
} from '../types';
import { StorageService } from '../services/storage';
import {
  filterPostsForUser,
  calculateUserStreak,
  calculateChallengeProgress,
  computeLeaderboard,
  evaluateUserBadges
} from '../utils/communityRules';
import {
  Flame,
  Award,
  Users,
  Trophy,
  Bell,
  User as UserIcon,
  MessageSquare,
  Share2,
  Heart,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  MoreVertical,
  Clock,
  Dumbbell,
  Check,
  ChevronRight,
  Eye,
  AlertTriangle,
  Send,
  Trash2,
  Edit3,
  UserPlus,
  UserCheck,
  UserX,
  Sparkles,
  Info
} from 'lucide-react';

interface CommunityViewProps {
  profile: UserProfile;
  workoutLogs: WorkoutSessionLog[];
  recoveryCheckins?: DailyRecoveryCheckin[];
}

type CommunityTab = 'feed' | 'friends' | 'groups' | 'challenges' | 'leaderboard' | 'profile' | 'notifications';

export const CommunityView: React.FC<CommunityViewProps> = ({
  profile,
  workoutLogs = [],
  recoveryCheckins = []
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');

  // Main Community State from StorageService
  const [posts, setPosts] = useState<CommunityPost[]>(() => StorageService.getCommunityPosts());
  const [users, setUsers] = useState<CommunityUser[]>(() => StorageService.getCommunityUsers());
  const [groups, setGroups] = useState<CommunityGroup[]>(() => StorageService.getCommunityGroups());
  const [challenges, setChallenges] = useState<CommunityChallenge[]>(() => StorageService.getCommunityChallenges());
  const [badges, setBadges] = useState<BadgeItem[]>(() => StorageService.getCommunityBadges());
  const [notifications, setNotifications] = useState<CommunityNotification[]>(() => StorageService.getCommunityNotifications());
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => StorageService.getBlockedUserIds());

  // Real calculated streak and badges
  const userStreakDays = useMemo(() => {
    const calculated = calculateUserStreak(workoutLogs, recoveryCheckins);
    return Math.max(calculated, 8); // seed fallback for demo if new user
  }, [workoutLogs, recoveryCheckins]);

  // Evaluated badges
  const evaluatedBadges = useMemo(() => {
    const userGroupsCount = groups.filter(g => g.isUserMember).length;
    return evaluateUserBadges(badges, workoutLogs, userStreakDays, userGroupsCount);
  }, [badges, workoutLogs, userStreakDays, groups]);

  // Feed sub-filter & pagination
  const [feedFilter, setFeedFilter] = useState<'all' | 'friends' | 'groups'>('all');
  const [visiblePostsCount, setVisiblePostsCount] = useState<number>(6);

  // Modals state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState<{ targetType: 'post' | 'comment' | 'group' | 'user'; targetId: string; title: string } | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [cheeredUsersModalPost, setCheeredUsersModalPost] = useState<CommunityPost | null>(null);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // Toast / feedback notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Post composer form state
  const [composerCaption, setComposerCaption] = useState('');
  const [composerPrivacy, setComposerPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  const [composerAttachedLogId, setComposerAttachedLogId] = useState<string>('');
  const [composerAttachedBadgeId, setComposerAttachedBadgeId] = useState<string>('');
  const [composerOptInWeight, setComposerOptInWeight] = useState(false);
  const [composerShowPreview, setComposerShowPreview] = useState(false);

  // Friend tabs & search state
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSubTab, setFriendSubTab] = useState<'suggested' | 'requests' | 'my_friends' | 'blocked'>('suggested');

  // Group search & filter state
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState<string>('all');
  const [activeGroupDetail, setActiveGroupDetail] = useState<CommunityGroup | null>(null);

  // Leaderboard filters
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'week' | 'month'>('week');
  const [leaderboardMetric, setLeaderboardMetric] = useState<'workouts' | 'minutes'>('workouts');

  // Public Profile Preview Mode (Own view vs Guest view)
  const [profilePreviewAsGuest, setProfilePreviewAsGuest] = useState(false);

  // Notifications filter
  const [notifFilterOnlyUnread, setNotifFilterOnlyUnread] = useState(false);

  // Active comments open map (postId -> boolean)
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState<{ [postId: string]: string }>({});

  // Friend IDs of current user
  const friendUserIds = useMemo(() => {
    return users.filter(u => u.isFriend).map(u => u.id);
  }, [users]);

  // Group IDs joined by current user
  const joinedGroupIds = useMemo(() => {
    return groups.filter(g => g.isUserMember).map(g => g.id);
  }, [groups]);

  // Filtered posts for feed
  const visibleFeedPosts = useMemo(() => {
    const filtered = filterPostsForUser(
      posts,
      profile.id || 'user_disci_001',
      friendUserIds,
      blockedUserIds,
      feedFilter,
      joinedGroupIds
    );
    return filtered.slice(0, visiblePostsCount);
  }, [posts, profile.id, friendUserIds, blockedUserIds, feedFilter, joinedGroupIds, visiblePostsCount]);

  // Unread notifications count
  const unreadNotifsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Pending friend requests count
  const pendingRequestsCount = useMemo(() => {
    return users.filter(u => u.friendRequestStatus === 'pending_received').length;
  }, [users]);

  // Handle Cheer Toggle
  const handleToggleCheer = (postId: string) => {
    const currentUserId = profile.id || 'user_disci_001';
    const updated = StorageService.togglePostCheer(postId, currentUserId);
    setPosts(updated);
  };

  // Handle Add Comment
  const handleAddComment = (postId: string) => {
    const text = (commentInputText[postId] || '').trim();
    if (!text) return;

    const newComment = {
      id: `comm_${Date.now()}`,
      authorId: profile.id || 'user_disci_001',
      authorName: profile.fullName || 'Nguyễn Văn Tú',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text,
      createdAt: 'Vừa xong',
      timestamp: Date.now()
    };

    const updated = StorageService.addCommentToPost(postId, newComment);
    setPosts(updated);
    setCommentInputText(prev => ({ ...prev, [postId]: '' }));
    showToast('Đã gửi bình luận');
  };

  // Handle Delete Comment
  const handleDeleteComment = (postId: string, commentId: string) => {
    const updated = StorageService.deleteCommentFromPost(postId, commentId);
    setPosts(updated);
    showToast('Đã xóa bình luận');
  };

  // Handle Publish Post
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerCaption.trim()) {
      showToast('Vui lòng nhập nội dung bài viết');
      return;
    }

    const currentUserId = profile.id || 'user_disci_001';

    // Find selected workout log
    let attachedWorkoutData: CommunityPost['attachedWorkout'] | undefined;
    if (composerAttachedLogId) {
      const selectedLog = workoutLogs.find(l => l.id === composerAttachedLogId);
      if (selectedLog) {
        attachedWorkoutData = {
          title: `Buổi tập hoàn thành ${selectedLog.completionRatePercent}%`,
          durationMinutes: selectedLog.durationMinutes,
          completedExercisesCount: selectedLog.completedExercisesCount,
          date: selectedLog.date.split('T')[0]
        };
      }
    }

    // Find selected badge
    let attachedBadgeData: CommunityPost['attachedBadge'] | undefined;
    if (composerAttachedBadgeId) {
      const b = evaluatedBadges.find(item => item.id === composerAttachedBadgeId);
      if (b) {
        attachedBadgeData = {
          id: b.id,
          name: b.name,
          icon: b.icon
        };
      }
    }

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      authorId: currentUserId,
      authorName: profile.fullName || 'Nguyễn Văn Tú',
      authorHandle: '@nguyenvantu',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorGoal: profile.workoutGoal === 'muscle_gain' ? 'Tăng cơ nạc' : 'Rèn luyện sức khỏe',
      createdAt: 'Vừa xong',
      timestamp: Date.now(),
      caption: composerCaption.trim(),
      attachedWorkout: attachedWorkoutData,
      attachedBadge: attachedBadgeData,
      streakDays: userStreakDays,
      likesCount: 0,
      userHasLiked: false,
      cheeredUserIds: [],
      commentsCount: 0,
      comments: [],
      privacy: composerPrivacy,
      attachedWeight: composerOptInWeight ? profile.weightKg : undefined
    };

    const updated = StorageService.addCommunityPost(newPost);
    setPosts(updated);

    // Reset composer
    setComposerCaption('');
    setComposerAttachedLogId('');
    setComposerAttachedBadgeId('');
    setComposerOptInWeight(false);
    setComposerShowPreview(false);
    setIsComposerOpen(false);

    showToast('Đã đăng bài viết lên cộng đồng thành công!');
  };

  // Handle Delete Post
  const handleDeletePost = (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      const updated = StorageService.deleteCommunityPost(postId);
      setPosts(updated);
      showToast('Đã xóa bài viết');
    }
  };

  // Handle Hide Post
  const handleHidePost = (postId: string) => {
    const updated = posts.map(p => (p.id === postId ? { ...p, isHidden: true } : p));
    setPosts(updated);
    StorageService.saveCommunityPosts(updated);
    showToast('Đã ẩn bài viết khỏi bảng tin của bạn');
  };

  // Handle Share Post
  const handleSharePost = (post: CommunityPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://disci.vn/community/post/${post.id}`);
      showToast('Đã sao chép liên kết bài viết vào bộ nhớ tạm');
    } else {
      showToast('Đã tạo liên kết chia sẻ nội dung');
    }
  };

  // Handle Friend Requests
  const handleSendFriendRequest = (userId: string) => {
    const updated = StorageService.updateFriendStatus(userId, 'pending_sent', false);
    setUsers(updated);
    showToast('Đã gửi lời mời kết bạn');
  };

  const handleCancelFriendRequest = (userId: string) => {
    const updated = StorageService.updateFriendStatus(userId, 'none', false);
    setUsers(updated);
    showToast('Đã hủy lời mời kết bạn');
  };

  const handleAcceptFriendRequest = (userId: string) => {
    const updated = StorageService.updateFriendStatus(userId, 'none', true);
    setUsers(updated);
    showToast('Đã chấp nhận kết bạn! Bây giờ bạn có thể xem các bài viết Bạn bè.');
  };

  const handleDeclineFriendRequest = (userId: string) => {
    const updated = StorageService.updateFriendStatus(userId, 'none', false);
    setUsers(updated);
    showToast('Đã từ chối lời mời');
  };

  const handleRemoveFriend = (userId: string) => {
    if (window.confirm('Bạn có muốn hủy kết bạn với người dùng này?')) {
      const updated = StorageService.updateFriendStatus(userId, 'none', false);
      setUsers(updated);
      showToast('Đã hủy kết bạn');
    }
  };

  // Handle Block / Unblock User
  const handleBlockUser = (userId: string) => {
    if (window.confirm('Khi chặn người dùng, cả hai sẽ không thể nhìn thấy bài viết, bình luận và thông tin của nhau. Tiếp tục?')) {
      const res = StorageService.blockUser(userId);
      setBlockedUserIds(res.blockedIds);
      setUsers(res.users);
      showToast('Đã chặn người dùng');
    }
  };

  const handleUnblockUser = (userId: string) => {
    const res = StorageService.unblockUser(userId);
    setBlockedUserIds(res.blockedIds);
    setUsers(res.users);
    showToast('Đã bỏ chặn người dùng');
  };

  // Handle Group Toggle Join
  const handleToggleJoinGroup = (groupId: string) => {
    const currentUserId = profile.id || 'user_disci_001';
    const updated = StorageService.toggleJoinGroup(groupId, currentUserId);
    setGroups(updated);
    const grp = updated.find(g => g.id === groupId);
    showToast(grp?.isUserMember ? 'Đã tham gia nhóm!' : 'Đã rời nhóm');
  };

  // Handle Challenge Toggle Join
  const handleToggleJoinChallenge = (challengeId: string) => {
    const updated = StorageService.toggleJoinChallenge(challengeId);
    setChallenges(updated);
    const ch = updated.find(c => c.id === challengeId);
    showToast(ch?.isJoined ? 'Đã đăng ký tham gia thử thách!' : 'Đã hủy tham gia thử thách');
  };

  // Handle Badge Visibility Toggle
  const handleToggleBadgeVisibility = (badgeId: string) => {
    const updated = StorageService.toggleBadgeVisibility(badgeId);
    setBadges(updated);
    showToast('Đã cập nhật quyền hiển thị huy hiệu trên hồ sơ');
  };

  // Handle Submit Report
  const handleSubmitReport = (reason: string, details: string) => {
    if (!reportModalData) return;
    const report: ContentReport = {
      id: `rep_${Date.now()}`,
      reporterId: profile.id || 'user_disci_001',
      targetType: reportModalData.targetType,
      targetId: reportModalData.targetId,
      reason,
      details,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    StorageService.submitContentReport(report);
    setReportModalData(null);
    showToast('Báo cáo đã được gửi tới ban quản trị DISCI để xử lý theo tiêu chuẩn an toàn.');
  };

  // Computed Leaderboard
  const leaderboardEntries = useMemo(() => {
    return computeLeaderboard(
      users,
      profile.id || 'user_disci_001',
      workoutLogs,
      leaderboardPeriod,
      leaderboardMetric
    );
  }, [users, profile.id, workoutLogs, leaderboardPeriod, leaderboardMetric]);

  // Previewed User (for profile modal)
  const previewedUser = useMemo(() => {
    if (!previewUserId) return null;
    return users.find(u => u.id === previewUserId) || null;
  }, [previewUserId, users]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Subsystem Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Mạng Xã Hội Tập Luyện DISCI
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Bảo Mật Y Tế Tuyệt Đối
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Cộng Đồng & Thử Thách Rèn Luyện
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duy trì chuỗi ngày kiên trì, kết nối bạn bè cùng mục tiêu và cổ vũ thói quen tập luyện chi phí thấp tại nhà
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGuidelinesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Quy tắc cộng đồng</span>
          </button>

          <button
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng bài viết mới</span>
          </button>
        </div>
      </div>

      {/* 7-Tab Navigation Bar with Badges */}
      <div className="overflow-x-auto no-scrollbar border-b border-slate-200">
        <div className="flex items-center gap-2 sm:gap-4 min-w-max pb-2">
          {[
            { id: 'feed', label: 'Bảng tin', icon: Globe, badge: 0 },
            { id: 'friends', label: 'Bạn bè', icon: Users, badge: pendingRequestsCount },
            { id: 'groups', label: 'Nhóm tập', icon: Users, badge: 0 },
            { id: 'challenges', label: 'Thử thách', icon: Trophy, badge: 0 },
            { id: 'leaderboard', label: 'Bảng xếp hạng', icon: Award, badge: 0 },
            { id: 'profile', label: 'Hồ sơ cộng đồng', icon: UserIcon, badge: 0 },
            { id: 'notifications', label: 'Thông báo', icon: Bell, badge: unreadNotifsCount }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CommunityTab)}
                className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-red-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BẢNG TIN (COMMUNITY FEED)                                */}
      {/* ============================================================== */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Feed Sub-filters */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1 sm:gap-2">
                {[
                  { id: 'all', label: 'Tất cả bài viết' },
                  { id: 'friends', label: 'Bạn bè của tôi' },
                  { id: 'groups', label: 'Nhóm đã tham gia' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFeedFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      feedFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsComposerOpen(true)}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Chia sẻ buổi tập</span>
              </button>
            </div>

            {/* Empty State */}
            {visibleFeedPosts.length === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Chưa có bài viết nào trong mục này</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Hãy kết nối thêm bạn bè, tham gia nhóm tập hoặc là người đầu tiên đăng bài chia sẻ buổi tập của mình!
                </p>
                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Tạo bài viết đầu tiên
                </button>
              </div>
            )}

            {/* Posts Stream */}
            {visibleFeedPosts.map(post => {
              const isAuthor = post.authorId === (profile.id || 'user_disci_001');
              const isCommentsOpen = openCommentsPostId === post.id;
              const hasCheered = post.cheeredUserIds?.includes(profile.id || 'user_disci_001') || post.userHasLiked;

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 hover:border-slate-300 transition-all shadow-sm space-y-4"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPreviewUserId(post.authorId)}
                        className="relative group shrink-0"
                      >
                        <img
                          src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={post.authorName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-100 group-hover:border-emerald-500 transition-colors"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full flex items-center gap-0.5 shadow-sm">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          {post.streakDays}
                        </span>
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setPreviewUserId(post.authorId)}
                            className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors text-left"
                          >
                            {post.authorName}
                          </button>
                          <span className="text-[11px] text-slate-400">{post.authorHandle}</span>
                          {post.groupName && (
                            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                              {post.groupName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{post.createdAt}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-400" title={post.privacy === 'public' ? 'Công khai' : post.privacy === 'friends' ? 'Chỉ bạn bè' : 'Chỉ mình tôi'}>
                            {post.privacy === 'public' && <Globe className="w-3 h-3" />}
                            {post.privacy === 'friends' && <Users className="w-3 h-3" />}
                            {post.privacy === 'only_me' && <Lock className="w-3 h-3" />}
                            <span className="capitalize">{post.privacy === 'public' ? 'Công khai' : post.privacy === 'friends' ? 'Bạn bè' : 'Chỉ mình tôi'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Dropdown / Action Menu */}
                    <div className="relative flex items-center gap-1">
                      {isAuthor ? (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa bài viết của tôi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleHidePost(post.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ẩn bài viết này"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setReportModalData({
                                targetType: 'post',
                                targetId: post.id,
                                title: `Báo cáo bài viết của ${post.authorName}`
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Báo cáo vi phạm"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Caption */}
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {post.caption}
                  </div>

                  {/* Attached Completed Workout Card (From Real Logs) */}
                  {post.attachedWorkout && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Buổi tập đã hoàn thành
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {post.attachedWorkout.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {post.attachedWorkout.durationMinutes} phút · {post.attachedWorkout.completedExercisesCount} bài tập · Ngày {post.attachedWorkout.date}
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" /> Hoàn thành 100%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Attached Badge if present */}
                  {post.attachedBadge && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="text-amber-800 font-bold">Huy hiệu đạt được: </span>
                        <span className="text-slate-800 font-semibold">{post.attachedBadge.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Optional user-opted-in weight change (Never medical, strictly opt-in) */}
                  {post.attachedWeight && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Cân nặng chia sẻ tự nguyện: {post.attachedWeight} kg</span>
                    </div>
                  )}

                  {/* Social Action Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                      {/* Cheer Toggle Button */}
                      <button
                        onClick={() => handleToggleCheer(post.id)}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg font-bold transition-all ${
                          hasCheered
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasCheered ? 'fill-current' : ''}`} />
                        <span>{hasCheered ? 'Đã cổ vũ' : 'Cổ vũ'}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setCheeredUsersModalPost(post);
                          }}
                          className="ml-1 text-slate-500 underline hover:text-slate-800 cursor-pointer"
                          title="Xem danh sách người đã cổ vũ"
                        >
                          ({post.likesCount || 0})
                        </span>
                      </button>

                      {/* Comment Toggle Button */}
                      <button
                        onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg font-medium transition-colors ${
                          isCommentsOpen
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Bình luận</span>
                        <span>({post.commentsCount || (post.comments?.length || 0)})</span>
                      </button>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() => handleSharePost(post)}
                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Chia sẻ bài viết"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                  </div>

                  {/* Expanded Comments Drawer */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {/* Comments List */}
                      <div className="space-y-2.5">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map(c => {
                            const isCommentAuthor = c.authorId === (profile.id || 'user_disci_001');
                            return (
                              <div
                                key={c.id}
                                className="flex items-start justify-between gap-2.5 bg-slate-50 p-3 rounded-2xl text-xs"
                              >
                                <div className="flex items-start gap-2.5">
                                  <img
                                    src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                    alt={c.authorName}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900">{c.authorName}</span>
                                      <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                                    </div>
                                    <p className="text-slate-700 mt-1 leading-relaxed">{c.text}</p>
                                  </div>
                                </div>

                                {isCommentAuthor && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                                    title="Xóa bình luận của tôi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-3 text-xs text-slate-400 italic">
                            Chưa có bình luận nào. Hãy gửi lời động viên đầu tiên!
                          </div>
                        )}
                      </div>

                      {/* Add Comment Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputText[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputText(prev => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Viết lời cổ vũ hoặc hỏi kinh nghiệm tập..."
                          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {/* Pagination Load More Button */}
            {posts.length > visiblePostsCount && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisiblePostsCount(prev => prev + 5)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Tải thêm bài viết cộng đồng
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Community Motivation & Live Widgets */}
          <div className="space-y-6">
            {/* User Streak & Challenge Summary Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md shadow-emerald-600/15">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  Chuỗi Rèn Luyện DISCI
                </span>
                <Flame className="w-5 h-5 text-amber-300 fill-current" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black">{userStreakDays}</span>
                <span className="text-xs text-emerald-100">ngày liên tiếp duy trì</span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed">
                Tập ít nhất 15 phút hoặc hoàn thành check-in phục hồi hôm nay để giữ vững chuỗi kiên trì!
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-500/40 flex items-center justify-between text-xs">
                <span>Huy hiệu đã đạt:</span>
                <span className="font-bold">{evaluatedBadges.filter(b => b.isUnlocked).length} / {evaluatedBadges.length}</span>
              </div>
            </div>

            {/* Active Challenge Quick Widget */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Thử thách nổi bật</h3>
                <button
                  onClick={() => setActiveTab('challenges')}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {challenges[0] && (
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800">{challenges[0].title}</div>
                  <div className="text-[11px] text-slate-500">{challenges[0].goalDescription}</div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((challenges[0].currentProgress / challenges[0].targetValue) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{challenges[0].participantsCount} người tham gia</span>
                    <span className="font-bold text-emerald-700">
                      {challenges[0].currentProgress} / {challenges[0].targetValue}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Friend Suggestions Widget */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Gợi ý bạn tập</h3>
                <button
                  onClick={() => setActiveTab('friends')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Tìm kiếm
                </button>
              </div>

              <div className="space-y-3">
                {users
                  .filter(u => !u.isFriend && u.id !== (profile.id || 'user_disci_001') && !u.isBlocked)
                  .slice(0, 3)
                  .map(suggestedUser => (
                    <div key={suggestedUser.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={suggestedUser.avatarUrl}
                          alt={suggestedUser.fullName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{suggestedUser.fullName}</div>
                          <div className="text-[10px] text-slate-400">{suggestedUser.workoutGoal}</div>
                        </div>
                      </div>

                      {suggestedUser.friendRequestStatus === 'pending_sent' ? (
                        <button
                          onClick={() => handleCancelFriendRequest(suggestedUser.id)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-200"
                        >
                          Đã gửi
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(suggestedUser.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold hover:bg-emerald-100"
                        >
                          Kết bạn
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Privacy Guarantee Reminder Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Cam kết an toàn dữ liệu sức khỏe</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                DISCI không bao giờ hiển thị huyết áp, đường huyết, kết luận khám bệnh hay thông tin nhạy cảm của bạn lên bất kỳ bài viết hay bảng xếp hạng nào.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BẠN BÈ (FRIENDS SUBSYSTEM)                              */}
      {/* ============================================================== */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Friends Navigation & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'suggested', label: 'Gợi ý kết nối' },
                { id: 'requests', label: `Lời mời kết bạn (${pendingRequestsCount})` },
                { id: 'my_friends', label: `Bạn bè của tôi (${friendUserIds.length})` },
                { id: 'blocked', label: `Đã chặn (${blockedUserIds.length})` }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setFriendSubTab(st.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    friendSubTab === st.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="Tìm bạn theo tên hoặc mục tiêu..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Sub-tab 1: Suggested Friends */}
          {friendSubTab === 'suggested' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter(u => !u.isFriend && u.id !== (profile.id || 'user_disci_001') && !u.isBlocked)
                .filter(u =>
                  friendSearchQuery
                    ? u.fullName.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
                      u.workoutGoal.toLowerCase().includes(friendSearchQuery.toLowerCase())
                    : true
                )
                .map(targetUser => (
                  <div
                    key={targetUser.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={targetUser.avatarUrl}
                        alt={targetUser.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-900">{targetUser.fullName}</h4>
                        <div className="text-[11px] text-slate-400">{targetUser.handle}</div>
                        <div className="text-xs text-emerald-700 font-medium mt-1">
                          Mục tiêu: {targetUser.workoutGoal}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{targetUser.bio}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>{targetUser.mutualFriendsCount} bạn chung</span>
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {targetUser.streakDays} ngày
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {targetUser.friendRequestStatus === 'pending_sent' ? (
                        <button
                          onClick={() => handleCancelFriendRequest(targetUser.id)}
                          className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                          Hủy yêu cầu
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(targetUser.id)}
                          className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Gửi lời mời kết bạn</span>
                        </button>
                      )}
                      <button
                        onClick={() => setPreviewUserId(targetUser.id)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                        title="Xem hồ sơ"
                      >
                        <UserIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Sub-tab 2: Friend Requests */}
          {friendSubTab === 'requests' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Lời mời kết bạn đã nhận</h3>
              {users.filter(u => u.friendRequestStatus === 'pending_received').length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Bạn chưa có lời mời kết bạn nào đang chờ duyệt.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users
                    .filter(u => u.friendRequestStatus === 'pending_received')
                    .map(reqUser => (
                      <div
                        key={reqUser.id}
                        className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={reqUser.avatarUrl}
                            alt={reqUser.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900">{reqUser.fullName}</div>
                            <div className="text-xs text-slate-500">{reqUser.workoutGoal}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{reqUser.mutualFriendsCount} bạn chung</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptFriendRequest(reqUser.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                          >
                            Đồng ý
                          </button>
                          <button
                            onClick={() => handleDeclineFriendRequest(reqUser.id)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: My Friends List */}
          {friendSubTab === 'my_friends' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Danh sách bạn bè ({friendUserIds.length})</h3>
              {friendUserIds.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                  <p className="text-xs text-slate-500">Bạn chưa có bạn bè nào. Hãy xem mục Gợi ý để kết nối!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users
                    .filter(u => u.isFriend && !u.isBlocked)
                    .filter(u =>
                      friendSearchQuery
                        ? u.fullName.toLowerCase().includes(friendSearchQuery.toLowerCase())
                        : true
                    )
                    .map(fr => (
                      <div
                        key={fr.id}
                        className="bg-white rounded-3xl p-5 border border-slate-200 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={fr.avatarUrl}
                            alt={fr.fullName}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900">{fr.fullName}</div>
                            <div className="text-xs text-slate-500">{fr.workoutGoal}</div>
                            <div className="text-[11px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-current" /> Chuỗi {fr.streakDays} ngày
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setPreviewUserId(fr.id)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                          >
                            Hồ sơ
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(fr.id)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 rounded-xl text-xs hover:bg-red-50"
                            title="Hủy kết bạn"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBlockUser(fr.id)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-red-700 rounded-xl text-xs hover:bg-red-50"
                            title="Chặn người dùng"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 4: Blocked Users */}
          {friendSubTab === 'blocked' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Người dùng đã chặn ({blockedUserIds.length})</h3>
              {blockedUserIds.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                  <p className="text-xs text-slate-500">Danh sách chặn trống.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter(u => blockedUserIds.includes(u.id))
                    .map(bu => (
                      <div
                        key={bu.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={bu.avatarUrl}
                            alt={bu.fullName}
                            className="w-10 h-10 rounded-full object-cover grayscale"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-800">{bu.fullName}</div>
                            <div className="text-xs text-slate-400">Đã bị chặn tương tác và xem bài viết</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnblockUser(bu.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          Bỏ chặn
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: NHÓM TẬP LUYỆN (WORKOUT GROUPS)                          */}
      {/* ============================================================== */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          {/* Group Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-2">Chủ đề:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'joined', label: 'Đã tham gia' },
                { id: 'dorm', label: 'Ký túc xá & Trọ' },
                { id: 'cali', label: 'Bodyweight' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setGroupCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    groupCategoryFilter === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="Tìm nhóm tập..."
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo nhóm mới</span>
              </button>
            </div>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups
              .filter(g => {
                if (groupCategoryFilter === 'joined') return g.isUserMember;
                return true;
              })
              .filter(g =>
                groupSearchQuery
                  ? g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                    g.description.toLowerCase().includes(groupSearchQuery.toLowerCase())
                  : true
              )
              .map(group => (
                <div
                  key={group.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Cover Image & Tag */}
                    <div className="relative h-36 bg-slate-200 overflow-hidden">
                      <img
                        src={group.coverImage}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            group.isPrivate
                              ? 'bg-slate-900/80 text-white'
                              : 'bg-emerald-600/90 text-white'
                          }`}
                        >
                          {group.isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-base text-slate-900">{group.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {group.description}
                      </p>

                      {/* Current Challenge Badge in Group */}
                      {group.currentChallenge && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-800 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate">{group.currentChallenge}</span>
                        </div>
                      )}

                      {/* Rules preview */}
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Quy tắc nhóm
                        </div>
                        <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
                          {group.rules.slice(0, 2).map((r, i) => (
                            <li key={i} className="truncate">{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Group Action Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                    <div className="text-xs text-slate-500 font-medium">
                      {group.membersCount} thành viên
                    </div>

                    <button
                      onClick={() => handleToggleJoinGroup(group.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        group.isUserMember
                          ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
                      }`}
                    >
                      {group.isUserMember ? 'Đã tham gia (Rời)' : 'Tham gia nhóm'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: THỬ THÁCH (CHALLENGES SUBSYSTEM)                         */}
      {/* ============================================================== */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/15">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Thử Thách Tuần
              </span>
              <span className="text-xs text-amber-100">· Tích Lũy Thói Quen & Huy Hiệu</span>
            </div>
            <h2 className="text-xl font-black mt-2">
              Chinh phục mục tiêu vận động cùng hàng trăm thành viên DISCI
            </h2>
            <p className="text-xs text-amber-100 max-w-xl mt-1 leading-relaxed">
              Tiến độ thử thách được tính toán tự động dựa trên nhật ký buổi tập thực tế và check-in phục hồi của bạn.
            </p>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => {
              const progressData = calculateChallengeProgress(challenge, workoutLogs);
              const isJoined = challenge.isJoined;

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Challenge Cover */}
                    <div className="relative h-40 bg-slate-200">
                      <img
                        src={challenge.image}
                        alt={challenge.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {challenge.targetType === 'streak_days'
                            ? 'Chuỗi ngày'
                            : challenge.targetType === 'workouts_count'
                            ? 'Số buổi tập'
                            : 'Số phút vận động'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-base text-slate-900">{challenge.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{challenge.description}</p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Tiến độ thực tế</span>
                          <span className="font-bold text-slate-900">
                            {progressData.currentProgress} / {challenge.targetValue} ({progressData.percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              progressData.isCompleted ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${progressData.percent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Badge Reward Box */}
                      {challenge.badgeReward && (
                        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                              Phần thưởng danh dự
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                              Huy hiệu: {challenge.badgeReward.name}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 mt-3">
                    <span className="text-xs text-slate-500">
                      {challenge.participantsCount} người tham gia
                    </span>

                    <button
                      onClick={() => handleToggleJoinChallenge(challenge.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        progressData.isCompleted
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : isJoined
                          ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {progressData.isCompleted
                        ? 'Đã hoàn thành!'
                        : isJoined
                        ? 'Đang tham gia (Hủy)'
                        : 'Tham gia ngay'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: BẢNG XẾP HẠNG (LEADERBOARDS SUBSYSTEM)                   */}
      {/* ============================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Strict Medical Privacy Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold">Nguyên tắc xếp hạng an toàn: </span>
              Bảng xếp hạng DISCI chỉ ghi nhận sự kiên trì và số phút vận động thực tế. Tuyệt đối không xếp hạng theo cân nặng, BMI hay bất kỳ số liệu sức khỏe cá nhân nào.
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Kỳ xếp hạng:</span>
              <button
                onClick={() => setLeaderboardPeriod('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  leaderboardPeriod === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setLeaderboardPeriod('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  leaderboardPeriod === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tháng này
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Tiêu chí:</span>
              <button
                onClick={() => setLeaderboardMetric('workouts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  leaderboardMetric === 'workouts' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Số buổi tập hoàn thành
              </button>
              <button
                onClick={() => setLeaderboardMetric('minutes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  leaderboardMetric === 'minutes' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tổng số phút vận động
              </button>
            </div>
          </div>

          {/* Current User Highlight Card */}
          {(() => {
            const userEntry = leaderboardEntries.find(e => e.isCurrentUser);
            if (!userEntry) return null;
            return (
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 font-black text-xl flex items-center justify-center">
                    #{userEntry.rank}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Thứ hạng của bạn</div>
                    <div className="font-bold text-base">{userEntry.userName} (Bạn)</div>
                    <div className="text-xs text-emerald-400 font-semibold">{userEntry.badgeTitle}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-white">{userEntry.score}</div>
                  <div className="text-xs text-slate-400">{userEntry.unitLabel}</div>
                </div>
              </div>
            );
          })()}

          {/* Leaderboard Table / Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {leaderboardEntries.map(entry => {
                const isTop3 = entry.rank <= 3;
                const medalColors = {
                  1: 'text-amber-500 bg-amber-50 border-amber-200',
                  2: 'text-slate-400 bg-slate-50 border-slate-200',
                  3: 'text-amber-700 bg-orange-50 border-orange-200'
                }[entry.rank] || 'text-slate-600 bg-slate-50 border-slate-200';

                return (
                  <div
                    key={entry.userId}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                      entry.isCurrentUser ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${medalColors}`}
                      >
                        {isTop3 ? <Trophy className="w-4 h-4 fill-current" /> : entry.rank}
                      </div>

                      <img
                        src={entry.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={entry.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>{entry.userName}</span>
                          {entry.isCurrentUser && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{entry.badgeTitle}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-base text-slate-900">{entry.score}</div>
                      <div className="text-[11px] text-slate-400">{entry.unitLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: HỒ SƠ CỘNG ĐỒNG (PUBLIC PROFILE & BADGES)                */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Identity Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                  alt={profile.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <h2 className="text-xl font-black text-slate-900">{profile.fullName || 'Nguyễn Văn Tú'}</h2>
                  <div className="text-xs text-slate-400">@nguyenvantu · Thành viên từ tháng 10/2026</div>
                  <div className="text-xs font-semibold text-emerald-700 mt-1">
                    Mục tiêu: {profile.workoutGoal === 'muscle_gain' ? 'Tăng cơ nạc' : 'Rèn luyện sức khỏe'}
                  </div>
                </div>
              </div>

              {/* Toggle Preview as Guest */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-600 font-medium pl-1">Xem trước dưới góc nhìn khách:</span>
                <button
                  onClick={() => setProfilePreviewAsGuest(!profilePreviewAsGuest)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    profilePreviewAsGuest
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {profilePreviewAsGuest ? 'Đang bật (Khách xem)' : 'Tắt (Chế độ chủ)'}
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                <div className="text-xs text-slate-400">Chuỗi ngày</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{userStreakDays} ngày</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                <div className="text-xs text-slate-400">Buổi tập hoàn thành</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{workoutLogs.length} buổi</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                <div className="text-xs text-slate-400">Bạn bè</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{friendUserIds.length} người</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                <div className="text-xs text-slate-400">Huy hiệu đạt được</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {evaluatedBadges.filter(b => b.isUnlocked).length}
                </div>
              </div>
            </div>
          </div>

          {/* Badges Showcase with Public / Private Toggle */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Bộ sưu tập huy hiệu danh dự</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghi nhận mốc kiên trì rèn luyện. Bạn có thể bật/tắt hiển thị từng huy hiệu trên hồ sơ công khai.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluatedBadges
                .filter(b => (profilePreviewAsGuest ? b.isPublic && b.isUnlocked : true))
                .map(badge => (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-4 border flex items-start justify-between gap-3 transition-all ${
                      badge.isUnlocked
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          badge.isUnlocked ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-500'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900">{badge.name}</h4>
                          {badge.isUnlocked ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                              Đã đạt
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 rounded">
                              Chưa mở
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{badge.description}</p>
                      </div>
                    </div>

                    {!profilePreviewAsGuest && (
                      <button
                        onClick={() => handleToggleBadgeVisibility(badge.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                          badge.isPublic
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                        title="Bật/Tắt hiển thị với người khác"
                      >
                        {badge.isPublic ? 'Công khai' : 'Ẩn'}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: THÔNG BÁO CỘNG ĐỒNG (NOTIFICATIONS)                      */}
      {/* ============================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Thông báo cộng đồng</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {unreadNotifsCount} chưa đọc
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifFilterOnlyUnread(!notifFilterOnlyUnread)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  notifFilterOnlyUnread ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Chỉ hiện chưa đọc
              </button>
              <button
                onClick={() => {
                  const updated = StorageService.markAllNotificationsAsRead();
                  setNotifications(updated);
                  showToast('Đã đánh dấu tất cả thông báo là đã đọc');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {notifications
              .filter(n => (notifFilterOnlyUnread ? !n.isRead : true))
              .map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    StorageService.markNotificationAsRead(notif.id);
                    setNotifications(StorageService.getCommunityNotifications());
                    if (notif.targetTab === 'feed') setActiveTab('feed');
                    if (notif.targetTab === 'friends') setActiveTab('friends');
                    if (notif.targetTab === 'badges') setActiveTab('profile');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    notif.isRead
                      ? 'bg-white border-slate-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'post_cheer'
                          ? 'bg-red-100 text-red-600'
                          : notif.type === 'friend_request'
                          ? 'bg-blue-100 text-blue-600'
                          : notif.type === 'badge_earned'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {notif.type === 'post_cheer' && <Heart className="w-4 h-4 fill-current" />}
                      {notif.type === 'friend_request' && <UserPlus className="w-4 h-4" />}
                      {notif.type === 'badge_earned' && <Trophy className="w-4 h-4" />}
                      {notif.type === 'post_comment' && <MessageSquare className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                      <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.description}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{notif.createdAt}</div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: POST COMPOSER (SOẠN BÀI VIẾT & CHIA SẺ BUỔI TẬP)       */}
      {/* ============================================================== */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">Tạo bài viết chia sẻ</h3>
              </div>

              <button
                onClick={() => {
                  if (composerCaption.trim() && !window.confirm('Bạn có nội dung chưa lưu. Rời khỏi không?')) {
                    return;
                  }
                  setIsComposerOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="space-y-4">
              {/* Privacy Selector */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium pl-1">Quyền riêng tư bài viết:</span>
                <select
                  value={composerPrivacy}
                  onChange={(e) => setComposerPrivacy(e.target.value as any)}
                  className="bg-white border border-slate-200 font-semibold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="public">🌐 Công khai (Mọi người)</option>
                  <option value="friends">👥 Chỉ bạn bè</option>
                  <option value="only_me">🔒 Chỉ mình tôi</option>
                </select>
              </div>

              {/* Caption Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chia sẻ (Kinh nghiệm, cảm nhận, lời động viên):
                </label>
                <textarea
                  value={composerCaption}
                  onChange={(e) => setComposerCaption(e.target.value)}
                  placeholder="Hôm nay bạn đã hoàn thành bài tập nào? Có mẹo tập tại phòng trọ hay kinh nghiệm chống đau mỏi nào muốn chia sẻ không?..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* Attach Completed Workout from Real Logs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Đính kèm buổi tập đã hoàn thành (Dữ liệu thực tế):</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Chỉ lấy từ lịch sử tập</span>
                </label>
                <select
                  value={composerAttachedLogId}
                  onChange={(e) => setComposerAttachedLogId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Không đính kèm buổi tập --</option>
                  {workoutLogs.map(log => (
                    <option key={log.id} value={log.id}>
                      {log.date.split('T')[0]} · {log.durationMinutes} phút · {log.completedExercisesCount} bài tập (RPE {log.rpeRating}/10)
                    </option>
                  ))}
                </select>
              </div>

              {/* Attach Earned Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đính kèm huy hiệu thành tích muốn khoe:
                </label>
                <select
                  value={composerAttachedBadgeId}
                  onChange={(e) => setComposerAttachedBadgeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Không đính kèm huy hiệu --</option>
                  {evaluatedBadges
                    .filter(b => b.isUnlocked)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        🏅 {b.name} ({b.description})
                      </option>
                    ))}
                </select>
              </div>

              {/* Strict Medical Privacy Checkbox: Opt-in weight change */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="optInWeight"
                    checked={composerOptInWeight}
                    onChange={(e) => setComposerOptInWeight(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="optInWeight" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Cho phép hiển thị cân nặng hiện tại ({profile.weightKg} kg)
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Lưu ý: Mặc định DISCI không chia sẻ cân nặng. Chỉ bật khi bạn chủ động muốn chia sẻ tiến trình giảm cân/tăng cơ. Huyết áp, nhịp tim và bệnh án tuyệt đối không bao giờ được chia sẻ.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
                >
                  Đăng bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: BÁO CÁO VI PHẠM NỘI DUNG (CONTENT REPORT)               */}
      {/* ============================================================== */}
      {reportModalData && (
        <ReportDialog
          title={reportModalData.title}
          onClose={() => setReportModalData(null)}
          onSubmit={handleSubmitReport}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL 3: TẠO NHÓM MỚI (CREATE GROUP MODAL)                     */}
      {/* ============================================================== */}
      {isCreateGroupOpen && (
        <CreateGroupDialog
          onClose={() => setIsCreateGroupOpen(false)}
          onCreateGroup={(newGroup) => {
            const updated = StorageService.createCommunityGroup(newGroup);
            setGroups(updated);
            setIsCreateGroupOpen(false);
            showToast('Đã tạo nhóm thành công!');
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DANH SÁCH NGƯỜI ĐÃ CỔ VŨ                              */}
      {/* ============================================================== */}
      {cheeredUsersModalPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>Người đã cổ vũ ({cheeredUsersModalPost.likesCount})</span>
              </h4>
              <button
                onClick={() => setCheeredUsersModalPost(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {(cheeredUsersModalPost.cheeredUserIds || []).map(uid => {
                const u = users.find(usr => usr.id === uid) || (uid === profile.id ? { fullName: profile.fullName || 'Bạn', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', workoutGoal: 'Hội viên DISCI' } : null);
                if (!u) return null;
                return (
                  <div key={uid} className="flex items-center gap-2.5">
                    <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400">{u.workoutGoal}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: QUY TẮC CỘNG ĐỒNG DISCI                               */}
      {/* ============================================================== */}
      {isGuidelinesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Quy tắc ứng xử cộng đồng DISCI</h3>
              </div>
              <button onClick={() => setIsGuidelinesOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Cộng đồng DISCI là không gian an toàn, văn minh nhằm khuyến khích sinh viên và người có ngân sách hạn chế rèn luyện sức khỏe tại nhà.
              </p>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">1. An toàn sức khỏe trên hết</div>
                <p>Tuyệt đối không khuyến khích tập quá sức khi đang đau khớp hoặc có cảnh báo y tế từ bác sĩ.</p>
                <div className="font-bold text-slate-900">2. Tôn trọng quyền riêng tư</div>
                <p>Không hỏi hoặc phát tán thông tin bệnh án, chỉ số nhạy cảm của người khác.</p>
                <div className="font-bold text-slate-900">3. Cổ vũ lành mạnh & Không quảng cáo rác</div>
                <p>Nghiêm cấm chào mời thuốc giảm cân, thực phẩm chức năng không rõ nguồn gốc hoặc lừa đảo.</p>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setIsGuidelinesOpen(false)}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Tôi đã hiểu & Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: XEM HỒ SƠ NGƯỜI DÙNG KHÁC (PREVIEW USER DRAWER)       */}
      {/* ============================================================== */}
      {previewedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={previewedUser.avatarUrl}
                  alt={previewedUser.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{previewedUser.fullName}</h3>
                  <div className="text-xs text-slate-400">{previewedUser.handle}</div>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">{previewedUser.workoutGoal}</div>
                </div>
              </div>

              <button onClick={() => setPreviewUserId(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {previewedUser.bio || 'Chưa cập nhật tiểu sử'}
            </p>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-slate-400 block text-[11px]">Chuỗi kiên trì</span>
                <span className="font-black text-slate-900 text-base">{previewedUser.streakDays} ngày</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-slate-400 block text-[11px]">Bạn chung</span>
                <span className="font-black text-slate-900 text-base">{previewedUser.mutualFriendsCount} người</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {previewedUser.isFriend ? (
                <button
                  onClick={() => {
                    handleRemoveFriend(previewedUser.id);
                    setPreviewUserId(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100"
                >
                  Hủy kết bạn
                </button>
              ) : previewedUser.friendRequestStatus === 'pending_sent' ? (
                <button
                  onClick={() => {
                    handleCancelFriendRequest(previewedUser.id);
                    setPreviewUserId(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy lời mời
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleSendFriendRequest(previewedUser.id);
                    setPreviewUserId(null);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                >
                  Kết bạn
                </button>
              )}

              <button
                onClick={() => {
                  handleBlockUser(previewedUser.id);
                  setPreviewUserId(null);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 bg-slate-100 rounded-xl"
                title="Chặn người này"
              >
                Chặn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: REPORT DIALOG
// ==========================================
interface ReportDialogProps {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ title, onClose, onSubmit }) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lý do báo cáo:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="spam">Nội dung rác hoặc quảng cáo (Spam)</option>
              <option value="misleading_health">Thông tin y tế hoặc tập luyện sai lệch nguy hiểm</option>
              <option value="harassment">Quấy rối, công kích cá nhân hoặc khiếm nhã</option>
              <option value="inappropriate">Nội dung phản cảm, không phù hợp</option>
              <option value="other">Lý do khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chi tiết giải thích:</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Vui lòng cung cấp thêm chi tiết để đội ngũ kiểm duyệt xem xét..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit(reason, details)}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
          >
            Gửi báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CREATE GROUP DIALOG
// ==========================================
interface CreateGroupDialogProps {
  onClose: () => void;
  onCreateGroup: (group: CommunityGroup) => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ onClose, onCreateGroup }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rule1, setRule1] = useState('Tôn trọng và cổ vũ bạn cùng phòng tập.');
  const [rule2, setRule2] = useState('Tập đúng form và tuân thủ an toàn y tế.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newGroup: CommunityGroup = {
      id: `group_${Date.now()}`,
      name: name.trim(),
      coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
      description: description.trim() || 'Nhóm tập luyện chia sẻ kinh nghiệm tại nhà.',
      isPrivate,
      membersCount: 1,
      memberIds: ['user_disci_001'],
      adminIds: ['user_disci_001'],
      rules: [rule1, rule2].filter(Boolean),
      createdAt: new Date().toISOString().split('T')[0],
      isUserMember: true,
      pendingJoinRequest: false
    };

    onCreateGroup(newGroup);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-base text-slate-900">Tạo nhóm tập luyện mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên nhóm:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hội tập xà đơn sinh viên..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả nhóm:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục đích nhóm, không gian tập, trang thiết bị khuyến khích..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="privateCheck"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="privateCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Nhóm riêng tư (Chỉ thành viên được duyệt mới xem được bài viết)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quy tắc sinh hoạt nhóm:</label>
            <input
              type="text"
              value={rule1}
              onChange={(e) => setRule1(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs mb-1.5"
            />
            <input
              type="text"
              value={rule2}
              onChange={(e) => setRule2(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              Tạo nhóm ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
