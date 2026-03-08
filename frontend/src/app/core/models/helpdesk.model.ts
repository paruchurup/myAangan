export type ServiceCategory = 'PLUMBING' | 'ELECTRICAL' | 'HOUSEKEEPING' | 'OTHER';
export type ServiceRequestStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface ServiceRequest {
  id: number;
  resident: any;
  category: ServiceCategory;
  title: string;
  description: string;
  preferredDatetime: string;
  confirmedDatetime: string;
  assignedStaffName: string;
  assignedStaffContact: string;
  fmNote: string;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_CONFIG: Record<ServiceCategory, { label: string; icon: string; color: string }> = {
  PLUMBING:     { label: 'Plumbing',    icon: '🔧', color: '#3b82f6' },
  ELECTRICAL:   { label: 'Electrical',  icon: '⚡', color: '#f59e0b' },
  HOUSEKEEPING: { label: 'Housekeeping',icon: '🧹', color: '#10b981' },
  OTHER:        { label: 'Other',       icon: '🛠️', color: '#8b5cf6' },
};

export const STATUS_CONFIG: Record<ServiceRequestStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:     { label: 'Pending',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '⏳' },
  ASSIGNED:    { label: 'Assigned',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '👷' },
  IN_PROGRESS: { label: 'In Progress', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: '🔨' },
  DONE:        { label: 'Done',        color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '✅' },
  CANCELLED:   { label: 'Cancelled',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '🚫' },
};
