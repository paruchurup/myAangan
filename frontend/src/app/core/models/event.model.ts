// event.model.ts
export type EventStatus = 'DRAFT' | 'VOTING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface SocietyEvent {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  venue: string;
  estimatedBudget: number;
  quorumPct: number;
  voteDeadline: string;
  status: EventStatus;
  createdBy: any;
  recognitionJson: string;
  surplusNote: string;
  createdAt: string;
}

export interface EventVolunteerSlot {
  id: number;
  roleName: string;
  roleDescription: string;
  maxVolunteers: number;
}

export interface EventDetail {
  event: SocietyEvent;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  hasVoted: boolean;
  myVote: 'YES' | 'NO' | null;
  raised: number;
  spent: number;
  volunteerSlots: { slot: EventVolunteerSlot; signupCount: number; isFull: boolean; isSignedUp: boolean }[];
  expenses: any[];
  contributions: any[];
  hasSurplusVoted: boolean;
  surplusResults: { CARRY_FORWARD: number; DONATE: number; REFUND: number; total: number };
}

export const EVENT_STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string; icon: string }> = {
  DRAFT:     { label: 'Draft',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '📝' },
  VOTING:    { label: 'Voting',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '🗳️' },
  APPROVED:  { label: 'Approved',  color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
  REJECTED:  { label: 'Rejected',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '❌' },
  ACTIVE:    { label: 'Active',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '🎉' },
  COMPLETED: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🏆' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '🚫' },
};
