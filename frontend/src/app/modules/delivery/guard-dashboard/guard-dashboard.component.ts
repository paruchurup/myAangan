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
  templateUrl: "./guard-dashboard.component.html",
  styleUrls: ["./guard-dashboard.component.scss"]
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
