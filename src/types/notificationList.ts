export type NotificationListType =
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

export interface NotificationListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  resourceType: NotificationResourceType;
  resourceId: string;
  type: NotificationListType | string;
  title: string;
  body: string;
  data: NotificationData;
  channels: string[];
  readAt: string | null;
  deliveredAt: string | null;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  status: boolean;
  message: string;
  data: {
    items: NotificationListItem[];
    meta: NotificationListMeta;
  };
}

export interface UnreadCountResponse {
  status: boolean;
  message: string;
  data: {
    count: number;
  };
}

export type NotificationListFilterCategory =
  | 'all'
  | 'unread'
  | 'user'
  | 'church'
  | 'member'
  | 'transaction'
  | 'forum'
  | 'wallet'
  | 'pastor';
