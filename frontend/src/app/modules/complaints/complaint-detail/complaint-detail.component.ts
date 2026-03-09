import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, STATUS_CONFIG, ComplaintStatus } from '@models/complaint.model';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  template: `
<div class="page">
  <div class="header">
    <button class="back-btn" onclick="history.back()">← Back</button>
    <div *ngIf="c">
      <div class="complaint-num">Complaint #{{ c.id }}</div>
      <h1>{{ c.title }}</h1>
      <div class="badges">
        <span class="status-badge" [style.background]="sb(c.status)" [style.color]="sc(c.status)">{{ c.statusLabel }}</span>
        <span class="cat-badge">{{ c.categoryLabel }}</span>
        <span class="esc-badge" *ngIf="c.escalationLevel!=='FACILITY_MANAGER'">🚨 {{ c.escalationLabel }}</span>
        <span class="sla-badge" *ngIf="c.slaBreached">⚠️ SLA Breached</span>
      </div>
    </div>
  </div>
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="content" *ngIf="c&&!loading">

    <!-- Details -->
    <div class="card">
      <div class="detail-row"><span>Raised by</span><strong>{{ c.raisedByName }} <span class="role-tag">{{ c.raisedByRole }}</span></strong></div>
      <div class="detail-row" *ngIf="c.raisedByFlat"><span>Flat</span><strong>{{ c.raisedByFlat }}</strong></div>
      <div class="detail-row" *ngIf="c.locationDescription"><span>Location</span><strong>{{ c.locationDescription }}</strong></div>
      <div class="detail-row"><span>Reported</span><strong>{{ c.createdAt | date:'MMM d, y h:mm a' }}</strong></div>
      <div class="detail-row" *ngIf="c.assignedToName"><span>Assigned to</span><strong>{{ c.assignedToName }}</strong></div>
      <div class="detail-row" *ngIf="c.slaDueAt"><span>SLA due</span><strong [style.color]="c.slaBreached?'#dc2626':''">{{ c.slaDueAt | date:'MMM d, y h:mm a' }}</strong></div>
    </div>

    <!-- Description -->
    <div class="card">
      <h3>Description</h3>
      <p class="desc">{{ c.description }}</p>
    </div>

    <!-- Resolution / Rejection -->
    <div class="card resolution" *ngIf="c.resolutionNote">
      <h3>✅ Resolution</h3>
      <p>{{ c.resolutionNote }}</p>
    </div>
    <div class="card rejection" *ngIf="c.rejectionReason">
      <h3>❌ Rejection Reason</h3>
      <p>{{ c.rejectionReason }}</p>
    </div>

    <!-- FM Actions -->
    <div class="card actions-card" *ngIf="isFmOrAbove && (c.status==='OPEN'||c.status==='ACKNOWLEDGED'||c.status==='IN_PROGRESS')">
      <h3>⚙️ Actions</h3>
      <div class="action-row">
        <button class="btn-action assign" (click)="assign()" *ngIf="!c.assignedToName">👋 Take Ownership</button>
        <button class="btn-action inprogress" (click)="setStatus('IN_PROGRESS')" *ngIf="c.status!=='IN_PROGRESS'">🔵 Mark In Progress</button>
        <button class="btn-action resolve" (click)="openResolve()">🟢 Resolve</button>
        <button class="btn-action escalate" (click)="doEscalate()" *ngIf="c.escalationLevel!=='BDA_ENGINEER'">🚨 Escalate</button>
        <button class="btn-action reject" (click)="openReject()">❌ Reject</button>
      </div>
      <!-- Resolve form -->
      <div class="sub-form" *ngIf="showResolve">
        <textarea [(ngModel)]="resolutionNote" placeholder="Describe how this was resolved..." rows="3"></textarea>
        <button class="btn-confirm" (click)="confirmResolve()">Confirm Resolution</button>
        <button class="btn-cancel" (click)="showResolve=false">Cancel</button>
      </div>
      <!-- Reject form -->
      <div class="sub-form" *ngIf="showReject">
        <textarea [(ngModel)]="rejectionReason" placeholder="Reason for rejection..." rows="2"></textarea>
        <button class="btn-confirm danger" (click)="confirmReject()">Confirm Rejection</button>
        <button class="btn-cancel" (click)="showReject=false">Cancel</button>
      </div>
    </div>

    <!-- Attachments -->
    <div class="card" *ngIf="c.attachments?.length">
      <h3>📎 Attachments ({{ c.attachments.length }})</h3>
      <div class="att-grid">
        <a class="att-item" *ngFor="let a of c.attachments" [href]="a.url" target="_blank">
          <img *ngIf="a.type==='IMAGE'" [src]="a.url" class="att-thumb" [alt]="a.originalName"/>
          <div *ngIf="a.type!=='IMAGE'" class="att-icon">{{ attIcon(a.type) }}</div>
          <span class="att-name">{{ a.originalName }}</span>
          <span class="att-size">{{ formatSize(a.fileSize) }}</span>
        </a>
      </div>
    </div>

    <!-- Comments -->
    <div class="card">
      <h3>💬 Comments</h3>
      <div class="comments">
        <div class="comment" *ngFor="let cm of c.comments" [class.internal]="cm.internal">
          <div class="cm-header">
            <strong>{{ cm.authorName }}</strong>
            <span class="cm-role">{{ cm.authorRole }}</span>
            <span class="int-tag" *ngIf="cm.internal">🔒 Internal</span>
            <span class="cm-time">{{ cm.createdAt | date:'MMM d, h:mm a' }}</span>
          </div>
          <p class="cm-text">{{ cm.text }}</p>
        </div>
        <div class="no-comments" *ngIf="!c.comments?.length">No comments yet</div>
      </div>

      <!-- Add comment -->
      <div class="add-comment">
        <textarea [(ngModel)]="newComment" placeholder="Add a comment..." rows="2"></textarea>
        <div class="comment-opts">
          <label *ngIf="isFmOrAbove" class="int-check">
            <input type="checkbox" [(ngModel)]="isInternal"/> 🔒 Internal note
          </label>
          <button class="btn-comment" (click)="addComment()" [disabled]="!newComment.trim()">Send</button>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="card" *ngIf="c.history?.length">
      <h3>📋 History</h3>
      <div class="history-list">
        <div class="history-item" *ngFor="let h of c.history">
          <div class="h-dot"></div>
          <div class="h-body">
            <span class="h-action">{{ h.action }}</span>
            <span class="h-detail" *ngIf="h.oldValue&&h.newValue">{{ h.oldValue }} → {{ h.newValue }}</span>
            <span class="h-by">{{ h.performedBy }} · {{ h.createdAt | date:'MMM d, h:mm a' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px}
    .header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;margin-bottom:12px;display:inline-block}
    .complaint-num{font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:4px}
    .header h1{font-size:20px;margin:0 0 10px;line-height:1.3}
    .badges{display:flex;flex-wrap:wrap;gap:6px}
    .status-badge,.cat-badge,.esc-badge,.sla-badge{font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px}
    .cat-badge{background:#e8f0fe;color:#0f3460}
    .esc-badge{background:#fef3c7;color:#92400e}
    .sla-badge{background:#fee2e2;color:#991b1b}
    .loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:32px;height:32px;border:3px solid #eee;border-top-color:#0f3460;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .content{padding:12px 16px;display:flex;flex-direction:column;gap:12px}
    .card{background:white;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
    .card h3{font-size:15px;color:#0f3460;margin:0 0 12px}
    .detail-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
    .detail-row:last-child{border:none}
    .detail-row span{color:#888}.detail-row strong{color:#1a1a2e;text-align:right;max-width:60%}
    .role-tag{font-size:10px;color:#888;font-weight:400;background:#f3f4f6;padding:1px 6px;border-radius:6px;margin-left:4px}
    .desc{font-size:14px;color:#444;line-height:1.6;margin:0}
    .resolution{border-left:4px solid #166534}.resolution h3{color:#166534}.resolution p{font-size:14px;color:#444;margin:0}
    .rejection{border-left:4px solid #dc2626}.rejection h3{color:#dc2626}.rejection p{font-size:14px;color:#444;margin:0}
    .action-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
    .btn-action{padding:8px 14px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer}
    .assign{background:#e8f0fe;color:#0f3460}.inprogress{background:#dbeafe;color:#1e40af}
    .resolve{background:#dcfce7;color:#166534}.escalate{background:#fef3c7;color:#92400e}
    .reject{background:#fee2e2;color:#991b1b}
    .sub-form{background:#f8f9ff;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px}
    .sub-form textarea{padding:8px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px;outline:none;font-family:inherit;resize:vertical}
    .btn-confirm{background:#0f3460;color:white;border:none;padding:9px 16px;border-radius:8px;font-size:13px;cursor:pointer}
    .btn-confirm.danger{background:#dc2626}
    .btn-cancel{background:none;border:none;color:#888;font-size:13px;cursor:pointer}
    .att-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .att-item{display:flex;flex-direction:column;align-items:center;background:#f8f9ff;border-radius:10px;padding:10px;text-decoration:none;gap:6px}
    .att-thumb{width:100%;height:80px;object-fit:cover;border-radius:6px}
    .att-icon{font-size:32px}
    .att-name{font-size:11px;color:#555;text-align:center;word-break:break-word}
    .att-size{font-size:10px;color:#aaa}
    .comments{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
    .comment{background:#f8f9ff;border-radius:10px;padding:12px}
    .comment.internal{background:#fffbeb;border-left:3px solid #f59e0b}
    .cm-header{display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap}
    .cm-header strong{font-size:13px;color:#1a1a2e}
    .cm-role{font-size:10px;color:#888;background:#f3f4f6;padding:1px 6px;border-radius:6px}
    .int-tag{font-size:11px;color:#92400e;background:#fef3c7;padding:1px 6px;border-radius:6px}
    .cm-time{font-size:11px;color:#aaa;margin-left:auto}
    .cm-text{font-size:13px;color:#444;margin:0}
    .no-comments{font-size:13px;color:#aaa;text-align:center;padding:20px 0}
    .add-comment textarea{width:100%;padding:10px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box;margin-bottom:8px}
    .comment-opts{display:flex;align-items:center;justify-content:space-between}
    .int-check{display:flex;align-items:center;gap:6px;font-size:13px;color:#666;cursor:pointer}
    .btn-comment{background:#0f3460;color:white;border:none;padding:9px 20px;border-radius:10px;font-size:13px;cursor:pointer}
    .btn-comment:disabled{background:#ccc;cursor:not-allowed}
    .history-list{display:flex;flex-direction:column;gap:0}
    .history-item{display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #f5f5f5}
    .history-item:last-child{border:none}
    .h-dot{width:8px;height:8px;border-radius:50%;background:#0f3460;flex-shrink:0;margin-top:5px}
    .h-body{flex:1;display:flex;flex-direction:column;gap:2px}
    .h-action{font-size:13px;font-weight:600;color:#1a1a2e}
    .h-detail{font-size:12px;color:#666}
    .h-by{font-size:11px;color:#aaa}
  `]
})
export class ComplaintDetailComponent implements OnInit {
  c: Complaint | null = null;
  loading = true;
  newComment = ''; isInternal = false;
  showResolve = false; showReject = false;
  resolutionNote = ''; rejectionReason = '';
  isFmOrAbove = false;

