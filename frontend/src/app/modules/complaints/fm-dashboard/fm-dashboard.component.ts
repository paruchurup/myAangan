import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, ComplaintStatus, STATUS_CONFIG } from '@models/complaint.model';

@Component({
  selector: 'app-fm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="page">
  <div class="header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
    </div>
    <h1>🏢 FM Dashboard</h1>
    <p>Manage all society complaints</p>
    <div class="stats-row">
      <div class="stat" *ngFor="let s of statCards" [style.background]="s.bg">
        <span class="stat-num" [style.color]="s.color">{{ stats[s.key]||0 }}</span>
        <span class="stat-lbl">{{ s.label }}</span>
      </div>
    </div>
  </div>

  <div class="filter-row">
    <button class="filter-btn" *ngFor="let f of filters" [class.active]="activeFilter===f.value"
      (click)="setFilter(f.value)">{{ f.label }}</button>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading&&filtered.length===0"><div class="empty-icon">✅</div><p>No complaints in this category</p></div>

  <div class="list" *ngIf="!loading">
    <a class="complaint-card" *ngFor="let c of filtered" [routerLink]="['/complaints', c.id]"
      [class.breached]="c.slaBreached">
      <div class="card-header">
        <span class="cat">{{ c.categoryLabel }}</span>
        <span class="badge" [style.background]="sb(c.status)" [style.color]="sc(c.status)">{{ c.statusLabel }}</span>
      </div>
      <div class="card-title">{{ c.title }}</div>
      <div class="card-sub">{{ c.raisedByName }} · {{ c.raisedByFlat || 'No flat' }}</div>
      <div class="card-meta">
        <span>{{ c.createdAt | date:'MMM d' }}</span>
        <span *ngIf="c.attachmentCount">📎 {{ c.attachmentCount }}</span>
        <span *ngIf="!c.assignedToName" class="unassigned">⚠️ Unassigned</span>
        <span *ngIf="c.assignedToName" class="assigned">👤 {{ c.assignedToName }}</span>
        <span class="esc-tag" *ngIf="c.escalationLevel!=='FACILITY_MANAGER'">🚨 {{ c.escalationLabel }}</span>
        <span class="sla-tag" *ngIf="c.slaBreached">⏰ Overdue</span>
      </div>
    </a>
  </div>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px}
    .header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 20px;color:white}
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .header h1{font-size:22px;margin:0 0 2px}.header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 16px}
    .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .stat{border-radius:10px;padding:10px 8px;text-align:center}
    .stat-num{display:block;font-size:22px;font-weight:700}.stat-lbl{font-size:10px;opacity:0.8}
    .filter-row{display:flex;gap:8px;padding:12px 16px;overflow-x:auto;scrollbar-width:none;background:white;border-bottom:1px solid #eee}
    .filter-row::-webkit-scrollbar{display:none}
    .filter-btn{padding:7px 14px;border-radius:20px;border:1.5px solid #ddd;background:white;font-size:12px;cursor:pointer;white-space:nowrap;color:#555}
    .filter-btn.active{background:#0f3460;color:white;border-color:#0f3460}
    .loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:32px;height:32px;border:3px solid #eee;border-top-color:#0f3460;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:60px 20px}.empty-icon{font-size:48px;margin-bottom:8px}.empty p{font-size:16px;color:#555}
    .list{padding:12px 16px;display:flex;flex-direction:column;gap:10px}
    .complaint-card{background:white;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-decoration:none;display:block;border-left:4px solid #e5e7eb}
    .complaint-card.breached{border-left-color:#dc2626}
    .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
    .cat{font-size:12px;color:#666}.badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:8px}
    .card-title{font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:4px}
    .card-sub{font-size:12px;color:#888;margin-bottom:6px}
    .card-meta{display:flex;gap:10px;font-size:11px;color:#aaa;flex-wrap:wrap;align-items:center}
    .unassigned{color:#dc2626;font-weight:600}.assigned{color:#166534;font-weight:600}
    .esc-tag{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-weight:600}
    .sla-tag{background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:6px;font-weight:600}
  `]
})
export class FmDashboardComponent implements OnInit {
  complaints: Complaint[] = [];
  stats: Record<string, number> = {};
  loading = true;
  activeFilter: string = 'ALL';

  statCards = [
    {key:'OPEN',label:'Open',bg:'rgba(254,226,226,0.8)',color:'#991b1b'},
    {key:'IN_PROGRESS',label:'In Progress',bg:'rgba(219,234,254,0.8)',color:'#1e40af'},
    {key:'ESCALATED_TO_BM',label:'Escalated',bg:'rgba(254,243,199,0.8)',color:'#92400e'},
  ];

  filters = [
    {label:'All',value:'ALL'},
    {label:'🔴 Open',value:'OPEN'},
    {label:'🟡 Acknowledged',value:'ACKNOWLEDGED'},
    {label:'🔵 In Progress',value:'IN_PROGRESS'},
    {label:'🚨 Overdue',value:'BREACHED'},
    {label:'🟢 Resolved',value:'RESOLVED'},
    {label:'❌ Rejected',value:'REJECTED'},
  ];

  get filtered(){
    if(this.activeFilter==='ALL') return this.complaints;
    if(this.activeFilter==='BREACHED') return this.complaints.filter(c=>c.slaBreached);
    return this.complaints.filter(c=>c.status===this.activeFilter);
  }

  constructor(private svc: ComplaintService){}

  ngOnInit(){
    this.svc.getAll().subscribe({next:r=>{this.complaints=r.data;this.loading=false;}});
    this.svc.getStats().subscribe({next:r=>{this.stats=r.data;}});
  }

  setFilter(f: string){this.activeFilter=f;}
  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
