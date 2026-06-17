import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, MessageSquare } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppScrollableTabs } from '@/components/common/AppScrollableTabs';
import { AppAvatar, AppCard } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';
import { AppStateFeedback } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchForumPostsThunk } from '@/store/slices/forumSlice';
import { paths } from '@/routes/paths';
import type { ForumPost } from '@/services/forum/forumService';

type PostTab = 'announcements' | 'discussion';

const postTabs = [
  { value: 'announcements', label: 'Announcements', icon: Bell },
  { value: 'discussion', label: 'Discussion', icon: MessageSquare },
];

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

const postTypeBadge: Record<string, { label: string; className: string }> = {
  ANNOUNCEMENT: { label: 'Announcement', className: 'bg-[#D4AF37]/20 text-[#92720C]' },
  GENERAL: { label: 'General', className: 'bg-[#EEF4FF] text-[#123B8D]' },
  PRAYER: { label: 'Prayer', className: 'bg-emerald-50 text-emerald-700' },
  EVENT: { label: 'Event', className: 'bg-purple-50 text-purple-700' },
};

const ForumPostListPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<PostTab>('discussion');

  const forums = useAppSelector((state) => state.forum.items);
  const posts = useAppSelector((state) => state.forum.posts);
  const postsMeta = useAppSelector((state) => state.forum.postsMeta);
  const postsLoading = useAppSelector((state) => state.forum.postsLoading);
  const postsLoadingMore = useAppSelector((state) => state.forum.postsLoadingMore);
  const postsError = useAppSelector((state) => state.forum.postsError);
  const postsLoadMoreError = useAppSelector((state) => state.forum.postsLoadMoreError);

  const forum = useMemo(() => forums.find((f) => f.id === forumId), [forums, forumId]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'announcements') return posts.filter((p) => p.postType === 'ANNOUNCEMENT');
    return posts.filter((p) => p.postType !== 'ANNOUNCEMENT');
  }, [posts, activeTab]);

  const hasMore = Boolean(postsMeta && postsMeta.page < postsMeta.totalPages);
  const nextPage = (postsMeta?.page ?? 1) + 1;
  const isInitialLoading = postsLoading && !posts.length;
  console.log('ForumPostListPage render', {  posts, postsLoading, postsLoadingMore, postsError, postsLoadMoreError });

  useEffect(() => {
    if (forumId) {
      void dispatch(fetchForumPostsThunk({ forumId, page: 1, limit: 20 }));
    }
  }, [dispatch, forumId]);

  const loadMorePosts = useCallback(() => {
    if (!hasMore || postsLoadingMore || !forumId) return;

    void dispatch(fetchForumPostsThunk({ forumId, page: nextPage, limit: postsMeta?.limit ?? 20 }));
  }, [dispatch, forumId, hasMore, postsLoadingMore, postsMeta?.limit, nextPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || postsLoading || postsLoadingMore || postsLoadMoreError || postsError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        void loadMorePosts();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMorePosts, postsError, postsLoadMoreError, postsLoading, postsLoadingMore]);

  const renderPost = (post: ForumPost) => {
    const badge = postTypeBadge[post.postType] ?? postTypeBadge.GENERAL;
    const authorName = post.author?.displayName ?? 'Unknown';
    const avatarUrl = post.author?.avatarUrl ?? undefined;

    return (
      <AppCard key={post.id} className="shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <AppAvatar name={authorName} src={avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <AppText variant="bodySmall" className="font-semibold text-[#0B1F4A]">
                  {authorName}
                </AppText>
                {post.isPinned && (
                  <span className="text-xs font-semibold text-[#D4AF37]">Pinned</span>
                )}
                <span className="text-xs text-[#8A96AA]">{formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <AppText variant="bodyMedium" className="font-semibold text-[#0B1F4A] mb-1">
            {post.title}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary" className="line-clamp-3">
            {post.content}
          </AppText>
        </div>
      </AppCard>
    );
  };

  return (
    <AppShell
      mobileHeaderAddon={
        <div className="min-w-0 bg-white/95 backdrop-blur-xl">
          <div className="min-w-0 border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-[78rem] px-4 py-4 sm:px-6 md:px-9">
              <AppButton
                leftIcon={<ArrowLeft />}
                variant="ghost"
                className="max-w-full overflow-hidden"
                onClick={() => navigate(paths.forum)}
              >
                {forum?.title ?? 'Forum'}
              </AppButton>
            </div>
          </div>
          <AppScrollableTabs
            tabs={postTabs}
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as PostTab)}
            ariaLabel="Post type tabs"
            fullWidthTabs
          />
        </div>
      }
    >
      <main className="min-w-0">
        <section className="mx-auto max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          {isInitialLoading && (
            <AppStateFeedback state="loading" label="Loading posts" className="min-h-44" />
          )}

          {postsError && !posts.length && !isInitialLoading && (
            <AppStateFeedback
              state="error"
              title="Unable to load posts"
              description={postsError}
              retrying={postsLoading}
              className="min-h-44"
              onRetry={() => {
                if (forumId) void dispatch(fetchForumPostsThunk({ forumId, page: 1, limit: 20 }));
              }}
            />
          )}

          {!isInitialLoading && !postsError && !filteredPosts.length && (
            <AppStateFeedback
              state="empty"
              title={`No ${activeTab === 'announcements' ? 'announcements' : 'discussions'} yet`}
              description={`There are no ${activeTab === 'announcements' ? 'announcements' : 'discussions'} in this forum yet.`}
              className="min-h-44"
            />
          )}

          {!isInitialLoading && !postsError && filteredPosts.length > 0 && (
            <>
              <div className="grid gap-4">{filteredPosts.map((post) => renderPost(post))}</div>

              {hasMore && !postsLoadMoreError && (
                <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
                  {postsLoadingMore ? (
                    <AppStateFeedback state="loading" label="Loading more posts" className="min-h-16" />
                  ) : (
                    <span className="text-xs font-semibold text-[#8A96AA]">Scroll for more</span>
                  )}
                </div>
              )}

              {postsLoadMoreError && (
                <div className="grid gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
                  <AppText variant="bodySmall" color="#B91C1C">
                    {postsLoadMoreError}
                  </AppText>
                  <AppButton loading={postsLoadingMore} size="sm" variant="outline" onClick={() => void loadMorePosts()}>
                    Retry
                  </AppButton>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
};

export default ForumPostListPage;
