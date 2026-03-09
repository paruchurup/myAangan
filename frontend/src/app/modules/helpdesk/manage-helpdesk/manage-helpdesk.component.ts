import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-manage-helpdesk',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
    </div>
    <h1>⚙️ Manage Helpdesk</h1>
    <p>Manage and assign service requests</p>
  </div>

  <!-- Status count cards -->
  <div class="count-strip">
    <div class="count-card" *ngFor="let s of statusKeys"
      [class.active]="statusFilter === s"
      [style.border-color]="statusFilter === s ? stCfg[s]?.color : ''"
      (click)="setStatusFilter(s)">
      <div class="cc-num" [style.color]="stCfg[s]?.color">{{ counts[s] || 0 }}</div>
      <div class="cc-label">{{ stCfg[s]?.icon }} {{ stCfg[s]?.label }}</div>
    </div>
    <div class="count-card all" [class.active]="!statusFilter" (click)="setStatusFilter('')">
      <div class="cc-num">{{ totalCount }}</div>
      <div class="cc-label">📋 All</div>
    </div>
  </div>

  <!-- Category filter -->
  <div class="cat-filter">
    <button class="cf-btn" [class.active]="!catFilter" (click)="setCatFilter('')">All</button>
    <button class="cf-btn" *ngFor="let c of catKeys"
      [class.active]="catFilter === c"
      [style.color]="catFilter === c ? catCfg[c]?.color : ''"
      (click)="setCatFilter(c)">
      {{ catCfg[c]?.icon }} {{ catCfg[c]?.label }}
    </button>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading && !requests.length">
    <div>✅</div><p>No requests</p><small>Nothing matching the current filter</small>
  </div>

  <div class="list">
    <a class="req-card" [routerLink]="['/helpdesk', r.id]" *ngFor="let r of requests">
      <div class="rc-stripe" [style.background]="catCfg[r.category]?.color"></div>
      <div class="rc-body">
        <div class="rc-top">
          <div class="rc-flat">{{ r.raisedBy?.flatNumber || '—' }}</div>
          <div class="rc-cat" [style.color]="catCfg[r.category]?.color">{{ catCfg[r.category]?.icon }} {{ catCfg[r.category]?.label }}</div>
          <div class="rc-status" [style.background]="stCfg[r.status]?.bg" [style.color]="stCfg[r.status]?.color">
            {{ stCfg[r.status]?.icon }} {{ stCfg[r.status]?.label }}
          </div>
        </div>
        <div class="rc-title">{{ r.title }}</div>
        <div class="rc-name">{{ r.raisedBy?.firstName }} {{ r.raisedBy?.lastName }}</div>
        <div class="rc-meta">
          <span>{{ r.createdAt | date:'d MMM, h:mm a' }}</span>
          <span *ngIf="r.assignedStaff">· 👤 {{ r.assignedStaff }}</span>
          <span *ngIf="!r.assignedStaff && r.status === 'PENDING'" class="unassigned">· Needs assignment</span>
        </div>
      </div>
    </a>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}

    .count-strip{display:flex;gap:6px;padding:10px 14px;overflow-x:auto}
    .count-card{background:#252525;border:1.5px solid #333;border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:58px;cursor:pointer;transition:all 0.15s;flex-shrink:0}
    .count-card.active{background:#1c1c2e}
    .count-card.all .cc-num{color:#e8e8e8}
    .cc-num{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;line-height:1}
    .cc-label{font-size:9px;color:#6b7280;font-family:'Oswald',sans-serif;letter-spacing:0.3px;text-align:center;white-space:nowrap}

    .cat-filter{display:flex;gap:6px;padding:0 14px 10px;overflow-x:auto}
    .cf-btn{background:#252525;border:1px solid #333;color:#6b7280;padding:6px 12px;border-radius:6px;font-size:11px;font-family:'Oswald',sans-serif;cursor:pointer;white-space:nowrap;transition:all 0.15s}
    .cf-btn.active{background:#1c1c1c;border-color:currentColor}

    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:36px}.empty p{font-family:'Oswald',sans-serif;font-size:16px}.empty small{font-size:12px}

    .list{padding:0 14px 12px;display:flex;flex-direction:column;gap:8px}
    .req-card{background:#252525;border:1px solid #333;border-radius:10px;display:flex;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.15s}
    .req-card:hover{border-color:#3b82f6}
    .rc-stripe{width:4px;flex-shrink:0}
    .rc-body{flex:1;padding:10px 12px;display:flex;flex-direction:column;gap:4px}
    .rc-top{display:flex;align-items:center;gap:6px}
    .rc-flat{font-family:'Oswald',sans-serif;font-size:11px;color:#6b7280;background:#1c1c1c;padding:2px 6px;border-radius:4px;letter-spacing:0.5px}
    .rc-cat{font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:0.5px;flex:1}
    .rc-status{font-size:10px;font-family:'Oswald',sans-serif;padding:2px 8px;border-radius:8px;font-weight:700}
    .rc-title{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#fff}
    .rc-name{font-size:11px;color:#9ca3af}
    .rc-meta{font-size:11px;color:#4b5563;display:flex;gap:6px;flex-wrap:wrap}
    .unassigned{color:#f59e0b}
  `]
})
export class ManageHelpdeskComponent implements OnInit {
  requests:     any[]            = [];
  counts:       Record<string,number> = {};
  loading      = false;
  statusFilter = '';
  catFilter    = '';

  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stCfg  = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;
  statusKeys = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DONE'] as const;
  catKeys    = ['PLUMBING', 'ELECTRICAL', 'HOUSEKEEPING'] as const;

  constructor(private svc: HelpdeskService) {}

  ngOnInit() { this.loadCounts(); this.loadRequests(); }

  get totalCount() { return Object.values(this.counts).reduce((a, b) => a + b, 0); }

  loadCounts() {
    this.svc.getCounts().subscribe({ next: r => this.counts = r.data, error: () => {} });
  }

  loadRequests() {
    this.loading = true;
    this.svc.getAllRequests(this.statusFilter || undefined, this.catFilter || undefined).subscribe({
      next: r => { this.requests = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  setStatusFilter(s: string) { this.statusFilter = s; this.loadRequests(); }
  setCatFilter(c: string)    { this.catFilter    = c; this.loadRequests(); }
}
