export type PollType         = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'RATING';
export type PollStatus       = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type ResultVisibility = 'AFTER_VOTE' | 'AFTER_CLOSE' | 'ADMIN_ONLY';

export interface PollOption {
  id: number;
  text: string;
  emoji: string;
  displayOrder: number;
  voteCount: number;    // -1 if not visible yet
  percentage: number;   // -1 if not visible yet
}

export interface PollComment {
  id: number;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  canDelete: boolean;
}

export interface PollResults {
  optionVoteCounts:  Record<number, number>;
  optionPercentages: Record<number, number>;
  yesCount:    number;
  noCount:     number;
  abstainCount:number;
  averageRating: number | null;
  ratingDistribution: Record<number, number>;
  voters: VoterInfo[] | null;
}

export interface VoterInfo {
  name:     string;
  role:     string;
  flat:     string;
  votedFor: string;
  votedAt:  string;
}

export interface Poll {
  id: number;
  question: string;
  description: string;
  type: PollType;
  status: PollStatus;
  resultVisibility: ResultVisibility;
  startsAt:    string;
  endsAt:      string;
  closedAt:    string;
  publishedAt: string;
  createdAt:   string;
  anonymous:       boolean;
  allowVoteChange: boolean;
  allowComments:   boolean;
  maxChoices:      number;
  targetBlocks:    string;
  createdByName:   string;
  createdByRole:   string;
  options:  PollOption[];
  comments: PollComment[];
  totalVoters:   number;
  totalVotes:    number;
  hasVoted:      boolean;
  myOptionIds:   number[];
  myYesNoValue:  string;
  myRatingValue: number;
  results:        PollResults | null;
  resultsVisible: boolean;
  secondsRemaining: number | null;
}

export const POLL_TYPE_CONFIG: Record<PollType, { label: string; icon: string }> = {
  SINGLE_CHOICE:   { label: 'Single Choice',   icon: '⭕' },
  MULTIPLE_CHOICE: { label: 'Multiple Choice', icon: '☑️' },
  YES_NO:          { label: 'Yes / No',        icon: '👍' },
  RATING:          { label: 'Star Rating',     icon: '⭐' },
};

export const POLL_STATUS_CONFIG: Record<PollStatus, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: '#92400e', bg: '#fef3c7' },
  ACTIVE:   { label: 'Active',   color: '#166534', bg: '#dcfce7' },
  CLOSED:   { label: 'Closed',   color: '#1e40af', bg: '#dbeafe' },
  ARCHIVED: { label: 'Archived', color: '#6b7280', bg: '#f3f4f6' },
};
