// ── Types ────────────────────────────────────────────────────────────────────
export type VehicleType   = 'CAR' | 'BIKE' | 'SCOOTER' | 'OTHER';
export type VehicleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type SlotType      = 'CAR' | 'BIKE' | 'VISITOR' | 'RESERVED';
export type SlotStatus    = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type ViolationType = 'WRONG_SLOT' | 'NO_STICKER' | 'BLOCKING' | 'DOUBLE_PARKED' | 'VISITOR_OVERSTAY' | 'OTHER';

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
  id: number;
  vehicle: Vehicle;
  plateNumber: string;
  slot: ParkingSlot;
  violationType: ViolationType;
  description: string;
  photoPath: string;
  reportedBy: any;
  resolved: boolean;
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
