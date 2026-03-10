import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '@services/delivery.service';
import { Delivery } from '@models/delivery.model';

@Component({
  selector: 'app-admin-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-deliveries.component.html",
  styleUrls: ["./admin-deliveries.component.scss"]
})
export class AdminDeliveriesComponent implements OnInit {
  all: Delivery[] = [];
  activeFilter: string | null = null;
  loading = true;

  get filtered(): Delivery[] {
    if (!this.activeFilter) return this.all;
    return this.all.filter(d => d.status === this.activeFilter);
  }

  count(status: string): number { return this.all.filter(d => d.status === status).length; }

  constructor(private svc: DeliveryService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAllDeliveries().subscribe({
      next: r => { this.all = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  setFilter(f: string | null) { this.activeFilter = f; }

  markCollected(d: Delivery) {
    this.svc.updateStatus(d.id, { status: 'COLLECTED', collectedBy: 'Collected at gate' })
      .subscribe({ next: () => this.load() });
  }

  markReturned(d: Delivery) {
    if (!confirm('Mark as returned?')) return;
    this.svc.updateStatus(d.id, { status: 'RETURNED' })
      .subscribe({ next: () => this.load() });
  }
}
