import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { MaintenanceBill, BILL_STATUS_CONFIG, MONTH_NAMES } from '../../../core/models/maintenance.model';

declare const Razorpay: any;

@Component({
  selector: 'app-my-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page">
  <div class="header">
    <div>
      <div class="eyebrow">MAINTENANCE FEE</div>
      <h1>💰 My Bills</h1>
    </div>
  </div>

  <!-- Outstanding alert bar -->
  <div class="alert-bar" *ngIf="outstanding && outstanding.unpaidCount > 0">
    <div class="alert-left">
      <span class="alert-icon">⚠️</span>
      <div>
        <div class="alert-title">{{ outstanding.unpaidCount }} bill{{ outstanding.unpaidCount > 1 ? 's' : '' }} outstanding</div>
        <div class="alert-sub">Total due: ₹{{ outstanding.totalOutstanding | number:'1.2-2' }}</div>
      </div>
    </div>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading && !bills.length">
    <div>💰</div><p>No bills yet</p>
    <small>Bills are generated on the 1st of each month</small>
  </div>

  <!-- Bill cards -->
  <div class="bill-card" *ngFor="let bill of bills" [class]="'s-' + bill.status.toLowerCase()">
    <div class="stripe" [class]="'stripe-' + bill.status.toLowerCase()"></div>
    <div class="bill-body">

      <div class="bill-top">
        <div class="bill-month">{{ monthName(bill.billMonth) }} {{ bill.billYear }}</div>
        <div class="status-pill"
          [style.background]="statusCfg[bill.status]?.bg"
          [style.color]="statusCfg[bill.status]?.color">
          {{ statusCfg[bill.status]?.icon }} {{ statusCfg[bill.status]?.label }}
        </div>
      </div>

      <!-- Amount breakdown -->
      <div class="amount-grid">
        <div class="amount-row">
          <span class="al">Base Amount</span>
          <span class="av">₹{{ bill.baseAmount | number:'1.2-2' }}</span>
        </div>
        <div class="amount-row penalty" *ngIf="bill.penaltyAmount > 0">
          <span class="al">Late Penalty</span>
          <span class="av red">₹{{ bill.penaltyAmount | number:'1.2-2' }}</span>
        </div>
        <div class="amount-row penalty" *ngIf="bill.interestAmount > 0">
          <span class="al">Interest</span>
          <span class="av red">₹{{ bill.interestAmount | number:'1.2-2' }}</span>
        </div>
        <div class="amount-row total">
          <span class="al">Total</span>
          <span class="av total-val">₹{{ bill.totalAmount | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Due date -->
      <div class="due-info" *ngIf="bill.status === 'UNPAID'">
        <span [class.overdue]="isOverdue(bill.dueDate)">
          {{ isOverdue(bill.dueDate) ? '🔴 Overdue since' : '📅 Due by' }}
          {{ bill.dueDate | date:'d MMM yyyy' }}
        </span>
      </div>

      <!-- Paid info -->
      <div class="paid-info" *ngIf="bill.status === 'PAID'">
        ✅ Paid on {{ bill.paidAt | date:'d MMM yyyy, h:mm a' }}
        <span *ngIf="bill.razorpayPaymentId" class="txn">· Txn: {{ bill.razorpayPaymentId }}</span>
      </div>

      <!-- Waiver info -->
      <div class="waiver-info" *ngIf="bill.status === 'WAIVED'">
        🎁 {{ bill.waiverNote || 'Waived by admin' }}
      </div>

      <!-- Actions -->
      <div class="bill-actions">
        <button class="pay-btn" *ngIf="bill.status === 'UNPAID'"
          (click)="pay(bill)" [disabled]="payingId === bill.id">
          {{ payingId === bill.id ? 'Opening payment…' : '💳 Pay Now ₹' + (bill.totalAmount | number:'1.0-0') }}
        </button>
        <a class="receipt-btn" *ngIf="bill.status === 'PAID' && bill.receiptPath"
          [href]="receiptUrl(bill.receiptPath)" target="_blank" download>
          📄 Download Receipt
        </a>
      </div>
    </div>
  </div>

  <div class="err" *ngIf="error">{{ error }}</div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}
    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #10b981;padding:18px 16px 14px}
    .eyebrow{font-size:10px;color:#10b981;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;margin:0;letter-spacing:1px}

    .alert-bar{background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;border-bottom:1px solid rgba(239,68,68,0.2);padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
    .alert-left{display:flex;align-items:center;gap:10px}
    .alert-icon{font-size:22px}
    .alert-title{font-family:'Oswald',sans-serif;font-size:14px;color:#f87171;font-weight:700}
    .alert-sub{font-size:12px;color:#9ca3af}

    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:28px;height:28px;border:3px solid #333;border-top-color:#10b981;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:42px}.empty p{font-family:'Oswald',sans-serif;font-size:18px}.empty small{font-size:12px}

    .bill-card{background:#252525;border:1px solid #333;border-radius:12px;margin:10px 14px;display:flex;overflow:hidden;animation:fadeIn 0.2s ease-out}
    @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .stripe{width:5px;flex-shrink:0}
    .stripe-unpaid{background:#ef4444}.stripe-paid{background:#10b981}.stripe-waived{background:#a78bfa}.stripe-partially_paid{background:#f59e0b}
    .bill-body{flex:1;padding:13px 14px;display:flex;flex-direction:column;gap:8px}
    .bill-top{display:flex;justify-content:space-between;align-items:center}
    .bill-month{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#fff;letter-spacing:0.5px}
    .status-pill{font-size:11px;font-family:'Oswald',sans-serif;padding:3px 9px;border-radius:10px;font-weight:700}

    .amount-grid{background:#1c1c1c;border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:5px}
    .amount-row{display:flex;justify-content:space-between;align-items:center}
    .amount-row.total{border-top:1px solid #333;padding-top:6px;margin-top:3px}
    .al{font-size:12px;color:#6b7280}
    .av{font-size:13px;color:#e8e8e8;font-family:'IBM Plex Mono',monospace}
    .av.red{color:#f87171}
    .av.total-val{font-size:15px;font-weight:700;color:#fff}

    .due-info{font-size:12px;color:#9ca3af}
    .due-info .overdue{color:#f87171;font-weight:600}
    .paid-info{font-size:12px;color:#10b981}
    .txn{color:#6b7280;font-family:'IBM Plex Mono',monospace;font-size:11px}
    .waiver-info{font-size:12px;color:#a78bfa}

    .bill-actions{display:flex;gap:8px;margin-top:2px}
    .pay-btn{background:#10b981;border:none;color:#fff;padding:11px 18px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;cursor:pointer;flex:1}
    .pay-btn:disabled{opacity:0.4}
    .receipt-btn{background:rgba(16,185,129,0.1);border:1px solid #10b981;color:#10b981;padding:10px 14px;border-radius:7px;font-size:12px;text-decoration:none;text-align:center;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:0.5px}
    .err{color:#f87171;font-size:12px;text-align:center;padding:12px}
  `]
})
export class MyMaintenanceComponent implements OnInit {
  bills: MaintenanceBill[] = [];
  outstanding: any = null;
  loading = true;
  payingId: number | null = null;
  error = '';
  statusCfg = BILL_STATUS_CONFIG;
  months = MONTH_NAMES;

  constructor(private svc: MaintenanceService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getMyBills().subscribe({
      next: r => { this.bills = r.data; this.loading = false; },
      error: () => this.loading = false
    });
    this.svc.getMyOutstanding().subscribe({
      next: r => this.outstanding = r.data,
      error: () => {}
    });
  }

  monthName(m: number) { return MONTH_NAMES[m] || ''; }
  isOverdue(dueDate: string) { return new Date(dueDate) < new Date(); }
  receiptUrl(path: string) { return this.svc.getReceiptUrl(path); }

  pay(bill: MaintenanceBill) {
    if (typeof Razorpay === 'undefined') {
      this.error = 'Payment gateway not loaded. Please refresh the page.';
      return;
    }
    this.payingId = bill.id;
    this.error = '';
    this.svc.createOrder(bill.id).subscribe({
      next: r => {
        const order = r.data;
        const opts = {
          key:         order.keyId,
          amount:      order.amount,
          currency:    order.currency,
          name:        order.societyName || 'MyAangan',
          description: 'Maintenance Fee — ' + order.month,
          order_id:    order.orderId,
          prefill:     { name: bill.resident?.firstName + ' ' + bill.resident?.lastName },
          theme:       { color: '#10b981' },
          handler: (response: any) => {
            // Payment captured — webhook will mark bill paid
            // Show optimistic success
            const idx = this.bills.findIndex(b => b.id === bill.id);
            if (idx > -1) {
              this.bills[idx] = { ...this.bills[idx], status: 'PAID', razorpayPaymentId: response.razorpay_payment_id, paidAt: new Date().toISOString() };
            }
            this.outstanding = null;
            this.payingId = null;
            // Reload after 3s to get receipt path from server
            setTimeout(() => this.load(), 3000);
          },
          modal: { ondismiss: () => { this.payingId = null; } }
        };
        const rzp = new Razorpay(opts);
        rzp.open();
      },
      error: e => { this.error = e.error?.message || 'Payment initiation failed.'; this.payingId = null; }
    });
  }
}
