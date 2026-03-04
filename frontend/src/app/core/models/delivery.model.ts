export type DeliveryType   = 'FOOD' | 'PARCEL' | 'COURIER' | 'DOCUMENT' | 'OTHER';
export type DeliveryStatus = 'ARRIVED' | 'NOTIFIED' | 'COLLECTED' | 'RETURNED';

export interface Delivery {
  id: number;
  flatNumber: string;
  block: string;
  residentName: string;
  residentId: number;
  residentFound: boolean;

  deliveryType: DeliveryType;
  deliveryTypeLabel: string;
  senderName: string;
  description: string;

  status: DeliveryStatus;
  statusLabel: string;

  loggedByName: string;
  collectedBy: string;
  residentNote: string;

  // OTP state (Phase 3B)
  otpPending: boolean;
  otpInitiatedBy: 'GUARD' | 'RESIDENT' | null;
  otpVerified: boolean;

  // Resident delivery preferences shown to guard (Phase 3B)
  residentDeliveryNote: string;
  residentPreferredCollector: string;
  residentDefaultCollector: string;
  residentDndActive: boolean;
  residentDndWindow: string;

  createdAt: string;
  notifiedAt: string;
  collectedAt: string;
}

export interface DeliveryRequest {
  flatNumber: string;
  block?: string;
  deliveryType: DeliveryType;
  senderName?: string;
  description?: string;
}

export interface DeliveryStatusUpdateRequest {
  status: DeliveryStatus;
  collectedBy?: string;
  residentNote?: string;
}

export const DELIVERY_TYPES: { value: DeliveryType; label: string }[] = [
  { value: 'FOOD',     label: '🍔 Food' },
  { value: 'PARCEL',   label: '📦 Parcel' },
  { value: 'COURIER',  label: '✉️ Courier' },
  { value: 'DOCUMENT', label: '📄 Document' },
  { value: 'OTHER',    label: '📬 Other' },
];

export interface DeliveryPreferences {
  deliveryNote: string;
  preferredCollector: string;
  dndStart: string;
  dndEnd: string;
  defaultCollectorName: string;
  dndActive: boolean;
}

export interface OtpGenerateResponse {
  otp: string;
  initiatedBy: 'GUARD' | 'RESIDENT';
  expiresAt: string;
  deliveryId: number;
}
