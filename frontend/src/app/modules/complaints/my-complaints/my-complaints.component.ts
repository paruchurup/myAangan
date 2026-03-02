import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../../core/services/complaint.service';
import { Complaint, STATUS_CONFIG } from '../../../core/models/complaint.model';

@Component({
  selector: 'app-my-complaints',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="page">
  <div class="header">
    <div class="hrow"><button class="back-btn" routerLink="/dashboard">← Back</button><a routerLink="/complaints/raise" class="btn-raise">+ New</a></div>
    <h1>📢 My Complaints</h1>
    <p>Track issues you have reported</p>
  </div>
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading&&complaints.length===0">
    <div class="empty-icon">📭</div>
    <p>No complaints yet</p>
    <a routerLink="/complaints/raise" class="btn-primary">Report an Issue</a>
  </div>
  <div class="list" *ngIf="!loading&&complaints.length>0">
    <a class="complaint-card" *ngFor="let c of complaints" [routerLink]="['/complaints', c.id]">
      <div class="card-top">
        <span class="cat-lbl">{{ c.categoryLabel }}</span>
        <span class="status-badge" [style.background]="statusBg(c.status)" [style.color]="statusColor(c.status)">{{ c.statusLabel }}</span>
      </div>
      <div class="card-title">{{ c.title }}</div>
      <div class="card-meta">
        <span>{{ c.createdAt | date:'MMM d, h:mm a' }}</span>
        <span *ngIf="c.attachmentCount">📎 {{ c.attachmentCount }}</span>
        <span *ngIf="c.commentCount">💬 {{ c.commentCount }}</span>
        <span class="sla-breached" *ngIf="c.slaBreached">⚠️ Overdue</span>
      </div>
      <div class="escalation-tag" *ngIf="c.escalationLevel!=='FACILITY_MANAGER'">
        🚨 Escalated to {{ c.escalationLabel }}
      </div>
    </a>
  </div>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px}
    .header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .hrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer}
    .btn-raise{background:#e94560;color:white;padding:7px 14px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600}
    .header h1{font-size:22px;margin:0 0 4px}.header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:32px;height:32px;border:3px solid #eee;border-top-color:#0f3460;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:60px 20px}.empty-icon{font-size:48px;margin-bottom:12px}
    .empty p{font-size:16px;color:#555;margin-bottom:20px}
    .btn-primary{background:#0f3460;color:white;padding:10px 24px;border-radius:20px;text-decoration:none;font-size:14px;font-weight:600}
    .list{padding:12px 16px;display:flex;flex-direction:column;gap:10px}
    .complaint-card{background:white;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-decoration:none;display:block;border-left:4px solid #e5e7eb}
    .card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .cat-lbl{font-size:13px;color:#666}
    .status-badge{font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px}
    .card-title{font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:8px}
    .card-meta{display:flex;gap:12px;font-size:12px;color:#aaa;flex-wrap:wrap}
    .sla-breached{color:#dc2626;font-weight:600}
    .escalation-tag{margin-top:8px;font-size:12px;color:#92400e;background:#fef3c7;padding:4px 10px;border-radius:8px;display:inline-block}
  `]
})
export class MyComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  loading = true;

  constructor(private svc: ComplaintService) {}
  ngOnInit(){this.svc.getMyComplaints().subscribe({next:r=>{this.complaints=r.data;this.loading=false;},error:()=>this.loading=false});}
  statusBg(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  statusColor(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
