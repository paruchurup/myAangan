import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, STATUS_CONFIG } from '@models/complaint.model';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-president-report',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="page">
  <div class="header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
    </div>
    <h1>🏛️ Complaints Report</h1>
    <p>All society complaints overview</p>
    <div class="stats-grid">
      <div class="stat-chip" *ngFor="let s of statItems">
        <span class="stat-n">{{ stats[s.key]||0 }}</span>
        <span class="stat-l">{{ s.label }}</span>
      </div>
    </div>
  </div>

  <!-- PDF download panel -->
  <div class="pdf-panel">
    <h3>📄 Generate BDA Submission PDF</h3>
    <p class="pdf-sub">All complaint details, screenshots, and documents will be compiled into a single PDF with cover letter and index.</p>

    <div class="field"><label>Report Title</label>
      <input [(ngModel)]="pdfForm.reportTitle" placeholder="e.g. Complaint Report — March 2025"/></div>
    <div class="field"><label>Society Name</label>
      <input [(ngModel)]="pdfForm.societyName" placeholder="e.g. MyAangan Residency, Bengaluru"/></div>
    <div class="field"><label>Addressed To</label>
      <input [(ngModel)]="pdfForm.addressedTo" placeholder="e.g. The BDA Engineer, Bengaluru Development Authority"/></div>
    <div class="field">
      <label>Covering Letter <span class="opt">(leave blank for auto-generated)</span></label>
      <textarea [(ngModel)]="pdfForm.coveringLetter" rows="6"
        placeholder="Dear Sir/Madam,&#10;&#10;We are residents of [Society Name]...&#10;&#10;We hereby submit this report..."></textarea>
    </div>

    <div class="include-opts">
      <label><input type="checkbox" [(ngModel)]="pdfForm.includeResolved"/> Include resolved complaints</label>
      <label><input type="checkbox" [(ngModel)]="pdfForm.includeClosed"/> Include closed complaints</label>
    </div>

    <div class="pdf-note">📋 PDF will include: Cover letter → Complaint index with page references → Full complaint details → Embedded photos → Document list</div>

    <button class="btn-download" (click)="downloadPdf()" [disabled]="downloading">
      <span *ngIf="!downloading">📥 Download PDF Report</span>
      <span *ngIf="downloading">⏳ Generating PDF... please wait</span>
    </button>
    <div class="dl-err" *ngIf="dlError">{{ dlError }}</div>
  </div>

  <!-- Complaints list -->
  <div class="section-hdr">All Complaints</div>
  <div class="filter-row">
    <button class="filter-btn" *ngFor="let f of filters" [class.active]="activeFilter===f.value" (click)="setFilter(f.value)">{{ f.label }}</button>
  </div>
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="list" *ngIf="!loading">
    <a class="complaint-card" *ngFor="let c of filtered" [routerLink]="['/complaints',c.id]" [class.breached]="c.slaBreached">
      <div class="ct"><span class="cat">{{ c.categoryLabel }}</span><span class="badge" [style.background]="sb(c.status)" [style.color]="sc(c.status)">{{ c.statusLabel }}</span></div>
      <div class="ctitle">{{ c.title }}</div>
      <div class="cmeta">
        <span>{{ c.raisedByName }}</span>
        <span *ngIf="c.raisedByFlat">· {{ c.raisedByFlat }}</span>
        <span>· {{ c.createdAt | date:'MMM d' }}</span>
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
    .header h1{font-size:22px;margin:0 0 4px}.header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 16px}
    .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .stat-chip{background:rgba(255,255,255,0.12);border-radius:10px;padding:10px;text-align:center}
    .stat-n{display:block;font-size:22px;font-weight:700;color:white}.stat-l{font-size:10px;color:rgba(255,255,255,0.7)}
    .pdf-panel{background:white;margin:16px;border-radius:16px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.08)}
    .pdf-panel h3{font-size:16px;color:#0f3460;margin:0 0 6px}
    .pdf-sub{font-size:13px;color:#888;margin:0 0 16px}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
    label{font-size:13px;font-weight:600;color:#1a1a2e}.opt{font-weight:400;color:#aaa;font-size:12px}
    input,textarea{padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;outline:none;background:#fafafa;width:100%;box-sizing:border-box;font-family:inherit}
    input:focus,textarea:focus{border-color:#0f3460}
    textarea{resize:vertical}
    .include-opts{display:flex;gap:16px;margin-bottom:12px}
    .include-opts label{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;cursor:pointer;font-weight:400}
    .pdf-note{background:#f0f4ff;border-radius:8px;padding:10px 12px;font-size:12px;color:#3730a3;margin-bottom:16px;line-height:1.5}
    .btn-download{width:100%;background:#e94560;color:white;border:none;padding:14px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer}
    .btn-download:disabled{background:#ccc;cursor:not-allowed}
    .dl-err{font-size:13px;color:#dc2626;margin-top:8px}
    .section-hdr{padding:16px 16px 8px;font-size:15px;font-weight:700;color:#1a1a2e}
    .filter-row{display:flex;gap:8px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none}
    .filter-row::-webkit-scrollbar{display:none}
    .filter-btn{padding:6px 14px;border-radius:20px;border:1.5px solid #ddd;background:white;font-size:12px;cursor:pointer;white-space:nowrap;color:#555}
    .filter-btn.active{background:#0f3460;color:white;border-color:#0f3460}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:32px;height:32px;border:3px solid #eee;border-top-color:#0f3460;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .list{padding:0 16px;display:flex;flex-direction:column;gap:10px;padding-bottom:16px}
    .complaint-card{background:white;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-decoration:none;display:block;border-left:4px solid #e5e7eb}
    .complaint-card.breached{border-left-color:#dc2626}
    .ct{display:flex;justify-content:space-between;margin-bottom:6px}
    .cat{font-size:12px;color:#666}.badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:8px}
    .ctitle{font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:6px}
    .cmeta{display:flex;gap:8px;font-size:12px;color:#aaa;flex-wrap:wrap}
    .esc-tag{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-weight:600;font-size:11px}
    .sla-tag{background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:6px;font-weight:600;font-size:11px}
  `]
})
export class PresidentReportComponent implements OnInit {
  complaints: Complaint[] = [];
  stats: Record<string, number> = {};
  loading = true;
  downloading = false;
  dlError = '';
  activeFilter = 'ALL';

  pdfForm = {
    reportTitle: '',
    societyName: '',
    addressedTo: 'The BDA Engineer, Bengaluru Development Authority',
    coveringLetter: '',
    includeResolved: false,
    includeClosed: false
  };

  statItems = [
    {key:'OPEN',label:'Open'},{key:'IN_PROGRESS',label:'In Progress'},
    {key:'ESCALATED_TO_BDA',label:'At BDA'},{key:'RESOLVED',label:'Resolved'},
    {key:'ESCALATED_TO_BM',label:'At BM'},{key:'REJECTED',label:'Rejected'},
  ];

  filters = [
    {label:'All',value:'ALL'},{label:'🔴 Open',value:'OPEN'},
    {label:'🔵 In Progress',value:'IN_PROGRESS'},{label:'🚨 Escalated',value:'ESCALATED'},
    {label:'⏰ Overdue',value:'BREACHED'},{label:'🟢 Resolved',value:'RESOLVED'},
  ];

  get filtered(){
    if(this.activeFilter==='ALL') return this.complaints;
    if(this.activeFilter==='BREACHED') return this.complaints.filter(c=>c.slaBreached);
    if(this.activeFilter==='ESCALATED') return this.complaints.filter(c=>c.escalationLevel!=='FACILITY_MANAGER');
    return this.complaints.filter(c=>c.status===this.activeFilter);
  }

  constructor(private svc: ComplaintService, private auth: AuthService){}

  ngOnInit(){
    this.svc.getAll().subscribe({next:r=>{this.complaints=r.data;this.loading=false;}});
    this.svc.getStats().subscribe({next:r=>{this.stats=r.data;}});
    const u = this.auth.getCurrentUser();
    if(u) this.pdfForm.societyName = u.societyName||'';
  }

  setFilter(f: string){this.activeFilter=f;}

  downloadPdf(){
    this.downloading=true; this.dlError='';
    this.svc.downloadPdf(this.pdfForm).subscribe({
      next:(blob)=>{
        this.downloading=false;
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download=`MyAangan_Complaints_${new Date().toISOString().slice(0,10)}.pdf`;
        a.click(); URL.revokeObjectURL(url);
      },
      error:err=>{this.downloading=false;this.dlError='Failed to generate PDF. Please try again.';}
    });
  }

  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
