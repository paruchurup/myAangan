// my-requests.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { AuthService } from '@services/auth.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <button class="raise-btn" routerLink="/helpdesk/raise">+ New</button>
    </div>
    <h1>🛠️ My Service Requests</h1>
    <p>Track your helpdesk service requests</p>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading && !requests.length">
    <div>🛠️</div><p>No requests yet</p>
    <small>Tap "+ New" to raise a service request</small>
  </div>

  <div class="list">
    <a class="req-card" [routerLink]="['/helpdesk', r.id]" *ngFor="let r of requests">
      <div class="rc-stripe" [style.background]="catCfg[r.category]?.color"></div>
      <div class="rc-body">
        <div class="rc-top">
          <div class="rc-cat" [style.color]="catCfg[r.category]?.color">{{ catCfg[r.category]?.icon }} {{ catCfg[r.category]?.label }}</div>
          <div class="rc-status" [style.background]="stCfg[r.status]?.bg" [style.color]="stCfg[r.status]?.color">
            {{ stCfg[r.status]?.icon }} {{ stCfg[r.status]?.label }}
          </div>
        </div>
        <div class="rc-title">{{ r.title }}</div>
        <div class="rc-meta">
          <span>{{ r.createdAt | date:'d MMM yyyy' }}</span>
          <span *ngIf="r.assignedStaff">· 👤 {{ r.assignedStaff }}</span>
          <span *ngIf="r.confirmedAt">· ✅ {{ r.confirmedAt | date:'d MMM, h:mm a' }}</span>
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
    .raise-btn{background:#3b82f6;border:none;color:#fff;padding:9px 14px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;cursor:pointer}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:28px;height:28px;border:3px solid #333;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:42px}.empty p{font-family:'Oswald',sans-serif;font-size:18px}.empty small{font-size:12px}
    .list{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .req-card{background:#252525;border:1px solid #333;border-radius:10px;display:flex;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.15s}
    .req-card:hover{border-color:#3b82f6}
    .rc-stripe{width:4px;flex-shrink:0}
    .rc-body{flex:1;padding:11px 13px;display:flex;flex-direction:column;gap:5px}
    .rc-top{display:flex;justify-content:space-between;align-items:center}
    .rc-cat{font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:0.5px}
    .rc-status{font-size:10px;font-family:'Oswald',sans-serif;padding:2px 8px;border-radius:8px;font-weight:700}
    .rc-title{font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;color:#fff}
    .rc-meta{font-size:11px;color:#4b5563;display:flex;gap:6px;flex-wrap:wrap}
  `]
})
export class MyRequestsComponent implements OnInit {
  requests: any[] = [];
  loading = true;
  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stCfg  = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;
  constructor(private svc: HelpdeskService, private auth: AuthService) {}
  ngOnInit() {
    this.svc.getMyRequests().subscribe({ next: r => { this.requests = r.data; this.loading = false; }, error: () => this.loading = false });
  }
}
