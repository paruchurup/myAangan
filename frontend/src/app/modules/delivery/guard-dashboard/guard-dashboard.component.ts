import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '@services/delivery.service';
import { Delivery, OtpGenerateResponse } from '@models/delivery.model';

@Component({
  selector: 'app-guard-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/dashboard">← Back</a>
          <a routerLink="/delivery/log" class="btn-log">+ Log New</a>
        </div>
        <h1>🚪 Gate Deliveries</h1>
        <p>Today's incoming deliveries</p>
        <div class="summary-row" style="margin-top:12px">
          <div class="summary-chip total"><span class="chip-num">{{ deliveries.length }}</span><span class="chip-lbl">Today</span></div>
          <div class="summary-chip pending"><span class="chip-num">{{ pendingCount }}</span><span class="chip-lbl">Pending</span></div>
          <div class="summary-chip done"><span class="chip-num">{{ collectedCount }}</span><span class="chip-lbl">Collected</span></div>
        </div>
      </div>

      <div class="filter-tabs">
        <button class="tab" [class.active]="filter==='ALL'"       (click)="setFilter('ALL')">All</button>
        <button class="tab" [class.active]="filter==='PENDING'"   (click)="setFilter('PENDING')">Pending</button>
        <button class="tab" [class.active]="filter==='COLLECTED'" (click)="setFilter('COLLECTED')">Collected</button>
        <button class="tab" [class.active]="filter==='RETURNED'"  (click)="setFilter('RETURNED')">Returned</button>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

      <div class="empty-state" *ngIf="!loading && filtered.length === 0">
        <div class="empty-icon">📭</div>
        <p>No deliveries {{ filter === 'ALL' ? 'today' : 'in this category' }}</p>
        <a routerLink="/delivery/log" class="btn-primary">Log First Delivery</a>
      </div>

      <div class="list" *ngIf="!loading && filtered.length > 0">
        <div class="delivery-card" *ngFor="let d of filtered">

          <div class="card-top">
            <div class="type-badge">{{ d.deliveryTypeLabel }}</div>
            <div class="status-badge" [class]="d.status.toLowerCase()">{{ d.statusLabel }}</div>
          </div>

          <div class="flat-row">
            <span class="flat-num">🏠 {{ d.block ? d.block + '-' : '' }}{{ d.flatNumber }}</span>
            <span class="resident-name">{{ d.residentName }}</span>
          </div>

          <div class="meta-row">
            <span *ngIf="d.senderName">📤 {{ d.senderName }}</span>
            <span *ngIf="d.description">· {{ d.description }}</span>
            <span class="time">{{ d.createdAt | date:'h:mm a' }}</span>
          </div>

          <!-- Resident preferences (shown if linked) -->
          <div class="prefs-panel" *ngIf="d.residentFound && hasPrefs(d)">
            <!-- DND Warning -->
            <div class="dnd-warning" *ngIf="d.residentDndActive">
              🔕 DND active {{ d.residentDndWindow }} — resident may not respond
            </div>
            <div class="pref-row" *ngIf="d.residentDeliveryNote">
              <span class="pref-icon">📝</span>
              <span>{{ d.residentDeliveryNote }}</span>
            </div>
            <div class="pref-row" *ngIf="d.residentPreferredCollector">
              <span class="pref-icon">👤</span>
              <span>{{ d.residentPreferredCollector }}</span>
            </div>
          </div>

          <!-- Resident note -->
          <div class="resident-note" *ngIf="d.residentNote">
            💬 <em>{{ d.residentNote }}</em>
          </div>

          <!-- OTP pending banner -->
          <div class="otp-pending-banner" *ngIf="d.otpPending && d.otpInitiatedBy === 'RESIDENT'">
            🔑 Resident has generated an OTP — enter it below to confirm collection
          </div>

          <!-- Action area -->
          <div class="action-area" *ngIf="d.status === 'ARRIVED' || d.status === 'NOTIFIED'">

            <!-- Default actions -->
            <ng-container *ngIf="activeCard !== d.id">
              <div class="card-actions">
                <button class="btn-collected"   (click)="startCollect(d)">✅ Collect</button>
                <button class="btn-otp"         (click)="startOtp(d)">🔑 OTP</button>
                <button class="btn-returned"    (click)="markReturned(d)">↩️ Return</button>
              </div>
            </ng-container>

            <!-- Collect form -->
            <div class="collect-form" *ngIf="activeCard === d.id && activeMode === 'collect'">
              <div class="form-header"><span>📋 Who is collecting?</span><button class="cancel-btn" (click)="cancelAction()">✕</button></div>
              <div class="quick-picks">
                <button class="quick-btn" *ngFor="let opt of getQuickPicks(d)"
                  [class.selected]="collectorName === opt"
                  (click)="collectorName = opt">{{ opt }}</button>
              </div>
              <input type="text" [(ngModel)]="collectorName" placeholder="Or type collector's name..." class="collector-input" />
              <button class="btn-confirm" [disabled]="!collectorName.trim() || saving" (click)="confirmCollect(d)">
                {{ saving ? 'Saving...' : '✅ Confirm Collection' }}
              </button>
            </div>

            <!-- OTP mode — Guard generates OTP to show resident -->
            <div class="otp-form" *ngIf="activeCard === d.id && activeMode === 'otp-generate'">
              <div class="form-header"><span>🔑 OTP Verification</span><button class="cancel-btn" (click)="cancelAction()">✕</button></div>

              <!-- If no OTP pending from resident, guard generates one -->
              <ng-container *ngIf="!d.otpPending || d.otpInitiatedBy !== 'RESIDENT'">
                <p class="otp-sub">Generate an OTP to show the resident on their phone app</p>
                <button class="btn-gen-otp" (click)="generateGuardOtp(d)" [disabled]="saving">
                  {{ saving ? 'Generating...' : '🎲 Generate OTP for Resident' }}
                </button>
                <div class="otp-divider">— or enter OTP shown by resident —</div>
              </ng-container>

              <!-- OTP display after guard generates -->
              <div class="otp-display" *ngIf="generatedOtp && generatedOtp.deliveryId === d.id && generatedOtp.initiatedBy === 'GUARD'">
                <div class="otp-label">Show this to the resident:</div>
                <div class="otp-code">{{ generatedOtp.otp }}</div>
                <div class="otp-timer">Expires in {{ otpCountdown }}s</div>
              </div>

              <!-- Enter OTP box (guard enters OTP shown by resident) -->
              <div class="otp-enter">
                <input type="text" [(ngModel)]="enteredOtp" placeholder="Enter 6-digit OTP"
                  maxlength="6" class="otp-input" inputmode="numeric" />
                <button class="btn-verify-otp" (click)="verifyOtp(d)"
                  [disabled]="enteredOtp.length !== 6 || saving">
                  {{ saving ? 'Verifying...' : '✅ Verify & Collect' }}
                </button>
              </div>
              <div class="otp-err" *ngIf="otpError">{{ otpError }}</div>
            </div>
          </div>

          <!-- Collected info -->
          <div class="collected-info" *ngIf="d.status === 'COLLECTED'">
            ✅ Collected by <strong>{{ d.collectedBy || 'Resident' }}</strong>
            {{ d.collectedAt | date:'h:mm a' }}
            <span class="otp-badge" *ngIf="d.otpVerified">🔑 OTP verified</span>
          </div>

          <div class="returned-info" *ngIf="d.status === 'RETURNED'">↩️ Returned to sender</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .btn-log { background: #e94560; color: white; padding: 9px 16px; border-radius: 20px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .summary-row { display: flex; gap: 10px; }
    .summary-chip { flex: 1; border-radius: 12px; padding: 10px 8px; text-align: center; }
    .summary-chip.total   { background: rgba(255,255,255,0.15); }
    .summary-chip.pending { background: rgba(245,158,11,0.3); }
    .summary-chip.done    { background: rgba(34,197,94,0.3); }
    .chip-num { display: block; font-size: 22px; font-weight: 700; }
    .chip-lbl { font-size: 11px; opacity: 0.8; }
    .filter-tabs { display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; scrollbar-width: none; }
    .filter-tabs::-webkit-scrollbar { display: none; }
    .tab { padding: 7px 16px; border-radius: 20px; border: 1.5px solid #ddd; background: white; font-size: 13px; cursor: pointer; white-space: nowrap; color: #555; }
    .tab.active { background: #0f3460; color: white; border-color: #0f3460; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #0f3460; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: #555; margin-bottom: 20px; }
    .btn-primary { background: #0f3460; color: white; padding: 10px 24px; border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600; }
    .list { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .delivery-card { background: white; border-radius: 14px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .type-badge { font-size: 13px; font-weight: 600; color: #0f3460; background: #e8f0fe; padding: 4px 10px; border-radius: 10px; }
    .status-badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 10px; }
    .status-badge.arrived   { background: #fef3c7; color: #92400e; }
    .status-badge.notified  { background: #dbeafe; color: #1e40af; }
    .status-badge.collected { background: #dcfce7; color: #166534; }
    .status-badge.returned  { background: #fee2e2; color: #991b1b; }
    .flat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .flat-num { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .resident-name { font-size: 13px; color: #666; }
    .meta-row { font-size: 12px; color: #888; display: flex; gap: 6px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
    .time { margin-left: auto; font-weight: 600; color: #555; }

    /* Preferences panel */
    .prefs-panel { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
    .dnd-warning { font-size: 13px; color: #991b1b; font-weight: 600; margin-bottom: 6px; }
    .pref-row { display: flex; gap: 8px; font-size: 13px; color: #555; padding: 3px 0; }
    .pref-icon { width: 20px; flex-shrink: 0; }
    .resident-note { background: #f0f4ff; border-radius: 8px; padding: 8px 10px; font-size: 13px; color: #3730a3; margin-bottom: 8px; }
    .otp-pending-banner { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #166534; font-weight: 600; margin-bottom: 8px; }

    /* Action area */
    .action-area { border-top: 1px solid #f0f0f0; padding-top: 12px; }
    .card-actions { display: flex; gap: 6px; }
    .btn-collected, .btn-otp, .btn-returned {
      flex: 1; padding: 9px 4px; border: none; border-radius: 10px;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .btn-collected { background: #dcfce7; color: #166534; }
    .btn-otp       { background: #ede9fe; color: #5b21b6; }
    .btn-returned  { background: #fee2e2; color: #991b1b; }

    /* Collect form */
    .collect-form, .otp-form { background: #f8f9ff; border-radius: 12px; padding: 14px; border: 1.5px solid #c7d2fe; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .cancel-btn { background: none; border: none; color: #888; font-size: 16px; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .quick-picks { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .quick-btn { padding: 7px 12px; border: 1.5px solid #c7d2fe; border-radius: 20px; background: white; font-size: 12px; cursor: pointer; color: #3730a3; }
    .quick-btn.selected { background: #0f3460; color: white; border-color: #0f3460; }
    .collector-input, .otp-input {
      width: 100%; padding: 10px 12px; border: 1.5px solid #ddd;
      border-radius: 10px; font-size: 14px; outline: none;
      box-sizing: border-box; margin-bottom: 10px; background: white;
    }
    .otp-input { font-size: 20px; text-align: center; letter-spacing: 8px; font-weight: 700; }
    .collector-input:focus, .otp-input:focus { border-color: #0f3460; }
    .btn-confirm, .btn-gen-otp, .btn-verify-otp {
      width: 100%; padding: 11px; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 8px;
    }
    .btn-confirm    { background: #166534; color: white; }
    .btn-gen-otp    { background: #5b21b6; color: white; }
    .btn-verify-otp { background: #166534; color: white; }
    .btn-confirm:disabled, .btn-gen-otp:disabled, .btn-verify-otp:disabled { background: #ccc; cursor: not-allowed; }

    .otp-sub { font-size: 13px; color: #888; margin: 0 0 10px; }
    .otp-divider { text-align: center; font-size: 12px; color: #aaa; margin: 10px 0; }
    .otp-display { background: #1a1a2e; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 12px; }
    .otp-label { font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
    .otp-code { font-size: 44px; font-weight: 900; color: white; letter-spacing: 12px; font-family: monospace; }
    .otp-timer { font-size: 12px; color: #f59e0b; margin-top: 8px; }
    .otp-err { font-size: 13px; color: #991b1b; background: #fee2e2; padding: 8px 10px; border-radius: 8px; margin-top: 6px; }

    .collected-info { font-size: 13px; color: #166534; background: #f0fdf4; padding: 8px 10px; border-radius: 8px; border-top: 1px solid #f0f0f0; margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .otp-badge { background: #7c3aed; color: white; font-size: 11px; padding: 2px 8px; border-radius: 10px; }
    .returned-info { font-size: 13px; color: #991b1b; background: #fff5f5; padding: 8px 10px; border-radius: 8px; border-top: 1px solid #f0f0f0; margin-top: 10px; }
  `]
})
export class GuardDashboardComponent implements OnInit {
  deliveries: Delivery[] = [];
  filter: 'ALL' | 'PENDING' | 'COLLECTED' | 'RETURNED' = 'ALL';
  loading = true;
  today   = new Date();

  // Active card state
  activeCard: number | null = null;
  activeMode: 'collect' | 'otp-generate' | null = null;

  // Collect
  collectorName = '';
  saving = false;

  // OTP
  generatedOtp: OtpGenerateResponse | null = null;
  enteredOtp   = '';
  otpError     = '';
  otpCountdown = 600;
  private otpTimer: any;

  get filtered(): Delivery[] {
    if (this.filter === 'PENDING')   return this.deliveries.filter(d => d.status === 'ARRIVED' || d.status === 'NOTIFIED');
    if (this.filter === 'COLLECTED') return this.deliveries.filter(d => d.status === 'COLLECTED');
    if (this.filter === 'RETURNED')  return this.deliveries.filter(d => d.status === 'RETURNED');
    return this.deliveries;
  }
  get pendingCount()   { return this.deliveries.filter(d => d.status === 'ARRIVED' || d.status === 'NOTIFIED').length; }
  get collectedCount() { return this.deliveries.filter(d => d.status === 'COLLECTED').length; }

  constructor(private svc: DeliveryService) {}

  ngOnInit() { this.load(); }
  ngOnDestroy() { clearInterval(this.otpTimer); }

  load() {
    this.loading = true;
    this.svc.getTodaysDeliveries().subscribe({
      next: r => { this.deliveries = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  setFilter(f: typeof this.filter) { this.filter = f; }

  hasPrefs(d: Delivery): boolean {
    return !!(d.residentDeliveryNote || d.residentPreferredCollector || d.residentDndActive);
  }

  getQuickPicks(d: Delivery): string[] {
    const base = ['Resident', 'Family Member', 'Maid / Domestic Help', 'Neighbour', 'Watchman'];
    if (d.residentDefaultCollector) return [d.residentDefaultCollector, ...base.filter(b => b !== d.residentDefaultCollector)];
    return base;
  }

  startCollect(d: Delivery) {
    this.activeCard = d.id; this.activeMode = 'collect';
    this.collectorName = d.residentDefaultCollector || 'Resident';
    this.otpError = '';
  }

  startOtp(d: Delivery) {
    this.activeCard = d.id; this.activeMode = 'otp-generate';
    this.enteredOtp = ''; this.otpError = ''; this.generatedOtp = null;
  }

  cancelAction() {
    this.activeCard = null; this.activeMode = null;
    this.collectorName = ''; this.enteredOtp = ''; this.otpError = '';
    clearInterval(this.otpTimer);
  }

  confirmCollect(d: Delivery) {
    if (!this.collectorName.trim()) return;
    this.saving = true;
    this.svc.updateStatus(d.id, { status: 'COLLECTED', collectedBy: this.collectorName.trim() }).subscribe({
      next: () => { this.saving = false; this.cancelAction(); this.load(); },
      error: () => { this.saving = false; }
    });
  }

  generateGuardOtp(d: Delivery) {
    this.saving = true;
    this.svc.generateGuardOtp(d.id).subscribe({
      next: r => {
        this.saving = false;
        this.generatedOtp = r.data;
        this.otpCountdown = 600;
        clearInterval(this.otpTimer);
        this.otpTimer = setInterval(() => {
          this.otpCountdown--;
          if (this.otpCountdown <= 0) { clearInterval(this.otpTimer); this.generatedOtp = null; }
        }, 1000);
      },
      error: () => { this.saving = false; }
    });
  }

  verifyOtp(d: Delivery) {
    if (this.enteredOtp.length !== 6) return;
    this.saving = true; this.otpError = '';
    this.svc.verifyOtp(d.id, this.enteredOtp).subscribe({
      next: () => { this.saving = false; this.cancelAction(); this.load(); },
      error: err => {
        this.saving = false;
        this.otpError = err.error?.message || 'Invalid or expired OTP';
      }
    });
  }

  markReturned(d: Delivery) {
    if (!confirm(`Mark delivery for flat ${d.flatNumber} as returned?`)) return;
    this.svc.updateStatus(d.id, { status: 'RETURNED' }).subscribe({ next: () => this.load() });
  }
}
