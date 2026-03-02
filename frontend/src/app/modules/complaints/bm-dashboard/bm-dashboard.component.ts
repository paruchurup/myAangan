import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintService } from '../../../core/services/complaint.service';
import { Complaint, STATUS_CONFIG, EscalationLevel } from '../../../core/models/complaint.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="header">
    <h1>{{ isBda ? '🏛️ BDA Engineer' : '🏗️ Builder Manager' }} Dashboard</h1>
    <p>{{ isBda ? 'Complaints escalated to BDA level' : 'Complaints escalated to Builder Manager' }}</p>
    <div class="summary">{{ complaints.length }} complaints · {{ breachedCount }} overdue</div>
  </div>
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading&&complaints.length===0">
    <div class="empty-icon">✅</div>
    <p>No complaints escalated to your level yet</p>
  </div>
  <div class="list" *ngIf="!loading">
    <a class="complaint-card" *ngFor="let c of complaints" [routerLink]="['/complaints',c.id]"
      [class.breached]="c.slaBreached">
      <div class="card-top">
        <span class="cat">{{ c.categoryLabel }}</span>
        <span class="badge" [style.background]="sb(c.status)" [style.color]="sc(c.status)">{{ c.statusLabel }}</span>
      </div>
      <div class="card-title">{{ c.title }}</div>
      <div class="card-sub">{{ c.raisedByName }} · {{ c.raisedByFlat||'—' }}</div>
      <div class="card-meta">
        <span>{{ c.createdAt | date:'MMM d, y' }}</span>
        <span class="esc-lbl">🚨 {{ c.escalationLabel }}</span>
        <span class="sla-lbl" *ngIf="c.slaBreached">⏰ SLA Breached</span>
        <span *ngIf="c.slaDueAt&&!c.slaBreached">Due {{ c.slaDueAt | date:'MMM d' }}</span>
      </div>
    </a>
  </div>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px}
    .header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header h1{font-size:22px;margin:0 0 4px}.header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 8px}
    .summary{font-size:13px;color:#fcd34d;font-weight:600}
    .loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:32px;height:32px;border:3px solid #eee;border-top-color:#0f3460;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:60px 20px}.empty-icon{font-size:48px;margin-bottom:8px}.empty p{font-size:16px;color:#555}
    .list{padding:12px 16px;display:flex;flex-direction:column;gap:10px}
    .complaint-card{background:white;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-decoration:none;display:block;border-left:4px solid #f59e0b}
    .complaint-card.breached{border-left-color:#dc2626}
    .card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
    .cat{font-size:12px;color:#666}.badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:8px}
    .card-title{font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:4px}
    .card-sub{font-size:12px;color:#888;margin-bottom:6px}
    .card-meta{display:flex;gap:10px;font-size:11px;color:#aaa;flex-wrap:wrap}
    .esc-lbl{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-weight:600}
    .sla-lbl{background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:6px;font-weight:600}
  `]
})
export class BmDashboardComponent implements OnInit {
  complaints: Complaint[] = [];
  loading = true;
  isBda = false;
  get breachedCount(){return this.complaints.filter(c=>c.slaBreached).length;}
  constructor(private svc: ComplaintService, private auth: AuthService){}
  ngOnInit(){
    this.isBda = this.auth.getRole()==='BDA_ENGINEER';
    const level: EscalationLevel = this.isBda ? 'BDA_ENGINEER' : 'BUILDER_MANAGER';
    this.svc.getEscalated(level).subscribe({next:r=>{this.complaints=r.data;this.loading=false;},error:()=>this.loading=false});
  }
  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
