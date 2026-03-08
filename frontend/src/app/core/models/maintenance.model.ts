// maintenance.model.ts
export type BillStatus = 'UNPAID' | 'PAID' | 'WAIVED' | 'PARTIALLY_PAID';

export interface MaintenanceBill {
  id: number;
  flatKey: string;
  resident: any;
  billYear: number;
  billMonth: number;
  baseAmount: number;
  penaltyAmount: number;
  interestAmount: number;
  totalAmount: number;
  dueDate: string;
  status: BillStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  receiptPath: string;
  waiverNote: string;
  paidAt: string;
  createdAt: string;
}

export interface MaintenanceConfig {
  monthlyAmount: number;
  dueDayOfMonth: number;
  latePenaltyFlat: number;
  lateInterestPct: number;
  razorpayKeyId: string;
  razorpayKeySecret?: string;
  societyName: string;
}

export interface OutstandingInfo {
  unpaidCount: number;
  totalOutstanding: number;
  bills: MaintenanceBill[];
}

export const BILL_STATUS_CONFIG: Record<BillStatus, { label: string; color: string; bg: string; icon: string }> = {
  UNPAID:          { label: 'Unpaid',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: '⚠️' },
  PAID:            { label: 'Paid',          color: '#10b981', bg: 'rgba(16,185,129,0.12)',   icon: '✅' },
  WAIVED:          { label: 'Waived',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  icon: '🎁' },
  PARTIALLY_PAID:  { label: 'Partial',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: '⏳' },
};

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
