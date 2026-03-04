export type Role =
  | 'ADMIN'
  | 'SECURITY_GUARD'
  | 'RESIDENT'
  | 'VISITOR'
  | 'FACILITY_MANAGER'
  | 'BUILDER_MANAGER'
  | 'BDA_ENGINEER'
  | 'PRESIDENT'
  | 'SECRETARY'
  | 'VOLUNTEER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  status: UserStatus;
  flatNumber?: string;
  block?: string;
  societyName?: string;
  hostFlatNumber?: string;
  permissions: string[];  // dynamic — populated at login
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  flatNumber?: string;
  block?: string;
  societyName?: string;
  hostFlatNumber?: string;
}

export interface UpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  flatNumber?: string;
  block?: string;
  societyName?: string;
  hostFlatNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
