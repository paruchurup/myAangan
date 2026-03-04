export type NoticeType     = 'GENERAL' | 'MAINTENANCE' | 'EVENT' | 'EMERGENCY' | 'RULE_CHANGE' | 'FINANCIAL';
export type NoticePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NoticeStatus   = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface NoticeAttachment {
  id: number;
  originalName: string;
  fileType: 'IMAGE' | 'PDF' | 'DOCUMENT';
  fileSize: number;
  downloadUrl: string;
}

export interface NoticeComment {
  id: number;
  authorName: string;
  authorRole: string;
  authorFlat: string;
  text: string;
  createdAt: string;
  canDelete: boolean;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  type: NoticeType;
  priority: NoticePriority;
  status: NoticeStatus;
  pinned: boolean;
  requiresAcknowledgement: boolean;
  targetBlocks: string;
  publishAt: string;
  expiresAt: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  createdByRole: string;
  read: boolean;
  acknowledged: boolean;
  readCount: number;
  acknowledgedCount: number;
  attachments: NoticeAttachment[];
  comments: NoticeComment[];
  new: boolean;
}

export const NOTICE_TYPE_CONFIG: Record<NoticeType, { label: string; icon: string; accent: string }> = {
  GENERAL:     { label: 'General',     icon: '📋', accent: '#3b82f6' },
  MAINTENANCE: { label: 'Maintenance', icon: '🔧', accent: '#f59e0b' },
  EVENT:       { label: 'Event',       icon: '🎉', accent: '#8b5cf6' },
  EMERGENCY:   { label: 'Emergency',   icon: '🚨', accent: '#ef4444' },
  RULE_CHANGE: { label: 'Rule Change', icon: '📜', accent: '#06b6d4' },
  FINANCIAL:   { label: 'Financial',   icon: '💰', accent: '#10b981' },
};

export const NOTICE_PRIORITY_CONFIG: Record<NoticePriority, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Low',    color: '#6b7280', bg: '#f3f4f6' },
  NORMAL: { label: 'Normal', color: '#374151', bg: '#f9fafb' },
  HIGH:   { label: 'High',   color: '#92400e', bg: '#fef3c7' },
  URGENT: { label: 'Urgent', color: '#7f1d1d', bg: '#fee2e2' },
};
