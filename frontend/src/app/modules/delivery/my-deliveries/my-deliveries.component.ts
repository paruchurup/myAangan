import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '@services/delivery.service';
import { Delivery, OtpGenerateResponse } from '@models/delivery.model';

@Component({
  selector: 'app-my-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <button class="back-btn" routerLink="/dashboard">← Back</button>
          <a routerLink="/delivery/preferences" class="prefs-btn">⚙️ Preferences</a>
        </div>
        <h1>📦 My Deliveries</h1>
        <p>Track parcels and packages at the gate</p>
      </div>

      <div class="pending-banner" *ngIf="pendingDeliveries.length > 0">
        <div class="banner-icon">🔔</div>
        <div class="banner-text">
          <strong>{{ pendingDeliveries.length }} delivery{{ pendingDeliveries.length > 1 ? 'ies' : '' }} waiting at the gate!</strong>
          <span>Please collect at your earliest convenience</span>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'pending'" (click)="activeTab = 'pending'">
          🔔 Pending
          <span class="badge" *ngIf="pendingDeliveries.length > 0">{{ pendingDeliveries.length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab === 'history'" (click)="loadHistory()">📋 History</button>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

      <!-- Pending tab -->
      <div class="list" *ngIf="!loading && activeTab === 'pending'">
        <div class="empty-state" *ngIf="pendingDeliveries.length === 0">
          <div class="empty-icon">✅</div>
          <p>No pending deliveries — all caught up!</p>
        </div>

        <div class="delivery-card" *ngFor="let d of pendingDeliveries">
          <div class="card-top">
            <span class="type-lbl">{{ d.deliveryTypeLabel }}</span>
            <span class="time-lbl">{{ d.createdAt | date:'h:mm a, MMM d' }}</span>
          </div>

          <div class="detail-rows">
            <div class="detail-row" *ngIf="d.senderName"><span>From</span><strong>{{ d.senderName }}</strong></div>
            <div class="detail-row" *ngIf="d.description"><span>Item</span><strong>{{ d.description }}</strong></div>
            <div class="detail-row"><span>Status</span><strong class="status" [class]="d.status.toLowerCase()">{{ d.statusLabel }}</strong></div>
            <div class="detail-row"><span>Logged by</span><strong>{{ d.loggedByName }}</strong></div>
          </div>

          <!-- OTP guard-generated — show code to enter on guard's screen -->
          <div class="otp-guard-display" *ngIf="d.otpPending && d.otpInitiatedBy === 'GUARD'">
            <div class="otp-label">Guard has generated an OTP. Enter it on the guard's screen:</div>
            <div class="otp-hint">Ask the guard to show you their screen to verify</div>
          </div>

          <!-- Action section -->
          <div class="action-section">

            <!-- Default: collect + OTP buttons -->
            <ng-container *ngIf="activeDeliveryId !== d.id">
              <div class="note-input">
                <input type="text" [(ngModel)]="notes[d.id]" placeholder="Add note (e.g. Wife will collect)" />
              </div>
              <div class="action-btns">
                <button class="btn-collect" (click)="markCollected(d)">✅ I'll Collect It</button>
                <button class="btn-otp" (click)="startOtp(d)">🔑 Generate OTP</button>
              </div>
            </ng-container>

            <!-- OTP generation screen for resident -->
            <div class="otp-panel" *ngIf="activeDeliveryId === d.id">
              <div class="otp-panel-header">
                <span>🔑 OTP for Gate Collection</span>
                <button class="cancel-btn" (click)="cancelOtp()">✕</button>
              </div>

              <!-- Before generating -->
              <ng-container *ngIf="!currentOtp || currentOtp.deliveryId !== d.id">
                <p class="otp-info">Generate a one-time code. Show it to the guard to confirm your parcel is collected.</p>
                <button class="btn-generate" (click)="generateOtp(d)" [disabled]="generatingOtp">
                  {{ generatingOtp ? 'Generating...' : '🎲 Generate OTP' }}
                </button>
              </ng-container>

              <!-- After generating — large code display -->
              <div class="otp-display" *ngIf="currentOtp && currentOtp.deliveryId === d.id">
                <div class="otp-display-label">Show this code to the guard:</div>
                <div class="otp-big-code">{{ currentOtp.otp }}</div>
                <div class="otp-expire-row">
                  <span class="otp-countdown" [class.urgent]="otpCountdown < 60">
                    ⏱ Expires in {{ formatCountdown(otpCountdown) }}
                  </span>
                </div>
                <button class="btn-regen" (click)="generateOtp(d)" [disabled]="generatingOtp">
                  🔄 Regenerate
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- History tab -->
      <div class="list" *ngIf="!loading && activeTab === 'history'">
        <div class="empty-state" *ngIf="history.length === 0">
          <div class="empty-icon">📭</div><p>No delivery history yet</p>
        </div>
        <div class="delivery-card history-card" *ngFor="let d of history">
          <div class="card-top">
            <span class="type-lbl">{{ d.deliveryTypeLabel }}</span>
            <span class="status-badge" [class]="d.status.toLowerCase()">{{ d.statusLabel }}</span>
          </div>
          <div class="detail-rows">
            <div class="detail-row" *ngIf="d.senderName"><span>From</span><strong>{{ d.senderName }}</strong></div>
            <div class="detail-row" *ngIf="d.description"><span>Item</span><strong>{{ d.description }}</strong></div>
            <div class="detail-row"><span>Arrived</span><strong>{{ d.createdAt | date:'MMM d, h:mm a' }}</strong></div>
            <div class="detail-row" *ngIf="d.collectedAt"><span>Collected</span><strong>{{ d.collectedAt | date:'MMM d, h:mm a' }}</strong></div>
            <div class="detail-row" *ngIf="d.collectedBy"><span>By</span><strong>{{ d.collectedBy }}</strong></div>
            <div class="detail-row" *ngIf="d.otpVerified"><span>Verified</span><strong>🔑 OTP verified</strong></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; }
    .prefs-btn { background: rgba(255,255,255,0.15); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; text-decoration: none; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; }
    .page-header p  { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .pending-banner { background: #fef3c7; border-bottom: 2px solid #f59e0b; padding: 12px 16px; display: flex; gap: 12px; align-items: center; }
    .banner-icon { font-size: 28px; }
    .banner-text strong { display: block; font-size: 14px; color: #92400e; }
    .banner-text span   { font-size: 12px; color: #b45309; }
    .tabs { display: flex; border-bottom: 2px solid #eee; background: white; }
    .tab { flex: 1; padding: 14px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #888; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab.active { color: #0f3460; border-bottom-color: #0f3460; }
    .badge { background: #e94560; color: white; font-size: 11px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #0f3460; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 48px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: #555; margin: 0; }
    .list { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .delivery-card { background: white; border-radius: 14px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #f59e0b; }
    .history-card  { border-left-color: #e5e7eb; }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .type-lbl { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .time-lbl { font-size: 12px; color: #aaa; }
    .status-badge { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 8px; }
    .status-badge.arrived   { background: #fef3c7; color: #92400e; }
    .status-badge.notified  { background: #dbeafe; color: #1e40af; }
    .status-badge.collected { background: #dcfce7; color: #166534; }
    .status-badge.returned  { background: #fee2e2; color: #991b1b; }
    .detail-rows { display: flex; flex-direction: column; margin-bottom: 12px; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .detail-row:last-child { border: none; }
    .detail-row span   { color: #888; }
    .detail-row strong { color: #1a1a2e; }
    .status.arrived  { color: #92400e; }
    .status.notified { color: #1e40af; }
    .otp-guard-display { background: #ede9fe; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; font-size: 13px; color: #5b21b6; }
    .otp-label { font-weight: 600; margin-bottom: 4px; }
    .otp-hint { font-size: 12px; opacity: 0.8; }
    .action-section { border-top: 1px solid #f0f0f0; padding-top: 12px; }
    .note-input { margin-bottom: 8px; }
    .note-input input { width: 100%; padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; }
    .note-input input:focus { border-color: #0f3460; }
    .action-btns { display: flex; gap: 8px; }
    .btn-collect, .btn-otp { flex: 1; padding: 11px; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-collect { background: #0f3460; color: white; }
    .btn-otp     { background: #ede9fe; color: #5b21b6; }

    /* OTP Panel */
    .otp-panel { background: #1a1a2e; border-radius: 14px; padding: 16px; color: white; }
    .otp-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 15px; font-weight: 700; }
    .cancel-btn { background: rgba(255,255,255,0.15); border: none; color: white; font-size: 14px; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .otp-info { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0 0 12px; }
    .btn-generate { width: 100%; padding: 12px; background: #e94560; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .btn-generate:disabled { background: #666; cursor: not-allowed; }
    .otp-display { text-align: center; }
    .otp-display-label { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
    .otp-big-code { font-size: 52px; font-weight: 900; letter-spacing: 16px; font-family: monospace; color: white; margin-bottom: 12px; }
    .otp-expire-row { margin-bottom: 12px; }
    .otp-countdown { font-size: 14px; color: #86efac; }
    .otp-countdown.urgent { color: #f59e0b; animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .btn-regen { background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 10px; padding: 9px 20px; font-size: 13px; cursor: pointer; }
    .btn-regen:disabled { opacity: 0.5; }
  `]
})
export class MyDeliveriesComponent implements OnInit, OnDestroy {
  pendingDeliveries: Delivery[] = [];
  history:           Delivery[] = [];
  activeTab: 'pending' | 'history' = 'pending';
  loading = true;
  notes: Record<number, string> = {};

  // OTP state
  activeDeliveryId: number | null = null;
  currentOtp: OtpGenerateResponse | null = null;
  generatingOtp = false;
  otpCountdown  = 600;
  private otpTimer: any;

  constructor(private svc: DeliveryService) {}

  ngOnInit()    { this.loadPending(); }
  ngOnDestroy() { clearInterval(this.otpTimer); }

  loadPending() {
    this.loading = true;
    this.svc.getMyPending().subscribe({
      next: r => { this.pendingDeliveries = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadHistory() {
    this.activeTab = 'history';
    if (this.history.length > 0) return;
    this.loading = true;
    this.svc.getMyHistory().subscribe({
      next: r => { this.history = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  markCollected(d: Delivery) {
    this.svc.updateStatus(d.id, {
      status: 'COLLECTED', collectedBy: 'Resident',
      residentNote: this.notes[d.id] || undefined
    }).subscribe({
      next: () => {
        this.pendingDeliveries = this.pendingDeliveries.filter(p => p.id !== d.id);
        this.history = [];
      }
    });
  }

  startOtp(d: Delivery) {
    this.activeDeliveryId = d.id;
    this.currentOtp = null;
    clearInterval(this.otpTimer);
  }

  cancelOtp() {
    this.activeDeliveryId = null;
    this.currentOtp = null;
    clearInterval(this.otpTimer);
  }

  generateOtp(d: Delivery) {
    this.generatingOtp = true;
    this.svc.generateResidentOtp(d.id).subscribe({
      next: r => {
        this.generatingOtp = false;
        this.currentOtp = r.data;
        this.otpCountdown = 600;
        clearInterval(this.otpTimer);
        this.otpTimer = setInterval(() => {
          this.otpCountdown--;
          if (this.otpCountdown <= 0) {
            clearInterval(this.otpTimer);
            this.currentOtp = null;
          }
        }, 1000);
      },
      error: () => { this.generatingOtp = false; }
    });
  }

  formatCountdown(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
