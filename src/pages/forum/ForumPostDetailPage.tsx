import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppAvatar, AppCard } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';
import { AppStateFeedback } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPostCommentsThunk, createCommentThunk } from '@/store/thunks/forumThunk';
import { paths } from '@/routes/paths';
import type { ForumComment } from '@/services/forum/forumService';

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

const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const postTypeBadge: Record<string, { label: string; className: string }> = {
  ANNOUNCEMENT: { label: 'Announcement', className: 'bg-[#D4AF37]/20 text-[#92720C]' },
  GENERAL: { label: 'General', className: 'bg-[#EEF4FF] text-[#123B8D]' },
  PRAYER: { label: 'Prayer', className: 'bg-emerald-50 text-emerald-700' },
  EVENT: { label: 'Event', className: 'bg-purple-50 text-purple-700' },
};

const ForumPostDetailPage = () => {
  const { forumId, postId } = useParams<{ forumId: string; postId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState('');

  const posts = useAppSelector((state) => state.forum.posts);
  const comments = useAppSelector((state) => state.forum.comments);
  const commentsLoading = useAppSelector((state) => state.forum.commentsLoading);
  const commentsError = useAppSelector((state) => state.forum.commentsError);
  const creatingComment = useAppSelector((state) => state.forum.creatingComment);
  const createCommentError = useAppSelector((state) => state.forum.createCommentError);
  const currentProfileId = useAppSelector((state) => state.member.data?.basicProfile.id);

  const post = posts.find((p) => p.id === postId);

  useEffect(() => {
    if (postId) {
      void dispatch(fetchPostCommentsThunk({ postId }));
    }
  }, [dispatch, postId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSend = useCallback(() => {
    const trimmed = commentText.trim();
    if (!trimmed || !postId || creatingComment) return;

    void dispatch(createCommentThunk({ postId, content: trimmed }));
    setCommentText('');
  }, [commentText, postId, creatingComment, dispatch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const badge = post ? (postTypeBadge[post.postType] ?? postTypeBadge.GENERAL) : null;

  const renderComment = (comment: ForumComment) => {
    const authorName = comment.author?.displayName ?? 'Unknown';
    const avatarUrl = comment.author?.avatarUrl ?? undefined;
    const isOwn = comment.authorId === currentProfileId;

    return (
      <div key={comment.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[80%] items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isOwn && <AppAvatar name={authorName} src={avatarUrl} size="sm" />}
          <div className="min-w-0">
            {!isOwn && (
              <AppText variant="caption" className="mb-1 font-semibold text-[#0B1F4A]">
                {authorName}
              </AppText>
            )}
            <div
              className={`rounded-2xl px-4 py-2.5 ${
                isOwn
                  ? 'rounded-br-md bg-[#D4AF37] text-white'
                  : 'rounded-bl-md bg-[#123B8D] text-white'
              }`}
            >
              <AppText variant="bodySmall" color="inherit">
                {comment.content}
              </AppText>
            </div>
            <AppText
              variant="caption"
              className={`mt-1 block text-[#8A96AA] ${isOwn ? 'text-right' : 'text-left'}`}
            >
              {formatCommentDate(comment.createdAt)}
            </AppText>
          </div>
        </div>
      </div>
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
                onClick={() => navigate(forumId ? paths.forumDetails(forumId) : paths.forum)}
              >
                {post?.title ?? 'Post'}
              </AppButton>
            </div>
          </div>
        </div>
      }
    >
      <main className="min-w-0 flex h-[calc(100dvh-4rem)] flex-col">
        <div className="flex-1 overflow-y-auto">
          <section className="mx-auto max-w-[78rem] px-4 py-6 sm:px-6 md:px-9">
            {post && (
              <AppCard className="mb-6 shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
                <div className="flex items-start gap-3 mb-3">
                  <AppAvatar
                    name={post.author?.displayName ?? 'Unknown'}
                    src={post.author?.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AppText variant="bodySmall" className="font-semibold text-[#0B1F4A]">
                        {post.author?.displayName ?? 'Unknown'}
                      </AppText>
                      <span className="text-xs text-[#8A96AA]">
                        {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  {badge && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <AppText variant="bodyMedium" className="font-semibold text-[#0B1F4A] mb-1">
                  {post.title}
                </AppText>
                <AppText variant="bodySmall" color="textSecondary">
                  {post.content}
                </AppText>
              </AppCard>
            )}

            {commentsLoading && (
              <AppStateFeedback state="loading" label="Loading comments" className="min-h-24" />
            )}

            {commentsError && !comments.length && (
              <AppStateFeedback
                state="error"
                title="Unable to load comments"
                description={commentsError}
                className="min-h-24"
                onRetry={() => {
                  if (postId) void dispatch(fetchPostCommentsThunk({ postId }));
                }}
              />
            )}

            {!commentsLoading && !commentsError && !comments.length && (
              <AppStateFeedback
                state="empty"
                title="No comments yet"
                description="Be the first to comment."
                className="min-h-24"
              />
            )}

            {comments.length > 0 && (
              <div className="grid gap-3">
                {comments.map((comment) => renderComment(comment))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </section>
        </div>

        <div className="border-t border-[#E5E7EB] bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-[78rem]">
            {createCommentError && (
              <AppText variant="caption" color="#B91C1C" className="mb-2 block">
                {createCommentError}
              </AppText>
            )}
            <div className="flex items-end gap-2">
              <textarea
                className="min-h-[2.5rem] max-h-24 flex-1 resize-none rounded-xl border border-[#D6DEEB] bg-[#F8FAFE] px-4 py-2.5 text-sm text-[#0B1F4A] placeholder-[#8A96AA] outline-none transition focus:border-[#123B8D] focus:ring-2 focus:ring-[#123B8D]/10"
                placeholder="Write a comment..."
                rows={1}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={creatingComment}
              />
              <AppButton
                size="sm"
                className="shrink-0 rounded-full"
                disabled={!commentText.trim() || creatingComment}
                loading={creatingComment}
                onClick={handleSend}
              >
                <Send className="size-4" />
              </AppButton>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default ForumPostDetailPage;
