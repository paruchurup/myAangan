import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '../../../core/services/helpdesk.service';
import { CATEGORY_CONFIG, STATUS_CONFIG, ServiceRequestStatus } from '../../../core/models/helpdesk.model';

@Component({
  selector: 'app-fm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="header">
    <button class="back-btn" routerLink="/helpdesk">←</button>
    <div>
      <div class="eyebrow">FACILITY MANAGER</div>
      <h1>📋 Helpdesk Dashboard</h1>
    </div>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="body" *ngIf="!loading">
    <!-- Summary cards -->
    <div class="summary-row">
      <div class="sum-card yellow" (click)="filterTab='PENDING'">
        <div class="sum-num">{{ counts.pending }}</div>
        <div class="sum-lbl">⏳ Pending</div>
      </div>
      <div class="sum-card blue" (click)="filterTab='ASSIGNED'">
        <div class="sum-num">{{ counts.assigned }}</div>
        <div class="sum-lbl">👷 Assigned</div>
      </div>
      <div class="sum-card purple" (click)="filterTab='IN_PROGRESS'">
        <div class="sum-num">{{ counts.inProgress }}</div>
        <div class="sum-lbl">🔨 In Progress</div>
      </div>
      <div class="sum-card green" (click)="filterTab='DONE'">
        <div class="sum-num">{{ counts.done }}</div>
        <div class="sum-lbl">✅ Done</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="tabs">
      <button class="tab" [class.active]="filterTab==='ALL'"         (click)="filterTab='ALL'">All</button>
      <button class="tab" [class.active]="filterTab==='PENDING'"     (click)="filterTab='PENDING'">Pending</button>
      <button class="tab" [class.active]="filterTab==='ASSIGNED'"    (click)="filterTab='ASSIGNED'">Assigned</button>
      <button class="tab" [class.active]="filterTab==='IN_PROGRESS'" (click)="filterTab='IN_PROGRESS'">In Progress</button>
      <button class="tab" [class.active]="filterTab==='DONE'"        (click)="filterTab='DONE'">Done</button>
    </div>

    <div class="empty-msg" *ngIf="filtered.length === 0">No requests with this status.</div>

    <div class="list">
      <a class="req-card" [routerLink]="['/helpdesk', r.id]" *ngFor="let r of filtered">
        <div class="req-stripe" [style.background]="catCfg[r.category]?.color"></div>
        <div class="req-body">
          <div class="req-top">
            <div class="req-cat">
              <span>{{ catCfg[r.category]?.icon }}</span>
              <span class="cat-name" [style.color]="catCfg[r.category]?.color">{{ catCfg[r.category]?.label }}</span>
              <span class="flat-badge">Flat {{ r.resident?.flatNumber }}</span>
            </div>
            <div class="status-pill"
              [style.background]="stsCfg[r.status]?.bg"
              [style.color]="stsCfg[r.status]?.color">
              {{ stsCfg[r.status]?.icon }} {{ stsCfg[r.status]?.label }}
            </div>
          </div>
          <div class="req-title">{{ r.title }}</div>
          <div class="req-meta">
            <span>👤 {{ r.resident?.firstName }} {{ r.resident?.lastName }}</span>
            <span>📅 {{ r.createdAt | date:'d MMM' }}</span>
            <span *ngIf="r.preferredDatetime" class="pref-time">🕐 Pref: {{ r.preferredDatetime | date:'d MMM, h:mm a' }}</span>
            <span *ngIf="r.assignedStaffName" class="assigned-name">👷 {{ r.assignedStaffName }}</span>
          </div>
        </div>
      </a>
    </div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}
    .header{background:linear-gradient(180deg,#111,#161616);border-bottom:3px solid #6366f1;padding:12px 16px;display:flex;align-items:center;gap:10px}
    .back-btn{background:none;border:1px solid #333;color:#9ca3af;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer}
    .eyebrow{font-size:10px;color:#6366f1;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;margin:0}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:14px;display:flex;flex-direction:column;gap:10px}
    .summary-row{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
    .sum-card{background:#252525;border:1px solid #333;border-radius:10px;padding:10px 8px;text-align:center;cursor:pointer;transition:border-color 0.15s}
    .sum-card:hover{border-color:#6366f1}
    .sum-num{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700}
    .sum-lbl{font-size:10px;color:#6b7280;margin-top:2px}
    .sum-card.yellow .sum-num{color:#f59e0b}
    .sum-card.blue   .sum-num{color:#3b82f6}
    .sum-card.purple .sum-num{color:#6366f1}
    .sum-card.green  .sum-num{color:#10b981}
    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a;border-radius:8px 8px 0 0;overflow:hidden}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:9px 4px;font-size:10px;font-family:'Oswald',sans-serif;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;letter-spacing:0.3px}
    .tab.active{color:#6366f1;border-bottom-color:#6366f1}
    .empty-msg{text-align:center;padding:30px;color:#4b5563;font-size:13px}
    .list{display:flex;flex-direction:column;gap:8px}
    .req-card{background:#252525;border:1px solid #333;border-radius:10px;display:flex;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.15s}
    .req-card:hover{border-color:#6366f1}
    .req-stripe{width:5px;flex-shrink:0}
    .req-body{flex:1;padding:11px 12px;display:flex;flex-direction:column;gap:6px}
    .req-top{display:flex;justify-content:space-between;align-items:center}
    .req-cat{display:flex;align-items:center;gap:5px;font-size:15px}
    .cat-name{font-family:'Oswald',sans-serif;font-size:12px;font-weight:700}
    .flat-badge{background:#1c1c1c;border:1px solid #333;color:#9ca3af;padding:2px 7px;border-radius:6px;font-size:10px;font-family:'Oswald',sans-serif;margin-left:4px}
    .status-pill{font-size:10px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
    .req-title{font-family:'Oswald',sans-serif;font-size:14px;color:#fff;font-weight:700;letter-spacing:0.3px}
    .req-meta{display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:#6b7280}
    .pref-time{color:#f59e0b}.assigned-name{color:#3b82f6}
  `]
})
export class FmDashboardComponent implements OnInit {
  allRequests: any[] = [];
  counts = { pending: 0, assigned: 0, inProgress: 0, done: 0 };
  loading   = false;
  filterTab: string = 'ALL';

  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stsCfg = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(private svc: HelpdeskService) {}

  ngOnInit() {
    this.loading = true;
    this.svc.getDashboard().subscribe({
      next: r => {
        this.counts = {
          pending:    r.data.pending,
          assigned:   r.data.assigned,
          inProgress: r.data.inProgress,
          done:       r.data.done,
        };
        this.allRequests = r.data.open;
        this.loading = false;
      },
      error: () => this.loading = false
    });
    // Also load all requests for filtering
    this.svc.getAll().subscribe({
      next: r => this.allRequests = r.data
    });
  }

  get filtered() {
    if (this.filterTab === 'ALL') return this.allRequests;
    return this.allRequests.filter(r => r.status === this.filterTab);
  }
}
