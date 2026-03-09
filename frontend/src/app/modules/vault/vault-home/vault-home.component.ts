import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VaultService } from '@services/vault.service';
import { AuthService } from '@services/auth.service';
import { DOC_TYPE_CONFIG, FORMAT_ICONS } from '@models/vault.model';

@Component({
  selector: 'app-vault-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <div class="header-actions">
        <button class="admin-btn" *ngIf="canUpload" routerLink="/vault/admin">⚙️ Admin</button>
        <button class="noc-btn" (click)="tab='NOC_REQ'">+ Request NOC</button>
      </div>
    </div>
    <h1>📂 Document Vault</h1>
    <p>Access your society documents</p>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="body" *ngIf="!loading && vault">
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" [class.active]="tab==='SOCIETY'"  (click)="tab='SOCIETY'">🏛️ Society</button>
      <button class="tab" [class.active]="tab==='NOC'"      (click)="tab='NOC'">📜 My NOCs</button>
      <button class="tab" [class.active]="tab==='MAINTENANCE'" (click)="tab='MAINTENANCE'">🔧 Maintenance</button>
      <button class="tab" [class.active]="tab==='NOC_REQ'"  (click)="tab='NOC_REQ'">📋 Requests</button>
    </div>

    <!-- Society docs -->
    <div class="tab-body" *ngIf="tab==='SOCIETY'">
      <div class="empty-msg" *ngIf="!vault.society?.length">No society documents yet.</div>
      <div class="doc-list">
        <div class="doc-card" *ngFor="let d of vault.society">
          <ng-container *ngTemplateOutlet="docCard; context: {d: d}"></ng-container>
        </div>
      </div>
    </div>

    <!-- My NOCs -->
    <div class="tab-body" *ngIf="tab==='NOC'">
      <div class="empty-msg" *ngIf="!vault.nocs?.length">No NOCs issued to you yet. Request one below.</div>
      <div class="doc-list">
        <div class="doc-card" *ngFor="let d of vault.nocs">
          <ng-container *ngTemplateOutlet="docCard; context: {d: d}"></ng-container>
        </div>
      </div>
    </div>

    <!-- Maintenance docs -->
    <div class="tab-body" *ngIf="tab==='MAINTENANCE'">
      <div class="empty-msg" *ngIf="!vault.maintenance?.length">No maintenance documents yet.</div>
      <div class="doc-list">
        <div class="doc-card" *ngFor="let d of vault.maintenance">
          <ng-container *ngTemplateOutlet="docCard; context: {d: d}"></ng-container>
        </div>
      </div>
    </div>

    <!-- NOC requests -->
    <div class="tab-body" *ngIf="tab==='NOC_REQ'">
      <!-- Request form -->
      <div class="noc-form">
        <div class="nf-title">📋 Request a New NOC</div>
        <div class="field"><label>Purpose *</label>
          <input [(ngModel)]="noc.purpose" placeholder="e.g. Bank loan, Flat resale, Vehicle parking NOC" /></div>
        <div class="field"><label>Details</label>
          <textarea [(ngModel)]="noc.details" rows="3" placeholder="Any additional details for the admin…"></textarea></div>
        <div class="error" *ngIf="nocError">{{ nocError }}</div>
        <button class="submit-btn" (click)="submitNoc()" [disabled]="submittingNoc">
          {{ submittingNoc ? 'Submitting…' : '📤 Submit Request' }}</button>
      </div>

      <!-- Past requests -->
      <div class="section-label">YOUR NOC REQUESTS</div>
      <div class="empty-msg" *ngIf="!vault.nocRequests?.length">No NOC requests yet.</div>
      <div class="noc-req-card" *ngFor="let r of vault.nocRequests">
        <div class="nrc-top">
          <div class="nrc-purpose">{{ r.purpose }}</div>
          <div class="nrc-status" [class]="r.status.toLowerCase()">{{ nocStatusLabel(r.status) }}</div>
        </div>
        <div class="nrc-detail" *ngIf="r.details">{{ r.details }}</div>
        <div class="nrc-rejection" *ngIf="r.status === 'REJECTED' && r.rejectionReason">
          Reason: {{ r.rejectionReason }}
        </div>
        <div class="nrc-date">{{ r.createdAt | date:'d MMM yyyy' }}</div>
      </div>
    </div>
  </div>

  <!-- Doc card template -->
  <ng-template #docCard let-d="d">
    <div class="dc-left">
      <div class="dc-format">{{ fmtIcon(d.fileFormat) }}</div>
      <div class="dc-info">
        <div class="dc-title">{{ d.title }}</div>
        <div class="dc-meta">
          <span class="dc-fmt-badge">{{ d.fileFormat }}</span>
          <span *ngIf="d.expiryDate" [class.expired]="isExpired(d.expiryDate)" [class.expiring]="isExpiringSoon(d.expiryDate)">
            {{ isExpired(d.expiryDate) ? '⚠️ Expired' : 'Valid until' }} {{ d.expiryDate | date:'d MMM yyyy' }}
          </span>
          <span class="dc-date">{{ d.createdAt | date:'d MMM yyyy' }}</span>
        </div>
        <div class="dc-desc" *ngIf="d.description">{{ d.description }}</div>
      </div>
    </div>
    <a class="dc-dl" [href]="svc.downloadUrl(d.id)" target="_blank">⬇</a>
  </ng-template>

  <div class="ok"  *ngIf="okMsg">{{ okMsg }}</div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121;position:relative}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .header-actions{display:flex;flex-direction:column;gap:6px;align-items:flex-end}
    .noc-btn{background:#6366f1;border:none;color:#fff;padding:9px 14px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
    .admin-btn{background:none;border:1px solid rgba(255,255,255,0.3);color:rgba(255,255,255,0.8);padding:7px 12px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:11px;cursor:pointer}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{display:flex;flex-direction:column}
    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a;overflow-x:auto}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:10px 4px;font-size:11px;font-family:'Oswald',sans-serif;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap;min-width:60px}
    .tab.active{color:#6366f1;border-bottom-color:#6366f1}
    .tab-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .empty-msg{text-align:center;padding:30px;color:#4b5563;font-size:13px}
    .section-label{font-family:'Oswald',sans-serif;font-size:10px;color:#6366f1;letter-spacing:2px;border-bottom:1px solid #2a2a2a;padding-bottom:4px}

    /* Doc cards */
    .doc-list{display:flex;flex-direction:column;gap:8px}
    .doc-card{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
    .dc-left{display:flex;gap:12px;align-items:flex-start;flex:1;min-width:0}
    .dc-format{font-size:26px;flex-shrink:0}
    .dc-info{flex:1;min-width:0}
    .dc-title{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#fff;letter-spacing:0.3px}
    .dc-meta{display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:#6b7280;margin-top:3px;align-items:center}
    .dc-fmt-badge{background:#1c1c1c;border:1px solid #333;color:#9ca3af;padding:1px 6px;border-radius:4px;font-size:10px;font-family:'Oswald',sans-serif}
    .expired{color:#ef4444!important;font-weight:600}
    .expiring{color:#f59e0b!important}
    .dc-date{color:#4b5563}
    .dc-desc{font-size:11px;color:#6b7280;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dc-dl{font-size:20px;text-decoration:none;padding:6px;border:1px solid #333;border-radius:6px;background:#1c1c1c;flex-shrink:0;display:flex;align-items:center}
    .dc-dl:hover{border-color:#6366f1}

    /* NOC form */
    .noc-form{background:#1a1a2e;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:9px}
    .nf-title{font-family:'Oswald',sans-serif;font-size:13px;color:#6366f1;font-weight:700}
    .field{display:flex;flex-direction:column;gap:4px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;font-family:'Oswald',sans-serif}
    input,textarea{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px 10px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box;resize:vertical}
    input:focus,textarea:focus{border-color:#6366f1}
    .error{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:7px 10px;border-radius:6px;font-size:12px}
    .submit-btn{background:#6366f1;border:none;color:#fff;padding:10px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
    .submit-btn:disabled{opacity:0.4}

    /* NOC request cards */
    .noc-req-card{background:#252525;border:1px solid #333;border-radius:9px;padding:11px 13px;display:flex;flex-direction:column;gap:5px}
    .nrc-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
    .nrc-purpose{font-family:'Oswald',sans-serif;font-size:14px;color:#fff;font-weight:700}
    .nrc-status{font-size:10px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:8px;font-weight:700}
    .nrc-status.pending{background:rgba(245,158,11,0.1);color:#f59e0b}
    .nrc-status.fulfilled{background:rgba(16,185,129,0.1);color:#10b981}
    .nrc-status.rejected{background:rgba(239,68,68,0.1);color:#ef4444}
    .nrc-detail{font-size:12px;color:#9ca3af}
    .nrc-rejection{font-size:12px;color:#ef4444;font-style:italic}
    .nrc-date{font-size:11px;color:#4b5563}
    .ok{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:480px;background:rgba(16,185,129,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}
  `]
})
export class VaultHomeComponent implements OnInit {
  vault:    any    = null;
  loading         = false;
  tab             = 'SOCIETY';
  canUpload       = false;
  submittingNoc   = false;
  nocError        = '';
  okMsg           = '';
  noc = { purpose: '', details: '' };

  docTypeCfg = DOC_TYPE_CONFIG;

  constructor(public svc: VaultService, private auth: AuthService) {}

  ngOnInit() {
    this.canUpload = this.auth.can('VAULT_UPLOAD');
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getMyVault().subscribe({
      next: r => { this.vault = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  fmtIcon(fmt: string): string {
    return FORMAT_ICONS[fmt] || '📄';
  }

  isExpired(date: string): boolean {
    return date ? new Date(date) < new Date() : false;
  }

  isExpiringSoon(date: string): boolean {
    if (!date) return false;
    const exp = new Date(date);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return exp >= new Date() && exp <= soon;
  }

  nocStatusLabel(s: string): string {
    return s === 'PENDING' ? '⏳ Pending' : s === 'FULFILLED' ? '✅ Fulfilled' : '❌ Rejected';
  }

  submitNoc() {
    if (!this.noc.purpose.trim()) { this.nocError = 'Purpose is required.'; return; }
    this.submittingNoc = true; this.nocError = '';
    this.svc.requestNoc(this.noc).subscribe({
      next: () => {
        this.okMsg = 'NOC request submitted!';
        setTimeout(() => this.okMsg = '', 3000);
        this.noc = { purpose: '', details: '' };
        this.load();
        this.tab = 'NOC_REQ';
        this.submittingNoc = false;
      },
      error: e => { this.nocError = e.error?.message || 'Failed.'; this.submittingNoc = false; }
    });
  }
}

