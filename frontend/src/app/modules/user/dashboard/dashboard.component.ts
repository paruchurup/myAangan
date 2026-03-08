import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { User } from '../../../core/models/user.model';
import {MaintenanceService} from "../../../core/services/maintenance.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">

      <!-- Welcome card -->
      <div class="welcome-card">
        <div class="welcome-icon">🏠</div>
        <div class="welcome-text">
          <h2>Welcome, {{ user?.firstName }}!</h2>
          <p class="role-badge" [class]="'role-' + user?.role?.toLowerCase()">
            {{ roleLabel(user?.role) }}
          </p>
          <p class="status" [class.active]="user?.status === 'ACTIVE'"
            [class.pending]="user?.status === 'PENDING_APPROVAL'">
            {{ user?.status === 'ACTIVE' ? '● Active' : '⏳ Pending Approval' }}
          </p>
        </div>
      </div>

      <!-- Pending approval notice -->
      <div class="notice" *ngIf="user?.status === 'PENDING_APPROVAL'">
        ⏳ Your account is pending admin approval. You'll get full access once approved.
      </div>

      <!-- Resident: Delivery pending alert -->
      <a class="delivery-alert" routerLink="/delivery/my"
        *ngIf="isResident && pendingDeliveryCount > 0">
        <div class="alert-icon">📦</div>
        <div class="alert-text">
          <strong>{{ pendingDeliveryCount }} delivery{{ pendingDeliveryCount > 1 ? 'ies' : '' }} waiting at the gate</strong>
          <span>Tap to view and acknowledge</span>
        </div>
        <div class="alert-badge">{{ pendingDeliveryCount }}</div>
      </a>

      <!-- Quick Actions -->
      <div class="quick-links" *ngIf="user?.status === 'ACTIVE'">
        <h3>Quick Actions</h3>
        <div class="grid">

          <!-- Resident actions -->
          <a routerLink="/delivery/my" class="action-card delivery" *ngIf="isResident">
            <div class="card-icon-wrap">
              <span class="icon">📦</span>
              <span class="badge" *ngIf="pendingDeliveryCount > 0">{{ pendingDeliveryCount }}</span>
            </div>
            <span>My Deliveries</span>
          </a>

          <!-- Guard actions -->
          <a routerLink="/delivery/guard" class="action-card delivery" *ngIf="isGuard">
            <span class="icon">🚪</span>
            <span>Gate Log</span>
          </a>
          <a routerLink="/delivery/log" class="action-card delivery" *ngIf="isGuard">
            <span class="icon">📦</span>
            <span>Log Delivery</span>
          </a>

          <!-- Services (non-visitor) -->
          <a routerLink="/services" class="action-card" *ngIf="!isVisitor">
            <span class="icon">🔧</span>
            <span>Services</span>
          </a>

          <!-- Profile always -->
          <a routerLink="/profile" class="action-card">
            <span class="icon">👤</span>
            <span>My Profile</span>
          </a>

          <!-- Admin actions -->
          <ng-container *ngIf="isAdmin">
            <a routerLink="/delivery/all"      class="action-card admin"><span class="icon">📊</span><span>Deliveries</span></a>
            <a routerLink="/admin/users"        class="action-card admin"><span class="icon">👥</span><span>Users</span></a>
            <a routerLink="/admin/categories"   class="action-card admin"><span class="icon">⚙️</span><span>Categories</span></a>
            <a routerLink="/admin/permissions" class="action-card admin"><span class="icon">🔐</span><span>Permissions</span></a>
            <a routerLink="/admin/pending"      class="action-card admin"><span class="icon">⏳</span><span>Approvals</span></a>
            <a routerLink="/complaints/fm"      class="action-card complaint"><span class="icon">📢</span><span>Complaints</span></a>
            <a routerLink="/complaints/report"  class="action-card complaint"><span class="icon">📄</span><span>PDF Report</span></a>
          </ng-container>

          <!-- Complaint: Raise for Resident & Guard -->
          <a routerLink="/complaints/my"    class="action-card complaint" *ngIf="isResident||isGuard"><span class="icon">📢</span><span>My Complaints</span></a>
          <a routerLink="/complaints/raise" class="action-card complaint" *ngIf="isResident||isGuard"><span class="icon">✏️</span><span>Report Issue</span></a>
          <a routerLink="/polls" class="action-card polls" *ngIf="canPollView"><span class="icon">🗳️</span><span>Polls &amp; Voting</span></a>
          <a [routerLink]="canVaultUpload ? '/vault/admin' : '/vault'" class="action-card vault" *ngIf="canVault"><span class="icon">📂</span><span>Vault</span></a>
          <a routerLink="/helpdesk" class="action-card helpdesk" *ngIf="canHelpdeskRaise"><span class="icon">🛠️</span><span>Helpdesk</span></a>
          <a routerLink="/helpdesk/manage" class="action-card helpdesk mgmt" *ngIf="canHelpdeskManage"><span class="icon">📋</span><span>Service Board</span></a>
          <a routerLink="/events" class="action-card events" *ngIf="canEventView"><span class="icon">🎉</span><span>Events</span></a>
          <a routerLink="/analytics" class="action-card analytics" *ngIf="canAnalytics"><span class="icon">📊</span><span>Analytics</span></a>
          <a routerLink="/maintenance" class="action-card maintenance" *ngIf="canMaintPay">
            <span class="icon">💰</span>
            <span>My Bills</span>
            <span class="badge-dot" *ngIf="hasOutstanding">{{ outstandingCount }}</span>
          </a>
          <a routerLink="/maintenance/manage" class="action-card maintenance mgmt" *ngIf="canMaintManage"><span class="icon">🏦</span><span>Maintenance</span></a>
          <a routerLink="/vehicles" class="action-card vehicles" *ngIf="canVehicleReg"><span class="icon">🚗</span><span>My Vehicles</span></a>
          <a routerLink="/vehicles/passes" class="action-card vehicles passes" *ngIf="canVehicleReg"><span class="icon">🎫</span><span>Visitor Passes</span></a>
          <a routerLink="/vehicles/manage" class="action-card vehicles mgmt" *ngIf="canVehicleManage"><span class="icon">🅿️</span><span>Parking Control</span></a>
          <a routerLink="/vehicles/gate" class="action-card vehicles guard" *ngIf="canGuardGate"><span class="icon">🔍</span><span>Gate Control</span></a>
          <a routerLink="/notices" class="action-card notices" *ngIf="canNoticeView"><span class="icon">📢</span><span>Notices</span></a>
          <a routerLink="/notices/manage" class="action-card notices mgmt" *ngIf="canNoticeManage"><span class="icon">📋</span><span>Post Notice</span></a>
          <a routerLink="/polls/manage" class="action-card polls mgmt" *ngIf="canPollManage"><span class="icon">⚙️</span><span>Manage Polls</span></a>

          <!-- FM cards -->
          <ng-container *ngIf="isFm">
            <a routerLink="/complaints/fm"    class="action-card complaint"><span class="icon">📢</span><span>All Complaints</span></a>
            <a routerLink="/complaints/raise" class="action-card complaint"><span class="icon">✏️</span><span>Raise Complaint</span></a>
            <a routerLink="/services"         class="action-card"><span class="icon">🛠️</span><span>Services</span></a>
          </ng-container>

          <!-- BM / BDA cards -->
          <ng-container *ngIf="isBm||isBda">
            <a routerLink="/complaints/bm"  class="action-card complaint"><span class="icon">🚨</span><span>{{ isBda ? 'BDA Complaints' : 'Escalated' }}</span></a>
            <a routerLink="/complaints/my"  class="action-card"><span class="icon">📋</span><span>My Complaints</span></a>
          </ng-container>

          <!-- President / Secretary / Volunteer cards -->
          <ng-container *ngIf="isPresident">
            <a routerLink="/complaints/report" class="action-card complaint"><span class="icon">🏛️</span><span>Complaint Report</span></a>
            <a routerLink="/complaints/my"     class="action-card"><span class="icon">📋</span><span>My Complaints</span></a>
          </ng-container>

        </div>
      </div>

      <!-- Account info -->
      <div class="info-card" *ngIf="user">
        <h3>Account Details</h3>
        <div class="info-row"><span>Email</span><strong>{{ user.email }}</strong></div>
        <div class="info-row"><span>Phone</span><strong>{{ user.phone || '—' }}</strong></div>
        <div class="info-row" *ngIf="user.flatNumber">
          <span>Flat</span>
          <strong>{{ user.block ? user.block + '-' : '' }}{{ user.flatNumber }}</strong>
        </div>
        <div class="info-row" *ngIf="user.societyName">
          <span>Society</span><strong>{{ user.societyName }}</strong>
        </div>
        <div class="info-row" *ngIf="user.hostFlatNumber">
          <span>Visiting</span><strong>{{ user.hostFlatNumber }}</strong>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard { max-width: 700px; margin: 0 auto; padding-bottom: 80px; }

    .welcome-card {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      border-radius: 0 0 20px 20px; padding: 28px 20px;
      color: white; display: flex; align-items: center; gap: 20px;
      margin-bottom: 16px;
    }
    .welcome-icon { font-size: 52px; }
    h2 { margin: 0 0 8px; font-size: 22px; }
    .role-badge {
      display: inline-block; padding: 3px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.2);
      margin: 0 0 6px; text-transform: capitalize;
    }
    .status { margin: 0; font-size: 13px; opacity: 0.85; }
    .status.active  { color: #86efac; }
    .status.pending { color: #fcd34d; }

    .notice {
      background: #fff8e1; border: 1px solid #fcd34d; border-radius: 12px;
      padding: 14px 20px; margin: 0 16px 16px; color: #92400e; font-size: 14px;
    }

    .delivery-alert {
      display: flex; align-items: center; gap: 12px;
      background: #fef3c7; border: 1.5px solid #f59e0b;
      border-radius: 14px; padding: 14px 16px;
      margin: 0 16px 16px; text-decoration: none;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
      50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
    }
    .alert-icon { font-size: 28px; }
    .alert-text { flex: 1; }
    .alert-text strong { display: block; font-size: 14px; color: #92400e; }
    .alert-text span   { font-size: 12px; color: #b45309; }
    .alert-badge {
      background: #f59e0b; color: white; font-size: 14px; font-weight: 700;
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }

    h3 { margin: 0 0 14px; color: #333; font-size: 16px; padding: 0 16px; }
    .quick-links { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 16px; }

    .action-card {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 18px 10px; background: white; border-radius: 14px;
      text-decoration: none; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      font-weight: 600; font-size: 13px; text-align: center;
      transition: transform 0.15s;
    }
    .action-card:active { transform: scale(0.96); }
    .action-card .icon  { font-size: 30px; }
    .action-card.admin    { border: 2px solid #e8eaf6; }
    .action-card.delivery { border: 2px solid #fde68a; }
    .action-card.complaint{ border: 2px solid #fca5a5; }

    .card-icon-wrap { position: relative; display: inline-block; }
    .badge {
      position: absolute; top: -6px; right: -10px;
      background: #e94560; color: white; font-size: 10px; font-weight: 700;
      min-width: 18px; height: 18px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center; padding: 0 4px;
    }

    .info-card {
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07); margin: 0 16px;
    }
    .info-card h3 { padding: 0; margin-bottom: 12px; }
    .info-row {
      display: flex; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row span   { color: #888; }
    .info-row strong { color: #1a1a2e; }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  isAdmin    = false;
  isResident = false;
  isGuard    = false;
  isVisitor  = false;
  isFm       = false;
  isBm       = false;
  isBda      = false;
  isPresident   = false;
  canPollView   = false;
  canPollManage   = false;
  canNoticeView   = false;
  canNoticeManage  = false;
  canVehicleReg    = false;
  canMaintPay      = false;
  canAnalytics     = false;
  canEventView     = false;
  canVault         = false;
  canVaultUpload   = false;
  canHelpdeskRaise  = false;
  canHelpdeskManage = false;
  canMaintManage   = false;
  hasOutstanding   = false;
  outstandingCount = 0;
  canVehicleManage = false;
  canGuardGate     = false;
  pendingDeliveryCount = 0;

  constructor(
    private auth: AuthService,
    private maintSvc: MaintenanceService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.user        = user;
      this.isAdmin     = user?.role === 'ADMIN';
      this.isVisitor   = user?.role === 'VISITOR';
      // All flags now derived from permissions — no hardcoded role lists
      this.isResident  = this.auth.canAny('DELIVERY_VIEW_OWN', 'COMPLAINT_VIEW_OWN');
      this.isGuard     = this.auth.canAny('DELIVERY_LOG', 'DELIVERY_VIEW_ALL');
      this.isFm        = this.auth.can('COMPLAINT_MANAGE');
      this.isBm        = this.auth.can('COMPLAINT_ESCALATE');
      this.isBda       = user?.role === 'BDA_ENGINEER'; // specific level
      this.isPresident  = this.auth.can('COMPLAINT_PDF');
      this.canPollView   = this.auth.can('POLL_VIEW');
      this.canPollManage   = this.auth.can('POLL_MANAGE');
      this.canNoticeView   = this.auth.can('NOTICE_VIEW');
      this.canNoticeManage  = this.auth.can('NOTICE_MANAGE');
      this.canVehicleReg    = this.auth.can('VEHICLE_REGISTER');
      this.canMaintPay     = this.auth.can('MAINTENANCE_PAY');
      if (this.canMaintPay) { this.maintSvc.getMyOutstanding().subscribe({ next: r => { this.hasOutstanding = r.data?.unpaidCount > 0; this.outstandingCount = r.data?.unpaidCount || 0; }, error: () => {} }); }
      this.canMaintManage  = this.auth.can('MAINTENANCE_MANAGE');
      this.canAnalytics    = this.auth.can('ANALYTICS_VIEW');
      this.canEventView      = this.auth.can('EVENT_VIEW');
      this.canHelpdeskRaise  = this.auth.can('HELPDESK_RAISE') || this.auth.can('HELPDESK_CREATE');
      this.canHelpdeskManage = this.auth.can('HELPDESK_MANAGE');
      this.canVehicleManage = this.auth.can('VEHICLE_MANAGE');
      this.canGuardGate     = this.auth.can('VISITOR_VEHICLE_LOG');
      this.canVault         = this.isAdmin || this.auth.can('VAULT_VIEW');
      this.canVaultUpload   = this.isAdmin || this.auth.can('VAULT_UPLOAD');

      // Load pending delivery count for residents
      if (this.isResident && user?.status === 'ACTIVE') {
        this.loadPendingCount();
      }
    });
  }

  loadPendingCount() {
    this.deliveryService.getPendingCount().subscribe({
      next: r => this.pendingDeliveryCount = r.data.count,
      error: () => {}
    });
  }

  roleLabel(role?: string): string {
    return {
      ADMIN: 'Admin', RESIDENT: 'Resident',
      SECURITY_GUARD: 'Security Guard', VISITOR: 'Visitor',
      FACILITY_MANAGER: 'Facility Manager', BUILDER_MANAGER: 'Builder Manager',
      BDA_ENGINEER: 'BDA Engineer', PRESIDENT: 'President',
      SECRETARY: 'Secretary', VOLUNTEER: 'Volunteer'
    }[role || ''] || role || '';
  }
}
