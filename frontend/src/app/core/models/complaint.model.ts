export type ComplaintStatus = 'OPEN'|'ACKNOWLEDGED'|'IN_PROGRESS'|'RESOLVED'|'CLOSED'|'REJECTED';
export type ComplaintCategory = 'WATER_PLUMBING'|'ELECTRICAL'|'SECURITY'|'LIFT_ELEVATOR'|
  'CLEANING_HOUSEKEEPING'|'STRUCTURAL_LEAKAGE'|'COMMON_AREA_PARKING'|'OTHER';
export type EscalationLevel = 'FACILITY_MANAGER'|'BUILDER_MANAGER'|'BDA_ENGINEER';
export type AttachmentType = 'IMAGE'|'PDF'|'VIDEO'|'DOCUMENT';

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  categoryLabel: string;
  status: ComplaintStatus;
  statusLabel: string;
  escalationLevel: EscalationLevel;
  escalationLabel: string;
  slaDueAt: string;
  slaBreached: boolean;
  raisedByName: string;
  raisedByRole: string;
  raisedByFlat: string;
  assignedToName: string;
  flatNumber: string;
  block: string;
  locationDescription: string;
  rejectionReason: string;
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string;
  resolvedAt: string;
  closedAt: string;
  attachments: AttachmentInfo[];
  comments: CommentInfo[];
  history: HistoryInfo[];
  attachmentCount: number;
  commentCount: number;
}

export interface AttachmentInfo {
  id: number;
  filename: string;
  originalName: string;
  type: AttachmentType;
  fileSize: number;
  mimeType: string;
  uploadedByName: string;
  uploadedAt: string;
  url: string;
}

export interface CommentInfo {
  id: number;
  text: string;
  authorName: string;
  authorRole: string;
  internal: boolean;
  createdAt: string;
}

export interface HistoryInfo {
  action: string;
  oldValue: string;
  newValue: string;
  performedBy: string;
  createdAt: string;
}

export const COMPLAINT_CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'WATER_PLUMBING',        label: '💧 Water / Plumbing' },
  { value: 'ELECTRICAL',            label: '⚡ Electrical' },
  { value: 'SECURITY',              label: '🔒 Security' },
  { value: 'LIFT_ELEVATOR',         label: '🛗 Lift / Elevator' },
  { value: 'CLEANING_HOUSEKEEPING', label: '🧹 Cleaning / Housekeeping' },
  { value: 'STRUCTURAL_LEAKAGE',    label: '🏗️ Structural / Leakage' },
  { value: 'COMMON_AREA_PARKING',   label: '🅿️ Common Area / Parking' },
  { value: 'OTHER',                 label: '📋 Other' },
];

export const STATUS_CONFIG: Record<ComplaintStatus, { color: string; bg: string; label: string }> = {
  OPEN:         { color: '#991b1b', bg: '#fee2e2', label: '🔴 Open' },
  ACKNOWLEDGED: { color: '#92400e', bg: '#fef3c7', label: '🟡 Acknowledged' },
  IN_PROGRESS:  { color: '#1e40af', bg: '#dbeafe', label: '🔵 In Progress' },
  RESOLVED:     { color: '#166534', bg: '#dcfce7', label: '🟢 Resolved' },
  CLOSED:       { color: '#374151', bg: '#f3f4f6', label: '⚫ Closed' },
  REJECTED:     { color: '#6b7280', bg: '#f3f4f6', label: '❌ Rejected' },
};
