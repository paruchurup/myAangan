import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaintenanceService } from '@services/maintenance.service';
import { MaintenanceBill, BILL_STATUS_CONFIG, MONTH_NAMES } from '@models/maintenance.model';

declare const Razorpay: any;

@Component({
  selector: 'app-my-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./my-maintenance.component.html",
  styleUrls: ["./my-maintenance.component.scss"]
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
