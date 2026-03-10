import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaintenanceService } from '@services/maintenance.service';
import { MaintenanceBill, MaintenanceConfig, BILL_STATUS_CONFIG, MONTH_NAMES } from '@models/maintenance.model';

@Component({
  selector: 'app-manage-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./manage-maintenance.component.html",
  styleUrls: ["./manage-maintenance.component.scss"]
})
export class ManageMaintenanceComponent implements OnInit {
  tab = 'BILLS';
  monthNames = MONTH_NAMES;
  statusCfg  = BILL_STATUS_CONFIG;

  viewYear  = new Date().getFullYear();
  viewMonth = new Date().getMonth() + 1;

  bills: MaintenanceBill[] = [];
  billsLoading = false;
  generating   = false;

  defaulters: any[] = [];
  defLoading = false;

  summary: any[] = [];
  sumLoading = false;

  config: MaintenanceConfig | null = null;
  cfgLoading = false;
  cfgSaving  = false;
  cfgError   = '';
  cfgOk      = '';
  razorpaySecret = '';

  waivingBill: MaintenanceBill | null = null;
  waiveNote = '';
  waiving   = false;

  constructor(public svc: MaintenanceService) {}

  ngOnInit() { this.loadBills(); }

  loadBills() {
    this.billsLoading = true;
    this.svc.getBillsForMonth(this.viewYear, this.viewMonth).subscribe({
      next: r => { this.bills = r.data; this.billsLoading = false; },
      error: () => this.billsLoading = false
    });
  }

  loadDefaulters() {
    this.defLoading = true;
    this.svc.getDefaulters().subscribe({
      next: r => { this.defaulters = r.data; this.defLoading = false; },
      error: () => this.defLoading = false
    });
  }

  loadSummary() {
    this.sumLoading = true;
    this.svc.getMonthlySummary().subscribe({
      next: r => { this.summary = r.data; this.sumLoading = false; },
      error: () => this.sumLoading = false
    });
  }

  loadConfig() {
    this.cfgLoading = true;
    this.svc.getConfig().subscribe({
      next: r => { this.config = r.data; this.cfgLoading = false; },
      error: () => this.cfgLoading = false
    });
  }

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 1) { this.viewMonth = 12; this.viewYear--; }
    this.loadBills();
  }

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 12) { this.viewMonth = 1; this.viewYear++; }
    this.loadBills();
  }

  generateBills() {
    this.generating = true;
    this.svc.generateBills(this.viewYear, this.viewMonth).subscribe({
      next: () => { this.generating = false; this.loadBills(); },
      error: () => this.generating = false
    });
  }

  get paidCount()      { return this.bills.filter(b => b.status === 'PAID').length; }
  get unpaidCount()    { return this.bills.filter(b => b.status === 'UNPAID').length; }
  get totalCollected() { return this.bills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.totalAmount, 0); }

  saveConfig() {
    if (!this.config) return;
    this.cfgSaving = true; this.cfgError = ''; this.cfgOk = '';
    const body: any = { ...this.config };
    if (this.razorpaySecret.trim()) body.razorpayKeySecret = this.razorpaySecret;
    this.svc.updateConfig(body).subscribe({
      next: r => {
        this.config = r.data;
        this.cfgOk = 'Configuration saved successfully.';
        this.razorpaySecret = '';
        this.cfgSaving = false;
        setTimeout(() => this.cfgOk = '', 3000);
      },
      error: e => { this.cfgError = e.error?.message || 'Save failed.'; this.cfgSaving = false; }
    });
  }

  startWaive(bill: MaintenanceBill) { this.waivingBill = bill; this.waiveNote = ''; }
  cancelWaive() { this.waivingBill = null; this.waiveNote = ''; }

  confirmWaive() {
    if (!this.waivingBill) return;
    this.waiving = true;
    this.svc.waiveBill(this.waivingBill.id, this.waiveNote).subscribe({
      next: r => {
        const idx = this.bills.findIndex(b => b.id === r.data.id);
        if (idx > -1) this.bills[idx] = r.data;
        this.waiving = false; this.waivingBill = null; this.waiveNote = '';
      },
      error: () => this.waiving = false
    });
  }
}
