import { Routes } from '@angular/router';
import {
  authGuard,
  adminGuard,
  guestGuard,
  serviceGuard,
  deliveryGuard,
  guardOnlyGuard,
  residentGuard,
  complaintRaiserGuard,
  fmGuard,
  bmGuard,
  presidentGuard,
  pollManageGuard,
  noticeManageGuard,
  vehicleManageGuard,
  guardGuard,
  analyticsGuard, maintenanceManageGuard
} from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'auth', canActivate: [guestGuard],
    children: [
      { path: 'login',    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password',  loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) }
    ]
  },

  {
    path: 'dashboard', canActivate: [authGuard],
    loadComponent: () => import('./modules/user/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile', canActivate: [authGuard],
    loadComponent: () => import('./modules/user/profile/profile.component').then(m => m.ProfileComponent)
  },

  // ── Services Directory ────────────────────────────────────────────────────
  {
    path: 'services', canActivate: [authGuard, serviceGuard],
    children: [
      { path: '',     loadComponent: () => import('./modules/services/services-list/services-list.component').then(m => m.ServicesListComponent) },
      { path: 'add',  loadComponent: () => import('./modules/services/add-provider/add-provider.component').then(m => m.AddProviderComponent) },
      { path: 'mine', loadComponent: () => import('./modules/services/my-providers/my-providers.component').then(m => m.MyProvidersComponent) },
      { path: ':id',  loadComponent: () => import('./modules/services/provider-detail/provider-detail.component').then(m => m.ProviderDetailComponent) }
    ]
  },

  // ── Delivery Management ───────────────────────────────────────────────────
  {
    path: 'delivery', canActivate: [authGuard, deliveryGuard],
    children: [
      { path: 'guard', canActivate: [guardOnlyGuard],
        loadComponent: () => import('./modules/delivery/guard-dashboard/guard-dashboard.component').then(m => m.GuardDashboardComponent) },
      { path: 'log', canActivate: [guardOnlyGuard],
        loadComponent: () => import('./modules/delivery/log-delivery/log-delivery.component').then(m => m.LogDeliveryComponent) },
      { path: 'my', canActivate: [residentGuard],
        loadComponent: () => import('./modules/delivery/my-deliveries/my-deliveries.component').then(m => m.MyDeliveriesComponent) },
      { path: 'preferences', canActivate: [residentGuard],
        loadComponent: () => import('./modules/delivery/delivery-preferences/delivery-preferences.component').then(m => m.DeliveryPreferencesComponent) },
      { path: 'all', canActivate: [adminGuard],
        loadComponent: () => import('./modules/delivery/admin-deliveries/admin-deliveries.component').then(m => m.AdminDeliveriesComponent) }
    ]
  },

  // ── Complaint Management ──────────────────────────────────────────────────
  {
    path: 'complaints', canActivate: [authGuard],
    children: [
      { path: 'my',
        loadComponent: () => import('./modules/complaints/my-complaints/my-complaints.component').then(m => m.MyComplaintsComponent) },
      { path: 'raise', canActivate: [complaintRaiserGuard],
        loadComponent: () => import('./modules/complaints/raise-complaint/raise-complaint.component').then(m => m.RaiseComplaintComponent) },
      { path: 'fm', canActivate: [fmGuard],
        loadComponent: () => import('./modules/complaints/fm-dashboard/fm-dashboard.component').then(m => m.FmDashboardComponent) },
      { path: 'bm', canActivate: [bmGuard],
        loadComponent: () => import('./modules/complaints/bm-dashboard/bm-dashboard.component').then(m => m.BmDashboardComponent) },
      { path: 'report', canActivate: [presidentGuard],
        loadComponent: () => import('./modules/complaints/president-report/president-report.component').then(m => m.PresidentReportComponent) },
      { path: ':id',
        loadComponent: () => import('./modules/complaints/complaint-detail/complaint-detail.component').then(m => m.ComplaintDetailComponent) }
    ]
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    path: 'vehicles', canActivate: [authGuard],
    children: [
      { path: '',       loadComponent: () => import('./modules/vehicles/my-vehicles/my-vehicles.component').then(m => m.MyVehiclesComponent) },
      { path: 'passes',  loadComponent: () => import('./modules/vehicles/my-passes/my-passes.component').then(m => m.MyPassesComponent) },
      { path: 'manage', canActivate: [vehicleManageGuard], loadComponent: () => import('./modules/vehicles/manage-vehicles/manage-vehicles.component').then(m => m.ManageVehiclesComponent) },
      { path: 'gate',   canActivate: [guardGuard],         loadComponent: () => import('./modules/vehicles/guard-vehicles/guard-vehicles.component').then(m => m.GuardVehiclesComponent) },
    ]
  },
  {
    path: 'events', canActivate: [authGuard],
    children: [
      { path: '',       loadComponent: () => import('./modules/events/event-list/event-list.component').then(m => m.EventListComponent) },
      { path: 'create', loadComponent: () => import('./modules/events/create-event/create-event.component').then(m => m.CreateEventComponent) },
      { path: ':id',    loadComponent: () => import('./modules/events/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
    ]
  },
  {
    path: 'analytics', canActivate: [authGuard, analyticsGuard],
    loadComponent: () => import('./modules/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent)
  },
  {
    path: 'maintenance', canActivate: [authGuard],
    children: [
      { path: '',       loadComponent: () => import('./modules/maintenance/my-maintenance/my-maintenance.component').then(m => m.MyMaintenanceComponent) },
      { path: 'manage', canActivate: [maintenanceManageGuard], loadComponent: () => import('./modules/maintenance/manage-maintenance/manage-maintenance.component').then(m => m.ManageMaintenanceComponent) },
    ]
  },
  {
    path: 'notices', canActivate: [authGuard],
    children: [
      { path: '',       loadComponent: () => import('./modules/notices/notice-feed/notice-feed.component').then(m => m.NoticeFeedComponent) },
      { path: 'create', canActivate: [noticeManageGuard], loadComponent: () => import('./modules/notices/create-notice/create-notice.component').then(m => m.CreateNoticeComponent) },
      { path: 'manage', canActivate: [noticeManageGuard], loadComponent: () => import('./modules/notices/manage-notices/manage-notices.component').then(m => m.ManageNoticesComponent) },
      { path: ':id',    loadComponent: () => import('./modules/notices/notice-detail/notice-detail.component').then(m => m.NoticeDetailComponent) },
    ]
  },
  {
    path: 'polls', canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/polls/poll-list/poll-list.component').then(m => m.PollListComponent) },
      { path: 'create', canActivate: [pollManageGuard], loadComponent: () => import('./modules/polls/create-poll/create-poll.component').then(m => m.CreatePollComponent) },
      { path: 'manage', canActivate: [pollManageGuard], loadComponent: () => import('./modules/polls/manage-polls/manage-polls.component').then(m => m.ManagePollsComponent) },
      { path: ':id', loadComponent: () => import('./modules/polls/poll-detail/poll-detail.component').then(m => m.PollDetailComponent) },
    ]
  },
  {
    path: 'admin', canActivate: [authGuard, adminGuard],
    children: [
      { path: 'users',      loadComponent: () => import('./modules/admin/user-list/user-list.component').then(m => m.UserListComponent) },
      { path: 'pending',    loadComponent: () => import('./modules/admin/pending-users/pending-users.component').then(m => m.PendingUsersComponent) },
      { path: 'categories',  loadComponent: () => import('./modules/admin/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'permissions', loadComponent: () => import('./modules/admin/permissions/permissions.component').then(m => m.PermissionsComponent) }
    ]
  },

  { path: '**', redirectTo: '/dashboard' }
];
