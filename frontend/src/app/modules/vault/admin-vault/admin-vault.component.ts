import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VaultService } from '../../../core/services/vault.service';
import { DOC_TYPE_CONFIG, FORMAT_ICONS } from '../../../core/models/vault.model';

@Component({
  selector: 'app-admin-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">
  <div class="header">
    <button class="back-btn" routerLink="/vault">←</button>
    <div>
      <div class="eyebrow">ADMIN</div>
      <h1>📂 Vault Management</h1>
    </div>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="body" *ngIf="!loading && vault">
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" [class.active]="tab==='UPLOAD'"  (click)="tab='UPLOAD'">⬆ Upload</button>
      <button class="tab" [class.active]="tab==='SOCIETY'" (click)="tab='SOCIETY'">🏛️ Society</button>
      <button class="tab" [class.active]="tab==='NOC'"     (click)="tab='NOC'">📜 NOCs</button>
      <button class="tab" [class.active]="tab==='MAINT'"   (click)="tab='MAINT'">🔧 Maintenance</button>
      <button class="tab" [class.active]="tab==='REQUESTS'" (click)="tab='REQUESTS'">
        📋 Requests <span class="badge" *ngIf="vault.pendingNocs > 0">{{ vault.pendingNocs }}</span>
      </button>
    </div>

    <!-- ── UPLOAD ──────────────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='UPLOAD'">
      <div class="upload-form">
        <div class="uf-title">📤 Upload New Document</div>

        <!-- Doc type selector -->
        <div class="type-row">
          <button class="type-btn" *ngFor="let t of docTypes"
            [class.selected]="upload.type === t.key"
            [style.border-color]="upload.type === t.key ? t.color : '#333'"
            (click)="upload.type = t.key">
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <div class="field"><label>Title *</label>
          <input [(ngModel)]="upload.title" placeholder="Document title" /></div>
        <div class="field"><label>Description</label>
          <textarea [(ngModel)]="upload.description" rows="2" placeholder="Brief description (optional)"></textarea></div>

        <!-- NOC: link to resident -->
        <div class="field" *ngIf="upload.type === 'NOC'">
          <label>Resident Email * (NOC is linked to this resident)</label>
          <input [(ngModel)]="upload.residentEmail" placeholder="resident@email.com" />
        </div>
        <div class="field" *ngIf="upload.type === 'NOC' && pendingNocRequests.length">
          <label>Fulfil pending NOC request (optional)</label>
          <select [(ngModel)]="upload.nocRequestId">
            <option [value]="null">— Not linked to a request —</option>
            <option *ngFor="let r of pendingNocRequests" [value]="r.id">
              #{{ r.id }} · {{ r.resident?.firstName }} {{ r.resident?.lastName }} · {{ r.purpose }}
            </option>
          </select>
        </div>

        <div class="field"><label>Expiry Date (optional)</label>
          <input type="date" [(ngModel)]="upload.expiryDate" /></div>

        <div class="file-row">
          <label class="file-label" for="docFile">{{ uploadFile ? uploadFile.name : '📎 Choose File (PDF / JPG / PNG / DOCX)' }}</label>
          <input type="file" id="docFile" (change)="onFile($event)"
            accept=".pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            class="file-inp" />
        </div>

        <div class="error" *ngIf="uploadError">{{ uploadError }}</div>
        <button class="upload-btn" (click)="doUpload()" [disabled]="uploading">
          {{ uploading ? 'Uploading…' : '📤 Upload Document' }}</button>
      </div>
    </div>

    <!-- ── SOCIETY / NOC / MAINTENANCE lists (shared template) ────────── -->
    <div class="tab-body" *ngIf="tab==='SOCIETY' || tab==='NOC' || tab==='MAINT'">
      <div class="empty-msg" *ngIf="currentDocs.length === 0">No documents in this category.</div>
      <div class="doc-card" *ngFor="let d of currentDocs">
        <div class="dc-left">
          <div class="dc-fmt">{{ fmtIcon(d.fileFormat) }}</div>
          <div class="dc-info">
            <div class="dc-title">{{ d.title }}</div>
            <div class="dc-meta">
              <span class="fmt-badge">{{ d.fileFormat }}</span>
              <span *ngIf="d.resident" class="resident-tag">👤 {{ d.resident.firstName }} {{ d.resident.lastName }} · Flat {{ d.resident.flatNumber }}</span>
              <span *ngIf="d.expiryDate" [class.expired]="isExpired(d.expiryDate)">
                {{ isExpired(d.expiryDate) ? '⚠️ Expired' : 'Exp:' }} {{ d.expiryDate | date:'d MMM yy' }}
              </span>
              <span class="upload-date">{{ d.createdAt | date:'d MMM yyyy' }}</span>
            </div>
          </div>
        </div>
        <div class="dc-actions">
          <a class="dl-btn" [href]="svc.downloadUrl(d.id)" target="_blank">⬇</a>
          <button class="del-btn" (click)="deleteDoc(d.id)">🗑</button>
        </div>
      </div>
    </div>

    <!-- ── NOC REQUESTS ───────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='REQUESTS'">
      <div class="empty-msg" *ngIf="!vault.nocRequests?.length">No NOC requests.</div>
      <div class="noc-req-card" *ngFor="let r of vault.nocRequests">
        <div class="nrc-header">
          <div class="nrc-info">
            <div class="nrc-name">{{ r.resident?.firstName }} {{ r.resident?.lastName }} · Flat {{ r.resident?.flatNumber }}</div>
            <div class="nrc-purpose">{{ r.purpose }}</div>
            <div class="nrc-details" *ngIf="r.details">{{ r.details }}</div>
            <div class="nrc-date">{{ r.createdAt | date:'d MMM yyyy' }}</div>
          </div>
          <div class="nrc-status" [class]="r.status.toLowerCase()">
            {{ r.status === 'PENDING' ? '⏳ Pending' : r.status === 'FULFILLED' ? '✅ Fulfilled' : '❌ Rejected' }}
          </div>
        </div>

        <!-- Pending actions -->
        <div class="nrc-actions" *ngIf="r.status === 'PENDING'">
          <button class="fulfil-btn" (click)="fulfilNoc(r)">📜 Upload NOC to Fulfil</button>
          <div class="reject-row">
            <input [(ngModel)]="rejectReasons[r.id]" placeholder="Rejection reason" class="reject-input" />
            <button class="reject-btn" (click)="rejectNoc(r.id)" [disabled]="rejecting[r.id]">Reject</button>
          </div>
        </div>
        <div class="nrc-rejection" *ngIf="r.status === 'REJECTED' && r.rejectionReason">
          Reason: {{ r.rejectionReason }}
        </div>
      </div>
    </div>
  </div>

  <div class="ok"  *ngIf="okMsg">{{ okMsg }}</div>
  <div class="err" *ngIf="errMsg">{{ errMsg }}</div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8;position:relative}
    .header{background:linear-gradient(180deg,#111,#161616);border-bottom:3px solid #f59e0b;padding:12px 16px;display:flex;align-items:center;gap:10px}
    .back-btn{background:none;border:1px solid #333;color:#9ca3af;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer}
    .eyebrow{font-size:10px;color:#f59e0b;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;margin:0}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a;overflow-x:auto}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap;min-width:55px;position:relative}
    .tab.active{color:#f59e0b;border-bottom-color:#f59e0b}
    .badge{background:#ef4444;color:#fff;font-size:9px;padding:1px 5px;border-radius:8px;margin-left:3px}
    .tab-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .empty-msg{text-align:center;padding:30px;color:#4b5563;font-size:13px}

    /* Upload form */
    .upload-form{background:#1a1a2e;border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}
    .uf-title{font-family:'Oswald',sans-serif;font-size:13px;color:#f59e0b;font-weight:700}
    .type-row{display:flex;gap:8px;flex-wrap:wrap}
    .type-btn{background:#252525;border:2px solid #333;border-radius:8px;padding:8px 12px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;color:#9ca3af;cursor:pointer;transition:all 0.15s}
    .type-btn.selected{color:#fff}
    .field{display:flex;flex-direction:column;gap:4px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;font-family:'Oswald',sans-serif}
    input,textarea,select{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px 10px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box;resize:vertical}
    input:focus,textarea:focus,select:focus{border-color:#f59e0b}
    .file-row{display:flex}
    .file-label{flex:1;background:#1c1c1c;border:1.5px dashed #333;border-radius:6px;color:#9ca3af;padding:10px 12px;font-size:12px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .file-inp{display:none}
    .error{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:7px 10px;border-radius:6px;font-size:12px}
    .upload-btn{background:#f59e0b;border:none;color:#111;padding:11px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
    .upload-btn:disabled{opacity:0.4}

    /* Doc cards */
    .doc-card{background:#252525;border:1px solid #333;border-radius:10px;padding:11px 13px;display:flex;justify-content:space-between;align-items:center;gap:10px}
    .dc-left{display:flex;gap:10px;align-items:flex-start;flex:1;min-width:0}
    .dc-fmt{font-size:24px;flex-shrink:0}
    .dc-info{flex:1;min-width:0}
    .dc-title{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#fff}
    .dc-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;color:#6b7280;margin-top:3px;align-items:center}
    .fmt-badge{background:#1c1c1c;border:1px solid #333;color:#9ca3af;padding:1px 5px;border-radius:4px;font-size:10px}
    .resident-tag{color:#6366f1;font-size:11px}
    .expired{color:#ef4444!important}
    .upload-date{color:#4b5563}
    .dc-actions{display:flex;gap:6px;flex-shrink:0}
    .dl-btn{font-size:18px;text-decoration:none;padding:5px;border:1px solid #333;border-radius:6px;background:#1c1c1c}
    .del-btn{font-size:16px;background:none;border:1px solid #333;border-radius:6px;padding:5px;cursor:pointer;color:#6b7280}
    .del-btn:hover{border-color:#ef4444;color:#ef4444}

    /* NOC requests */
    .noc-req-card{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:9px}
    .nrc-header{display:flex;justify-content:space-between;gap:10px}
    .nrc-info{flex:1}
    .nrc-name{font-family:'Oswald',sans-serif;font-size:13px;color:#9ca3af;margin-bottom:2px}
    .nrc-purpose{font-family:'Oswald',sans-serif;font-size:15px;color:#fff;font-weight:700}
    .nrc-details{font-size:12px;color:#9ca3af;margin-top:3px}
    .nrc-date{font-size:11px;color:#4b5563;margin-top:3px}
    .nrc-status{font-size:10px;font-family:'Oswald',sans-serif;padding:4px 9px;border-radius:8px;font-weight:700;white-space:nowrap;height:fit-content}
    .nrc-status.pending{background:rgba(245,158,11,0.1);color:#f59e0b}
    .nrc-status.fulfilled{background:rgba(16,185,129,0.1);color:#10b981}
    .nrc-status.rejected{background:rgba(239,68,68,0.1);color:#ef4444}
    .nrc-actions{display:flex;flex-direction:column;gap:8px}
    .fulfil-btn{background:#6366f1;border:none;color:#fff;padding:9px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
    .reject-row{display:flex;gap:7px}
    .reject-input{flex:1;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:7px 9px;font-size:12px;outline:none}
    .reject-btn{background:none;border:1px solid #ef4444;color:#ef4444;padding:7px 12px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:11px;cursor:pointer;white-space:nowrap}
    .nrc-rejection{font-size:12px;color:#ef4444;font-style:italic}
    .ok{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:480px;background:rgba(16,185,129,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}
    .err{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:480px;background:rgba(239,68,68,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}
  `]
})
export class AdminVaultComponent implements OnInit {
  vault:    any    = null;
  loading         = false;
  tab             = 'UPLOAD';
  uploading       = false;
  uploadError     = '';
  okMsg = ''; errMsg = '';
  uploadFile: File | null = null;
  upload = { title: '', description: '', type: 'SOCIETY', residentEmail: '', nocRequestId: null as any, expiryDate: '' };
  rejectReasons: Record<number, string> = {};
  rejecting: Record<number, boolean> = {};
  pendingNocRequests: any[] = [];
  docTypes = Object.entries(DOC_TYPE_CONFIG).map(([key, v]) => ({ key, ...v }));

  constructor(public svc: VaultService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAdminVault().subscribe({
      next: r => {
        this.vault = r.data;
        this.pendingNocRequests = (r.data.nocRequests || []).filter((x: any) => x.status === 'PENDING');
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get currentDocs(): any[] {
    if (!this.vault) return [];
    if (this.tab === 'SOCIETY') return this.vault.society || [];
    if (this.tab === 'NOC')     return this.vault.nocs    || [];
    if (this.tab === 'MAINT')   return this.vault.maintenance || [];
    return [];
  }

  fmtIcon(fmt: string): string { return FORMAT_ICONS[fmt] || '📄'; }
  isExpired(date: string): boolean { return date ? new Date(date) < new Date() : false; }

  onFile(e: any) { this.uploadFile = e.target.files[0] || null; }

  flash(msg: string, ok = true) {
    if (ok) { this.okMsg = msg; setTimeout(() => this.okMsg = '', 3000); }
    else     { this.errMsg = msg; setTimeout(() => this.errMsg = '', 4000); }
  }

  doUpload() {
    if (!this.upload.title.trim() || !this.uploadFile) {
      this.uploadError = 'Title and file are required.'; return;
    }
    if (this.upload.type === 'NOC' && !this.upload.residentEmail.trim()) {
      this.uploadError = 'Resident email is required for NOC documents.'; return;
    }
    this.uploading = true; this.uploadError = '';
    const fd = new FormData();
    fd.append('title',       this.upload.title);
    fd.append('description', this.upload.description);
    fd.append('type',        this.upload.type);
    fd.append('file',        this.uploadFile);
    if (this.upload.residentEmail) fd.append('residentEmail', this.upload.residentEmail);
    if (this.upload.nocRequestId)  fd.append('nocRequestId',  this.upload.nocRequestId.toString());
    if (this.upload.expiryDate)    fd.append('expiryDate',    this.upload.expiryDate);

    this.svc.upload(fd).subscribe({
      next: () => {
        this.flash('Document uploaded!');
        this.upload = { title: '', description: '', type: 'SOCIETY', residentEmail: '', nocRequestId: null, expiryDate: '' };
        this.uploadFile = null;
        this.load();
        this.uploading = false;
      },
      error: e => { this.uploadError = e.error?.message || 'Upload failed.'; this.uploading = false; }
    });
  }

  deleteDoc(id: number) {
    if (!confirm('Remove this document from the vault?')) return;
    this.svc.deleteDoc(id).subscribe({
      next: () => { this.flash('Document removed.'); this.load(); },
      error: e => this.flash(e.error?.message, false)
    });
  }

  fulfilNoc(r: any) {
    // Pre-fill the upload form for this NOC request
    this.upload.type         = 'NOC';
    this.upload.residentEmail = r.resident?.email || '';
    this.upload.nocRequestId  = r.id;
    this.upload.title = `NOC — ${r.purpose}`;
    this.tab = 'UPLOAD';
    window.scrollTo(0, 0);
  }

  rejectNoc(id: number) {
    const reason = this.rejectReasons[id] || '';
    if (!reason.trim()) { this.flash('Please enter a rejection reason.', false); return; }
    this.rejecting[id] = true;
    this.svc.rejectNoc(id, reason).subscribe({
      next: () => { this.flash('Request rejected.'); this.load(); delete this.rejecting[id]; },
      error: e => { this.flash(e.error?.message, false); delete this.rejecting[id]; }
    });
  }
}

