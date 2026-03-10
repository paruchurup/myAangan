import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VaultService } from '@services/vault.service';
import { DOC_TYPE_CONFIG, FORMAT_ICONS } from '@models/vault.model';

@Component({
  selector: 'app-admin-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./admin-vault.component.html",
  styleUrls: ["./admin-vault.component.scss"]
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

