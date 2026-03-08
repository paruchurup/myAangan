// ── Types ────────────────────────────────────────────────────────────────────
export type VehicleType   = 'CAR' | 'BIKE' | 'SCOOTER' | 'OTHER';
export type VehicleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type SlotType      = 'CAR' | 'BIKE' | 'VISITOR' | 'RESERVED';
export type SlotStatus    = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type ViolationType = 'WRONG_SLOT' | 'NO_STICKER' | 'BLOCKING' | 'DOUBLE_PARKED' | 'VISITOR_OVERSTAY' | 'OTHER';
export type ViolationStatus = 'OPEN' | 'ACTION_REQUIRED' | 'PENDING_CONFIRMATION' | 'RESOLVED';

export interface Vehicle {
  id: number;
  plateNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  colour: string;
  year: string;
  status: VehicleStatus;
  adminNote: string;
  photoUrl: string;
  ownerName: string;
  ownerFlat: string;
  ownerBlock: string;
  ownerPhone: string;
  assignedSlotId: number;
  assignedSlotLabel: string;
  violationCount: number;
  createdAt: string;
  approvedAt: string;
}

export interface SlotVehicleInfo {
  id: number;
  plate: string;
  type: string;
  description: string;
  ownerName: string;
  ownerFlat: string;
}
export interface ParkingSlot {
  id: number;
  block: string;
  slotNumber: string;
  level: string;
  type: SlotType;
  status: SlotStatus;
  notes: string;
  label: string;
  vehicles: SlotVehicleInfo[];
  vehicleId: number;
  vehiclePlate: string;
  vehicleDescription: string;
  vehicleOwnerName: string;
  vehicleOwnerFlat: string;
  vehicleCount: number;
  createdAt: string;
}

export interface VisitorVehicle {
  id: number;
  plateNumber: string;
  vehicleDescription: string;
  hostFlat: string;
  visitorName: string;
  visitorPhone: string;
  slot: ParkingSlot;
  loggedBy: any;
  enteredAt: string;
  exitedAt: string;
  notes: string;
}

export interface ParkingViolation {
  status: ViolationStatus;
  id: number;
  vehicle: Vehicle;
  plateNumber: string;
  slot: ParkingSlot;
  violationType: ViolationType;
  description: string;
  photoPath: string;
  reportedBy: any;
  resolved: boolean;
  ownerNotifiedAt: string;
  ownerActionAt: string;
  resolutionNote: string;
  resolvedAt: string;
  reportedAt: string;
}

export interface ParkingStats {
  totalSlots: number;
  occupied: number;
  available: number;
  pendingApproval: number;
  registeredVehicles: number;
  visitorsNow: number;
  openViolations: number;
}

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: '#92400e', bg: '#fef3c7' },
  APPROVED:  { label: 'Approved',  color: '#065f46', bg: '#d1fae5' },
  REJECTED:  { label: 'Rejected',  color: '#991b1b', bg: '#fee2e2' },
  SUSPENDED: { label: 'Suspended', color: '#7c3aed', bg: '#ede9fe' },
};

export const VEHICLE_TYPE_CONFIG: Record<VehicleType, { label: string; icon: string }> = {
  CAR:    { label: 'Car',     icon: '🚗' },
  BIKE:   { label: 'Bike',    icon: '🏍️' },
  SCOOTER:{ label: 'Scooter', icon: '🛵' },
  OTHER:  { label: 'Other',   icon: '🚙' },
};

export const SLOT_STATUS_CONFIG: Record<SlotStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:   { label: 'Free',        color: '#065f46', bg: '#d1fae5' },
  OCCUPIED:    { label: 'Occupied',    color: '#991b1b', bg: '#fee2e2' },
  RESERVED:    { label: 'Reserved',    color: '#92400e', bg: '#fef3c7' },
  MAINTENANCE: { label: 'Maintenance', color: '#374151', bg: '#f3f4f6' },
};

export const VIOLATION_TYPE_CONFIG: Record<ViolationType, { label: string; icon: string }> = {
  WRONG_SLOT:       { label: 'Wrong Slot',       icon: '🔀' },
  NO_STICKER:       { label: 'No Sticker',        icon: '🏷️' },
  BLOCKING:         { label: 'Blocking',           icon: '🚧' },
  DOUBLE_PARKED:    { label: 'Double Parked',      icon: '⛔' },
  VISITOR_OVERSTAY: { label: 'Visitor Overstay',   icon: '⏰' },
  OTHER:            { label: 'Other',              icon: '⚠️' },
};

export interface ParkingNotification {
  id: number;
  message: string;
  read: boolean;
  readAt: string;
  createdAt: string;
  violation: ParkingViolation;
}

export const VIOLATION_STATUS_CONFIG: Record<ViolationStatus, { label: string; color: string; icon: string }> = {
  OPEN:                 { label: 'Open',                color: '#ef4444', icon: '⚠️' },
  ACTION_REQUIRED:      { label: 'Action Required',     color: '#f59e0b', icon: '🚨' },
  PENDING_CONFIRMATION: { label: 'Pending Confirmation', color: '#3b82f6', icon: '⏳' },
  RESOLVED:             { label: 'Resolved',            color: '#10b981', icon: '✅' },
};

// ── Visitor Pass models ───────────────────────────────────────────────────────
export type PassType         = 'ONE_TIME' | 'STANDING';
export type PassStatus       = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
export type PassCheckInStatus = 'CHECKED_IN' | 'OVERRIDE';

export interface VisitorPass {
  id: number;
  token: string;
  createdBy: any;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  passType: PassType;
  status: PassStatus;
  // ONE_TIME
  validDate: string;
  windowStart: string;
  windowEnd: string;
  // STANDING
  allowedDays: string;   // comma-separated day numbers "1,2,3"
  standingFrom: string;
  standingUntil: string;
  notes: string;
  logs: VisitorPassLog[];
  createdAt: string;
}

export interface VisitorPassLog {
  id: number;
  checkedInBy: any;
  checkInStatus: PassCheckInStatus;
  overrideReason: string;
  checkedInAt: string;
}

export interface PassValidationResult {
  valid: boolean;
  pass: VisitorPass | null;
  errorReason: string | null;
}

export const PASS_STATUS_CONFIG: Record<PassStatus, { label: string; color: string; bg: string; icon: string }> = {
  ACTIVE:    { label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '✅' },
  USED:      { label: 'Used',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '☑️'  },
  EXPIRED:   { label: 'Expired',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '⏰' },
  CANCELLED: { label: 'Cancelled', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: '✕'  },
};

export const DAY_NAMES: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'
};
