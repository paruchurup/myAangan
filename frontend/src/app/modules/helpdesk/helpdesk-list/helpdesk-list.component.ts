import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { AuthService } from '@services/auth.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-helpdesk-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <div class="header-actions">
        <button class="fm-btn" *ngIf="canManage" routerLink="/helpdesk/fm">📋 FM View</button>
        <button class="raise-btn" routerLink="/helpdesk/raise">+ New Request</button>
      </div>
    </div>
    <h1>🛠️ Helpdesk</h1>
    <p>Service requests</p>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading && requests.length === 0">
    <div>🛠️</div><p>No requests yet</p>
    <small>Tap "+ New Request" to raise your first service request</small>
  </div>

  <div class="list">
    <a class="req-card" [routerLink]="['/helpdesk', r.id]" *ngFor="let r of requests">
      <div class="req-stripe" [style.background]="catCfg[r.category]?.color"></div>
      <div class="req-body">
        <div class="req-top">
          <div class="req-cat">
            <span class="cat-icon">{{ catCfg[r.category]?.icon }}</span>
            <span class="cat-name" [style.color]="catCfg[r.category]?.color">{{ catCfg[r.category]?.label }}</span>
          </div>
          <div class="status-pill"
            [style.background]="stsCfg[r.status]?.bg"
            [style.color]="stsCfg[r.status]?.color">
            {{ stsCfg[r.status]?.icon }} {{ stsCfg[r.status]?.label }}
          </div>
        </div>
        <div class="req-title">{{ r.title }}</div>
        <div class="req-meta">
          <span>📅 {{ r.createdAt | date:'d MMM yyyy' }}</span>
          <span *ngIf="r.confirmedDatetime">🕐 Scheduled: {{ r.confirmedDatetime | date:'d MMM, h:mm a' }}</span>
          <span *ngIf="r.assignedStaffName">👷 {{ r.assignedStaffName }}</span>
        </div>
      </div>
    </a>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .header-actions{display:flex;gap:6px;align-items:center}
    .raise-btn{background:#3b82f6;border:none;color:#fff;padding:9px 14px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
    .fm-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:7px 12px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:11px;cursor:pointer;white-space:nowrap}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:42px}.empty p{font-family:'Oswald',sans-serif;font-size:18px}.empty small{font-size:12px}
    .list{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .req-card{background:#252525;border:1px solid #333;border-radius:12px;display:flex;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.15s}
    .req-card:hover{border-color:#3b82f6}
    .req-stripe{width:5px;flex-shrink:0}
    .req-body{flex:1;padding:12px 14px;display:flex;flex-direction:column;gap:7px}
    .req-top{display:flex;justify-content:space-between;align-items:center}
    .req-cat{display:flex;align-items:center;gap:6px}
    .cat-icon{font-size:16px}
    .cat-name{font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px}
    .status-pill{font-size:10px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
    .req-title{font-family:'Oswald',sans-serif;font-size:15px;color:#fff;font-weight:700;letter-spacing:0.3px}
    .req-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:#6b7280}
  `]
})
export class HelpdeskListComponent implements OnInit {
  requests: any[] = [];
  loading   = false;
  canManage = false;
  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stsCfg = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(private svc: HelpdeskService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('HELPDESK_MANAGE');
    this.loading = true;
    this.svc.getMyRequests().subscribe({
      next: r => { this.requests = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
