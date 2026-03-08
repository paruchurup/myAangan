import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ── Helper ────────────────────────────────────────────────────────────────────
function permGuard(...permissions: string[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn() && auth.canAny(...permissions)) return true;
    router.navigate([auth.isLoggedIn() ? '/dashboard' : '/auth/login']);
    return false;
  };
}

// ── Base guards ───────────────────────────────────────────────────────────────
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) return true;
  router.navigate(['/dashboard']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  router.navigate(['/dashboard']);
  return false;
};

// ── Feature guards — driven purely by permissions, no role lists ──────────────
export const serviceGuard         = permGuard('SERVICE_VIEW', 'SERVICE_ADD', 'SERVICE_MANAGE');
export const deliveryGuard        = permGuard('DELIVERY_VIEW_OWN', 'DELIVERY_VIEW_ALL', 'DELIVERY_LOG');
export const guardOnlyGuard       = permGuard('DELIVERY_LOG', 'DELIVERY_VIEW_ALL');
export const residentGuard        = permGuard('DELIVERY_VIEW_OWN');
export const complaintRaiserGuard = permGuard('COMPLAINT_RAISE');
export const fmGuard              = permGuard('COMPLAINT_MANAGE');
export const bmGuard              = permGuard('COMPLAINT_ESCALATE');
export const presidentGuard       = permGuard('COMPLAINT_PDF');
export const pollManageGuard      = permGuard('POLL_MANAGE');
export const noticeManageGuard    = permGuard('NOTICE_MANAGE');
export const vehicleManageGuard   = permGuard('VEHICLE_MANAGE');
export const guardGuard           = permGuard('VISITOR_VEHICLE_LOG');
export const maintenanceManageGuard = permGuard('MAINTENANCE_MANAGE');
export const analyticsGuard           = permGuard('ANALYTICS_VIEW');
export const helpdeskManageGuard      = permGuard('HELPDESK_MANAGE');
export const vaultGuard               = permGuard('VAULT_VIEW', 'VAULT_NOC_REQUEST', 'VAULT_UPLOAD');
export const vaultUploadGuard         = permGuard('VAULT_UPLOAD');
