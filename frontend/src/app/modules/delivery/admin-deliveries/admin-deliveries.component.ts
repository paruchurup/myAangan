import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { Delivery } from '../../../core/models/delivery.model';

@Component({
  selector: 'app-admin-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" routerLink="/dashboard">← Back</button>
        <h1>📊 Delivery Management</h1>
        <p>All deliveries across the society</p>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat" (click)="setFilter(null)" [class.active]="!activeFilter">
          <div class="stat-num">{{ all.length }}</div>
          <div class="stat-lbl">Total</div>
        </div>
        <div class="stat" (click)="setFilter('ARRIVED')" [class.active]="activeFilter === 'ARRIVED'">
          <div class="stat-num arrived">{{ count('ARRIVED') }}</div>
          <div class="stat-lbl">Arrived</div>
        </div>
        <div class="stat" (click)="setFilter('NOTIFIED')" [class.active]="activeFilter === 'NOTIFIED'">
          <div class="stat-num notified">{{ count('NOTIFIED') }}</div>
          <div class="stat-lbl">Notified</div>
        </div>
        <div class="stat" (click)="setFilter('COLLECTED')" [class.active]="activeFilter === 'COLLECTED'">
          <div class="stat-num collected">{{ count('COLLECTED') }}</div>
          <div class="stat-lbl">Collected</div>
        </div>
        <div class="stat" (click)="setFilter('RETURNED')" [class.active]="activeFilter === 'RETURNED'">
          <div class="stat-num returned">{{ count('RETURNED') }}</div>
          <div class="stat-lbl">Returned</div>
        </div>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

      <div class="empty-state" *ngIf="!loading && filtered.length === 0">
        <div class="empty-icon">📭</div>
        <p>No deliveries found</p>
      </div>

      <div class="list" *ngIf="!loading && filtered.length > 0">
        <div class="delivery-card" *ngFor="let d of filtered">
          <div class="card-top">
            <div class="left">
              <span class="type-lbl">{{ d.deliveryTypeLabel }}</span>
              <span class="flat">🏠 {{ d.block ? d.block + '-' : '' }}{{ d.flatNumber }}</span>
            </div>
            <div class="status-badge" [class]="d.status.toLowerCase()">{{ d.statusLabel }}</div>
          </div>

          <div class="card-mid">
            <span class="resident">👤 {{ d.residentName }}</span>
            <span class="sender" *ngIf="d.senderName">· {{ d.senderName }}</span>
          </div>

          <div class="card-foot">
            <span class="guard">Logged by {{ d.loggedByName }}</span>
            <span class="time">{{ d.createdAt | date:'MMM d, h:mm a' }}</span>
          </div>

          <!-- Admin can mark collected/returned -->
          <div class="admin-actions" *ngIf="d.status === 'ARRIVED' || d.status === 'NOTIFIED'">
            <button class="btn-sm collected" (click)="markCollected(d)">✅ Collected</button>
            <button class="btn-sm returned"  (click)="markReturned(d)">↩️ Returned</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      padding: 16px 16px 24px; color: white;
    }
    .back-btn {
      background: rgba(255,255,255,0.15); border: none; color: white;
      padding: 6px 12px; border-radius: 20px; font-size: 13px;
      cursor: pointer; margin-bottom: 12px; display: inline-block;
    }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; }
    .page-header p  { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .stats-bar {
      display: flex; background: white; border-bottom: 1px solid #eee; overflow-x: auto;
    }
    .stat {
      flex: 1; min-width: 64px; padding: 12px 8px; text-align: center;
      cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .stat.active { border-bottom-color: #0f3460; }
    .stat-num { font-size: 20px; font-weight: 700; color: #1a1a2e; }
    .stat-num.arrived   { color: #92400e; }
    .stat-num.notified  { color: #1e40af; }
    .stat-num.collected { color: #166534; }
    .stat-num.returned  { color: #991b1b; }
    .stat-lbl { font-size: 10px; color: #888; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

    .loading { display: flex; justify-content: center; padding: 60px; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #eee;
      border-top-color: #0f3460; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: #555; }

    .list { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .delivery-card {
      background: white; border-radius: 12px; padding: 12px 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .left { display: flex; align-items: center; gap: 10px; }
    .type-lbl { font-size: 13px; font-weight: 600; color: #0f3460; }
    .flat { font-size: 14px; font-weight: 700; color: #1a1a2e; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 8px; }
    .status-badge.arrived   { background: #fef3c7; color: #92400e; }
    .status-badge.notified  { background: #dbeafe; color: #1e40af; }
    .status-badge.collected { background: #dcfce7; color: #166534; }
    .status-badge.returned  { background: #fee2e2; color: #991b1b; }

    .card-mid { font-size: 13px; color: #555; margin-bottom: 6px; }
    .resident { font-weight: 600; color: #333; }
    .card-foot { display: flex; justify-content: space-between; font-size: 12px; color: #aaa; }

    .admin-actions { display: flex; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f0f0f0; }
    .btn-sm {
      flex: 1; padding: 8px; border: none; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .btn-sm.collected { background: #dcfce7; color: #166534; }
    .btn-sm.returned  { background: #fee2e2; color: #991b1b; }
  `]
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
