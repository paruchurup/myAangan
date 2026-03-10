import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { DeliveryService } from '@services/delivery.service';
import { User } from '@models/user.model';
import {MaintenanceService} from "@services/maintenance.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"]
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
