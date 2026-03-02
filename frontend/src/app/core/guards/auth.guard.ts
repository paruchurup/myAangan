import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn()) return true;
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn() && authService.isAdmin()) return true;
  router.navigate(['/dashboard']);
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isLoggedIn()) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Services: Admin, Resident, Guard only (no Visitor)
export const serviceGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN', 'RESIDENT', 'SECURITY_GUARD'].includes(user.role)) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Delivery - Guard + Admin can log; Resident can view own
export const deliveryGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN', 'RESIDENT', 'SECURITY_GUARD'].includes(user.role)) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Guard-only routes
export const guardOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN', 'SECURITY_GUARD'].includes(user.role)) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Resident-only routes
export const residentGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN', 'RESIDENT'].includes(user.role)) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Complaint guards
export const complaintRaiserGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN','RESIDENT','SECURITY_GUARD','FACILITY_MANAGER'].includes(user.role)) return true;
  router.navigate(['/dashboard']); return false;
};

export const fmGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN','FACILITY_MANAGER'].includes(user.role)) return true;
  router.navigate(['/dashboard']); return false;
};

export const bmGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN','BUILDER_MANAGER','BDA_ENGINEER'].includes(user.role)) return true;
  router.navigate(['/dashboard']); return false;
};

export const presidentGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (user && ['ADMIN','PRESIDENT','SECRETARY','VOLUNTEER'].includes(user.role)) return true;
  router.navigate(['/dashboard']); return false;
};
