import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard, serviceGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login',    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/user/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/user/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'services',
    canActivate: [authGuard, serviceGuard],
    children: [
      { path: '',     loadComponent: () => import('./modules/services/services-list/services-list.component').then(m => m.ServicesListComponent) },
      { path: 'add',  loadComponent: () => import('./modules/services/add-provider/add-provider.component').then(m => m.AddProviderComponent) },
      { path: 'mine', loadComponent: () => import('./modules/services/my-providers/my-providers.component').then(m => m.MyProvidersComponent) },
      { path: ':id',  loadComponent: () => import('./modules/services/provider-detail/provider-detail.component').then(m => m.ProviderDetailComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'users',      loadComponent: () => import('./modules/admin/user-list/user-list.component').then(m => m.UserListComponent) },
      { path: 'pending',    loadComponent: () => import('./modules/admin/pending-users/pending-users.component').then(m => m.PendingUsersComponent) },
      { path: 'categories', loadComponent: () => import('./modules/admin/categories/categories.component').then(m => m.CategoriesComponent) }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
