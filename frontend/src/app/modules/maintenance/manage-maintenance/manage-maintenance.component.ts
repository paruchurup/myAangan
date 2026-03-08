import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { MaintenanceBill, MaintenanceConfig, BILL_STATUS_CONFIG, MONTH_NAMES } from '../../../core/models/maintenance.model';

@Component({
  selector: 'app-manage-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="header">
    <div>
      <div class="eyebrow">ADMIN · MAINTENANCE</div>
      <h1>🏦 Maintenance Control</h1>
    </div>
  </div>

  <!-- Tab strip -->
  <div class="tabs">
    <button class="tab" [class.active]="tab==='BILLS'"     (click)="tab='BILLS'; loadBills()">📋 Monthly Bills</button>
    <button class="tab" [class.active]="tab==='DEFAULTERS'" (click)="tab='DEFAULTERS'; loadDefaulters()">🚨 Defaulters</button>
    <button class="tab" [class.active]="tab==='SUMMARY'"   (click)="tab='SUMMARY'; loadSummary()">📊 Summary</button>
    <button class="tab" [class.active]="tab==='CONFIG'"    (click)="tab='CONFIG'; loadConfig()">⚙️ Config</button>
  </div>

  <!-- ── MONTHLY BILLS ──────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='BILLS'">
    <div class="month-nav">
      <button class="nav-btn" (click)="prevMonth()">‹</button>
      <span class="month-label">{{ monthNames[viewMonth] }} {{ viewYear }}</span>
      <button class="nav-btn" (click)="nextMonth()">›</button>
      <button class="gen-btn" (click)="generateBills()" [disabled]="generating">
        {{ generating ? 'Generating…' : '+ Generate Bills' }}
      </button>
    </div>

    <!-- Summary strip -->
    <div class="stats-strip" *ngIf="bills.length">
      <div class="stat"><div class="sv">{{ bills.length }}</div><div class="sk">Total Flats</div></div>
      <div class="stat green"><div class="sv">{{ paidCount }}</div><div class="sk">Paid</div></div>
      <div class="stat red"><div class="sv">{{ unpaidCount }}</div><div class="sk">Unpaid</div></div>
      <div class="stat amber"><div class="sv">₹{{ totalCollected | number:'1.0-0' }}</div><div class="sk">Collected</div></div>
    </div>

    <div class="loading" *ngIf="billsLoading"><div class="spinner"></div></div>
    <div class="empty" *ngIf="!billsLoading && !bills.length">
      <div>📋</div><p>No bills for this month</p>
      <small>Tap "Generate Bills" to create bills for all active flats</small>
    </div>

    <!-- Bill rows -->
    <div class="bill-row" *ngFor="let bill of bills">
      <div class="flat-key">{{ bill.flatKey }}</div>
      <div class="resident-name" *ngIf="bill.resident">
        {{ bill.resident.firstName }} {{ bill.resident.lastName }}
      </div>
      <div class="bill-amount">₹{{ bill.totalAmount | number:'1.0-0' }}</div>
      <div class="status-pill"
        [style.background]="statusCfg[bill.status]?.bg"
        [style.color]="statusCfg[bill.status]?.color">
        {{ statusCfg[bill.status]?.icon }} {{ statusCfg[bill.status]?.label }}
      </div>
      <div class="bill-row-actions">
        <span class="paid-when" *ngIf="bill.status==='PAID'">{{ bill.paidAt | date:'d MMM' }}</span>
        <button class="waive-btn" *ngIf="bill.status==='UNPAID'"
          (click)="startWaive(bill)">Waive</button>
        <a class="rcpt-link" *ngIf="bill.status==='PAID' && bill.receiptPath"
          [href]="svc.getReceiptUrl(bill.receiptPath)" target="_blank">📄</a>
      </div>
    </div>
  </div>

  <!-- ── DEFAULTERS ─────────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='DEFAULTERS'">
    <div class="section-note">Flats with 2 or more unpaid bills</div>
    <div class="loading" *ngIf="defLoading"><div class="spinner"></div></div>
    <div class="empty" *ngIf="!defLoading && !defaulters.length">
      <div>🎉</div><p>No defaulters</p><small>All flats are up to date</small>
    </div>
    <div class="defaulter-row" *ngFor="let d of defaulters; let i = index">
      <div class="def-rank">{{ i + 1 }}</div>
      <div class="def-flat">{{ d.flatKey }}</div>
      <div class="def-count">
        <span class="count-badge">{{ d.unpaidCount }} month{{ d.unpaidCount > 1 ? 's' : '' }} unpaid</span>
      </div>
    </div>
  </div>

  <!-- ── SUMMARY ────────────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='SUMMARY'">
    <div class="loading" *ngIf="sumLoading"><div class="spinner"></div></div>
    <div class="summary-row header-row">
      <span>Month</span><span>Bills</span><span>Collected</span><span>Pending</span>
    </div>
    <div class="summary-row" *ngFor="let s of summary; let i = index" [class.alt]="i%2===0">
      <span class="s-month">{{ s.monthName }}</span>
      <span>{{ s.totalBills }}</span>
      <span class="s-green">₹{{ s.collected | number:'1.0-0' }}</span>
      <span class="s-red">₹{{ s.pending | number:'1.0-0' }}</span>
    </div>
  </div>

  <!-- ── CONFIG ─────────────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='CONFIG'">
    <div class="loading" *ngIf="cfgLoading"><div class="spinner"></div></div>
    <div class="config-form" *ngIf="config && !cfgLoading">
      <div class="cfg-section">BILLING SETTINGS</div>
      <div class="cfg-field">
        <label>Society Name</label>
        <input [(ngModel)]="config.societyName" placeholder="MyAangan Society" />
      </div>
      <div class="cfg-grid">
        <div class="cfg-field">
          <label>Monthly Amount (₹)</label>
          <input type="number" [(ngModel)]="config.monthlyAmount" />
        </div>
        <div class="cfg-field">
          <label>Due Day of Month</label>
          <input type="number" [(ngModel)]="config.dueDayOfMonth" min="1" max="28" />
        </div>
      </div>

      <div class="cfg-section">PENALTY SETTINGS</div>
      <div class="cfg-grid">
        <div class="cfg-field">
          <label>Flat Penalty After Due Date (₹)</label>
          <input type="number" [(ngModel)]="config.latePenaltyFlat" />
        </div>
        <div class="cfg-field">
          <label>Monthly Interest (%)</label>
          <input type="number" [(ngModel)]="config.lateInterestPct" step="0.5" />
        </div>
      </div>

      <div class="cfg-section">RAZORPAY INTEGRATION</div>
      <div class="cfg-note">Enter your Razorpay API credentials. Get them from the Razorpay Dashboard → Settings → API Keys.</div>
      <div class="cfg-field">
        <label>Key ID (public)</label>
        <input [(ngModel)]="config.razorpayKeyId" placeholder="rzp_live_XXXXXXXXXXXXXXXX" />
      </div>
      <div class="cfg-field">
        <label>Key Secret (write-only)</label>
        <input type="password" [(ngModel)]="razorpaySecret" placeholder="Enter to update secret…" />
        <small>Leave blank to keep existing secret unchanged.</small>
      </div>

      <div class="cfg-err" *ngIf="cfgError">{{ cfgError }}</div>
      <div class="cfg-ok" *ngIf="cfgOk">{{ cfgOk }}</div>
      <button class="save-btn" (click)="saveConfig()" [disabled]="cfgSaving">
        {{ cfgSaving ? 'Saving…' : '💾 Save Configuration' }}
      </button>
    </div>
  </div>

  <!-- Waive modal -->
  <div class="modal-overlay" *ngIf="waivingBill" (click)="cancelWaive()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-title">Waive Bill</div>
      <div class="modal-sub">{{ waivingBill.flatKey }} — {{ monthNames[waivingBill.billMonth] }} {{ waivingBill.billYear }}</div>
      <div class="modal-amount">₹{{ waivingBill.totalAmount | number:'1.2-2' }}</div>
      <textarea [(ngModel)]="waiveNote" rows="3" placeholder="Reason for waiver (e.g. Hardship case, duplicate bill)…" class="waive-input"></textarea>
      <div class="modal-actions">
        <button class="cancel-btn" (click)="cancelWaive()">Cancel</button>
        <button class="confirm-waive-btn" (click)="confirmWaive()" [disabled]="!waiveNote.trim() || waiving">
          {{ waiving ? 'Waiving…' : '✓ Confirm Waive' }}
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8;position:relative}
    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #10b981;padding:18px 16px 14px}
    .eyebrow{font-size:10px;color:#10b981;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;margin:0;letter-spacing:1px}

    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a;overflow-x:auto}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:11px 4px;font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:0.3px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all 0.15s}
    .tab.active{color:#10b981;border-bottom-color:#10b981}
    .body{padding:14px;display:flex;flex-direction:column;gap:10px}

    /* Month nav */
    .month-nav{display:flex;align-items:center;gap:8px;background:#252525;border:1px solid #333;border-radius:8px;padding:10px 12px}
    .nav-btn{background:#1c1c1c;border:1px solid #333;color:#e8e8e8;width:32px;height:32px;border-radius:6px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .month-label{font-family:'Oswald',sans-serif;font-size:15px;font-weight:600;color:#fff;flex:1;text-align:center}
    .gen-btn{background:#10b981;border:none;color:#fff;padding:7px 12px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.5px;white-space:nowrap}
    .gen-btn:disabled{opacity:0.4}

    /* Stats strip */
    .stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .stat{background:#252525;border:1px solid #333;border-radius:8px;padding:10px;text-align:center}
    .stat.green{border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.07)}
    .stat.red{border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.07)}
    .stat.amber{border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.07)}
    .sv{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#fff}
    .sk{font-size:10px;color:#6b7280;letter-spacing:0.5px}

    /* Bill rows */
    .bill-row{background:#252525;border:1px solid #333;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .flat-key{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:#fff;min-width:60px}
    .resident-name{font-size:12px;color:#9ca3af;flex:1;min-width:80px}
    .bill-amount{font-family:'IBM Plex Mono',monospace;font-size:13px;color:#e8e8e8;font-weight:600}
    .status-pill{font-size:10px;font-family:'Oswald',sans-serif;padding:2px 8px;border-radius:10px;font-weight:700}
    .bill-row-actions{display:flex;gap:6px;align-items:center;margin-left:auto}
    .paid-when{font-size:11px;color:#10b981}
    .waive-btn{background:none;border:1px solid #333;color:#6b7280;padding:4px 8px;border-radius:5px;font-size:10px;cursor:pointer;font-family:'Oswald',sans-serif}
    .waive-btn:hover{border-color:#a78bfa;color:#a78bfa}
    .rcpt-link{font-size:16px;text-decoration:none;cursor:pointer}

    /* Defaulters */
    .section-note{font-size:12px;color:#6b7280;background:#252525;border:1px solid #333;border-radius:6px;padding:8px 12px}
    .defaulter-row{background:#252525;border:1px solid rgba(239,68,68,0.2);border-left:4px solid #ef4444;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:12px}
    .def-rank{font-family:'Oswald',sans-serif;font-size:18px;color:#4b5563;font-weight:700;min-width:24px}
    .def-flat{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;color:#fff;flex:1}
    .count-badge{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;font-size:11px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:8px;font-weight:700}

    /* Summary */
    .summary-row{display:grid;grid-template-columns:2fr 1fr 2fr 2fr;gap:8px;padding:9px 12px;font-size:12px;border-radius:6px}
    .summary-row.header-row{font-family:'Oswald',sans-serif;font-size:10px;color:#6b7280;letter-spacing:1px;padding-bottom:4px}
    .summary-row.alt{background:#252525}
    .s-month{font-weight:600;color:#e8e8e8}
    .s-green{color:#10b981;font-family:'IBM Plex Mono',monospace}
    .s-red{color:#f87171;font-family:'IBM Plex Mono',monospace}

    /* Config */
    .config-form{display:flex;flex-direction:column;gap:12px}
    .cfg-section{font-family:'Oswald',sans-serif;font-size:10px;color:#10b981;letter-spacing:2px;border-bottom:1px solid #333;padding-bottom:4px;margin-top:8px}
    .cfg-note{font-size:11px;color:#6b7280;background:#252525;border:1px solid #333;border-radius:6px;padding:8px 10px}
    .cfg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .cfg-field{display:flex;flex-direction:column;gap:4px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif}
    input{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:9px 11px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box}
    input:focus{border-color:#10b981}
    small{font-size:10px;color:#4b5563}
    .cfg-err{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:8px;border-radius:6px;font-size:12px}
    .cfg-ok{background:rgba(16,185,129,0.1);border:1px solid #10b981;color:#10b981;padding:8px;border-radius:6px;font-size:12px}
    .save-btn{background:#10b981;border:none;color:#fff;padding:12px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer}
    .save-btn:disabled{opacity:0.4}

    /* Waive modal */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
    .modal{background:#252525;border:1px solid #444;border-radius:12px;padding:20px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:12px}
    .modal-title{font-family:'Oswald',sans-serif;font-size:16px;color:#fff;font-weight:700}
    .modal-sub{font-size:13px;color:#9ca3af}
    .modal-amount{font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700;color:#a78bfa}
    .waive-input{background:#1c1c1c;border:1.5px solid #444;border-radius:6px;color:#e8e8e8;padding:9px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;resize:vertical;width:100%;box-sizing:border-box}
    .modal-actions{display:flex;gap:8px}
    .cancel-btn{flex:1;background:none;border:1px solid #333;color:#6b7280;padding:10px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;cursor:pointer}
    .confirm-waive-btn{flex:2;background:#a78bfa;border:none;color:#111;padding:10px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
    .confirm-waive-btn:disabled{opacity:0.4}

    .loading{display:flex;justify-content:center;padding:30px}
    .spinner{width:24px;height:24px;border:3px solid #333;border-top-color:#10b981;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:36px}.empty p{font-family:'Oswald',sans-serif;font-size:16px}.empty small{font-size:12px}
  `]
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