  constructor(private route: ActivatedRoute, private svc: ComplaintService, private auth: AuthService) {}

  ngOnInit() {
    const role = this.auth.getCurrentUser()?.role;
    this.isFmOrAbove = ['FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','ADMIN','PRESIDENT','SECRETARY','VOLUNTEER'].includes(role||'');
    this.load();
  }

  load() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({next:r=>{this.c=r.data;this.loading=false;},error:()=>this.loading=false});
  }

  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
  attIcon(t: string){return t==='PDF'?'📄':t==='VIDEO'?'🎥':'📎';}
  formatSize(b: number){if(!b)return '';if(b<1024*1024)return (b/1024).toFixed(0)+'KB';return (b/1024/1024).toFixed(1)+'MB';}

  assign(){this.svc.assign(this.c!.id).subscribe({next:r=>{this.c=r.data;}});}
  setStatus(s: ComplaintStatus){this.svc.updateStatus(this.c!.id,{status:s}).subscribe({next:r=>{this.c=r.data;}});}
  openResolve(){this.showResolve=true;this.showReject=false;}
  openReject(){this.showReject=true;this.showResolve=false;}
  confirmResolve(){this.svc.updateStatus(this.c!.id,{status:'RESOLVED',resolutionNote:this.resolutionNote}).subscribe({next:r=>{this.c=r.data;this.showResolve=false;}});}
  confirmReject(){if(!this.rejectionReason.trim())return;this.svc.updateStatus(this.c!.id,{status:'REJECTED',rejectionReason:this.rejectionReason}).subscribe({next:r=>{this.c=r.data;this.showReject=false;}});}
  doEscalate(){if(confirm('Escalate this complaint to the next level?'))this.svc.escalate(this.c!.id).subscribe({next:r=>{this.c=r.data;}});}
  addComment(){if(!this.newComment.trim())return;this.svc.addComment(this.c!.id,this.newComment,this.isInternal).subscribe({next:()=>{this.newComment='';this.load();}});}
}
