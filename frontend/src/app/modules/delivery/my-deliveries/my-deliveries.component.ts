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
  templateUrl: "./my-deliveries.component.html",
  styleUrls: ["./my-deliveries.component.scss"]
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
