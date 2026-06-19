export type NotificationType =
  | 'user.email-verification.completed'
  | 'user.email-verification.initiated'
  | 'user.forgot-password.initiated'
  | 'user.forgot-password.completed'
  | 'user.account-deletion.initiated'
  | 'user.account-deletion.completed'
  | 'wallet.pin-reset.initiated'
  | 'wallet.pin-reset.completed'
  | 'pastor.request.created'
  | 'pastor.approved'
  | 'pastor.rejected'
  | 'pastor.revoked'
  | 'pastor.profile.updated'
  | 'pastor.role.changed'
  | 'church.event.created'
  | 'church.update-request.approved'
  | 'church.update-request.rejected'
  | 'member.membership.approved'
  | 'member.membership.rejected'
  | 'member.devotion.reminder'
  | 'member.bible-study.reminder'
  | 'member.removed.from-church'
  | 'member.membership.request.revoked'
  | 'forum.post.submission.pending'
  | 'forum.post.submission.approved'
  | 'forum.post.submission.rejected'
  | 'transaction.completed'
  | 'transaction.failed'
  | 'transaction.pending';

export type NotificationResourceType =
  | 'transaction'
  | 'member'
  | 'church'
  | 'pastor'
  | 'user'
  | 'wallet'
  | 'forum'
  | string;

export interface NotificationData {
  currency?: string;
  amountTotal?: number;
  paymentMethod?: string;
  churchId?: string;
  postId?: string;
  forumId?: string;
  forumType?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface RealtimeNotification {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  resourceType: NotificationResourceType;
  resourceId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  data: NotificationData;
  channels: string[];
  readAt: string | null;
  deliveredAt: string | null;
}

export type FilterCategory =
  | 'all'
  | 'unread'
  | 'user'
  | 'church'
  | 'member'
  | 'transaction'
  | 'forum'
  | 'wallet'
  | 'pastor';
