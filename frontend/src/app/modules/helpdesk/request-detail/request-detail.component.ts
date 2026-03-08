import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HelpdeskService } from '../../../core/services/helpdesk.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../../../core/models/helpdesk.model';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="header" *ngIf="detail">
    <button class="back-btn" (click)="goBack()">←</button>
    <div class="header-main">
      <div class="req-cat">
        <span>{{ catCfg[detail.request.category]?.icon }}</span>
        <span class="cat-lbl" [style.color]="catCfg[detail.request.category]?.color">
          {{ catCfg[detail.request.category]?.label }}
        </span>
      </div>
      <div class="status-pill"
        [style.background]="stsCfg[detail.request.status]?.bg"
        [style.color]="stsCfg[detail.request.status]?.color">
        {{ stsCfg[detail.request.status]?.icon }} {{ stsCfg[detail.request.status]?.label }}
      </div>
    </div>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="body" *ngIf="detail">
    <div class="req-id">Request #{{ detail.request.id }}</div>
    <div class="req-title">{{ detail.request.title }}</div>
    <div class="req-desc" *ngIf="detail.request.description">{{ detail.request.description }}</div>

    <!-- Key info grid -->
    <div class="info-grid">
      <div class="info-item">
        <div class="il">Raised by</div>
        <div class="iv">{{ detail.request.resident?.firstName }} {{ detail.request.resident?.lastName }} · Flat {{ detail.request.resident?.flatNumber }}</div>
      </div>
      <div class="info-item">
        <div class="il">Raised on</div>
        <div class="iv">{{ detail.request.createdAt | date:'d MMM yyyy, h:mm a' }}</div>
      </div>
      <div class="info-item" *ngIf="detail.request.preferredDatetime">
        <div class="il">Preferred time</div>
        <div class="iv pref">{{ detail.request.preferredDatetime | date:'d MMM, h:mm a' }}</div>
      </div>
      <div class="info-item" *ngIf="detail.request.confirmedDatetime">
        <div class="il">Confirmed slot</div>
        <div class="iv confirmed">{{ detail.request.confirmedDatetime | date:'d MMM, h:mm a' }}</div>
      </div>
      <div class="info-item" *ngIf="detail.request.assignedStaffName">
        <div class="il">Assigned to</div>
        <div class="iv">{{ detail.request.assignedStaffName }}
          <span class="contact" *ngIf="detail.request.assignedStaffContact"> · {{ detail.request.assignedStaffContact }}</span>
        </div>
      </div>
      <div class="info-item" *ngIf="detail.request.fmNote">
        <div class="il">FM Note</div>
        <div class="iv note">{{ detail.request.fmNote }}</div>
      </div>
    </div>

    <!-- Photos -->
    <div class="photos-section" *ngIf="detail.photos?.length">
      <div class="section-label">PHOTOS</div>
      <div class="photo-row">
        <a *ngFor="let p of detail.photos" [href]="svc.photoUrl(p.photoPath)" target="_blank">
          <img [src]="svc.photoUrl(p.photoPath)" alt="photo" class="photo-thumb" />
        </a>
      </div>
    </div>

    <!-- Status timeline -->
    <div class="section-label">STATUS HISTORY</div>
    <div class="timeline">
      <div class="tl-item" *ngFor="let log of detail.statusLog; let last = last">
        <div class="tl-dot" [style.background]="stsCfg[log.toStatus]?.color"></div>
        <div class="tl-line" *ngIf="!last"></div>
        <div class="tl-content">
          <div class="tl-status" [style.color]="stsCfg[log.toStatus]?.color">
            {{ stsCfg[log.toStatus]?.icon }} {{ stsCfg[log.toStatus]?.label }}
          </div>
          <div class="tl-note" *ngIf="log.note">{{ log.note }}</div>
          <div class="tl-meta">{{ log.changedBy?.firstName }} {{ log.changedBy?.lastName }} · {{ log.changedAt | date:'d MMM, h:mm a' }}</div>
        </div>
      </div>
    </div>

    <!-- FM actions panel -->
    <div class="fm-panel" *ngIf="detail.canManage && isOpen">
      <div class="fp-title">FM ACTIONS</div>

      <!-- Assign (when PENDING) -->
      <div class="assign-form" *ngIf="detail.request.status === 'PENDING' || detail.request.status === 'ASSIGNED'">
        <div class="fp-subtitle">{{ detail.request.status === 'PENDING' ? 'Assign Staff' : 'Reassign / Update Slot' }}</div>
        <input [(ngModel)]="assign.staffName"     class="fm-input" placeholder="Staff name *" />
        <input [(ngModel)]="assign.staffContact"  class="fm-input" placeholder="Contact number" />
        <input type="datetime-local" [(ngModel)]="assign.confirmedDatetime" class="fm-input" />
        <textarea [(ngModel)]="assign.fmNote"     class="fm-input" rows="2" placeholder="Internal note (optional)"></textarea>
        <button class="fm-btn assign-btn" (click)="doAssign()" [disabled]="assigning">
          {{ assigning ? 'Saving…' : '👷 ' + (detail.request.status === 'PENDING' ? 'Assign & Confirm Slot' : 'Update Assignment') }}
        </button>
      </div>

      <!-- Status transitions -->
      <div class="status-actions">
        <div class="fp-subtitle">UPDATE STATUS</div>
        <div class="status-btn-row">
          <button class="sts-btn inprogress" *ngIf="detail.request.status === 'ASSIGNED'"
            (click)="changeStatus('IN_PROGRESS', 'Work started')">🔨 Start Work</button>
          <button class="sts-btn done" *ngIf="detail.request.status === 'IN_PROGRESS'"
            (click)="changeStatus('DONE', 'Work completed')">✅ Mark Done</button>
          <button class="sts-btn cancel" *ngIf="['PENDING','ASSIGNED','IN_PROGRESS'].includes(detail.request.status)"
            (click)="promptCancel()">🚫 Cancel Request</button>
        </div>
        <div class="note-row" *ngIf="showNoteInput">
          <textarea [(ngModel)]="statusNote" class="fm-input" rows="2" placeholder="Add a note (optional)"></textarea>
          <div class="note-actions">
            <button class="confirm-btn" (click)="confirmStatusChange()" [disabled]="updatingStatus">Confirm</button>
            <button class="discard-btn" (click)="showNoteInput = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resident: cancel button -->
    <div class="resident-actions" *ngIf="!detail.canManage && canCancel">
      <button class="cancel-btn" (click)="residentCancel()" [disabled]="cancelling">
        {{ cancelling ? 'Cancelling…' : '✕ Cancel This Request' }}
      </button>
    </div>
  </div>

  <div class="err" *ngIf="error">{{ error }}</div>
  <div class="ok"  *ngIf="okMsg">{{ okMsg }}</div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8;position:relative}
    .header{background:linear-gradient(180deg,#111,#161616);border-bottom:3px solid #3b82f6;padding:12px 14px;display:flex;align-items:center;gap:10px}
    .back-btn{background:none;border:1px solid #333;color:#9ca3af;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;flex-shrink:0}
    .header-main{flex:1;display:flex;justify-content:space-between;align-items:center}
    .req-cat{display:flex;align-items:center;gap:6px;font-size:18px}
    .cat-lbl{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700}
    .status-pill{font-size:10px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:14px;display:flex;flex-direction:column;gap:12px}
    .req-id{font-size:11px;color:#4b5563;font-family:'Oswald',sans-serif;letter-spacing:1px}
    .req-title{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.5px;line-height:1.2}
    .req-desc{font-size:13px;color:#9ca3af;line-height:1.6;background:#252525;border:1px solid #333;border-radius:8px;padding:10px 12px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .info-item{background:#252525;border:1px solid #333;border-radius:8px;padding:9px 11px}
    .il{font-size:10px;color:#6b7280;font-family:'Oswald',sans-serif;letter-spacing:0.5px;margin-bottom:2px}
    .iv{font-size:12px;color:#e8e8e8}.iv.pref{color:#f59e0b}.iv.confirmed{color:#10b981}
    .iv.note{color:#9ca3af;font-style:italic}.contact{color:#6b7280}
    .section-label{font-family:'Oswald',sans-serif;font-size:10px;color:#3b82f6;letter-spacing:2px;border-bottom:1px solid #2a2a2a;padding-bottom:4px}
    .photos-section{display:flex;flex-direction:column;gap:8px}
    .photo-row{display:flex;gap:8px;flex-wrap:wrap}
    .photo-thumb{width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #333}

    /* Timeline */
    .timeline{display:flex;flex-direction:column;padding-left:4px}
    .tl-item{display:flex;gap:12px;position:relative}
    .tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px}
    .tl-line{position:absolute;left:4px;top:14px;bottom:-12px;width:2px;background:#2a2a2a}
    .tl-content{flex:1;padding-bottom:14px}
    .tl-status{font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px}
    .tl-note{font-size:12px;color:#9ca3af;margin-top:2px}
    .tl-meta{font-size:11px;color:#4b5563;margin-top:2px}

    /* FM panel */
    .fm-panel{background:#1a1a2e;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px}
    .fp-title{font-family:'Oswald',sans-serif;font-size:10px;color:#6366f1;letter-spacing:2px}
    .fp-subtitle{font-size:11px;color:#6b7280;font-family:'Oswald',sans-serif;letter-spacing:0.5px;margin-bottom:4px}
    .assign-form{display:flex;flex-direction:column;gap:7px}
    .fm-input{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px 10px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box;resize:vertical}
    .fm-input:focus{border-color:#6366f1}
    .fm-btn{background:#6366f1;border:none;color:#fff;padding:10px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:0.5px}
    .fm-btn:disabled{opacity:0.4}
    .status-actions{display:flex;flex-direction:column;gap:8px}
    .status-btn-row{display:flex;gap:8px;flex-wrap:wrap}
    .sts-btn{border:none;padding:9px 14px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.5px}
    .sts-btn.inprogress{background:#6366f1;color:#fff}
    .sts-btn.done{background:#10b981;color:#111}
    .sts-btn.cancel{background:none;border:1px solid #ef4444;color:#ef4444}
    .note-row{display:flex;flex-direction:column;gap:6px}
    .note-actions{display:flex;gap:8px}
    .confirm-btn{background:#10b981;border:none;color:#111;padding:8px 14px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
    .discard-btn{background:none;border:1px solid #333;color:#6b7280;padding:8px 12px;border-radius:6px;font-size:12px;cursor:pointer}
    .resident-actions{padding-top:4px}
    .cancel-btn{width:100%;background:none;border:1px solid #ef4444;color:#ef4444;padding:11px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
    .cancel-btn:disabled{opacity:0.4}
    .err{position:fixed;bottom:80px;left:14px;right:14px;background:rgba(239,68,68,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}
    .ok {position:fixed;bottom:80px;left:14px;right:14px;background:rgba(16,185,129,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}
  `]
})
export class RequestDetailComponent implements OnInit {
  detail: any   = null;
  loading       = true;
  assigning     = false;
  updatingStatus= false;
  cancelling    = false;
  error = ''; okMsg = '';

  assign = { staffName: '', staffContact: '', confirmedDatetime: '', fmNote: '' };
  statusNote    = '';
  pendingStatus = '';
  showNoteInput = false;

  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stsCfg = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    public  svc: HelpdeskService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number) {
    this.loading = true;
    this.svc.getDetail(id).subscribe({
      next: r => {
        this.detail = r.data;
        if (this.detail.request.assignedStaffName) {
          this.assign.staffName    = this.detail.request.assignedStaffName;
          this.assign.staffContact = this.detail.request.assignedStaffContact || '';
          this.assign.confirmedDatetime = this.detail.request.confirmedDatetime
            ? this.detail.request.confirmedDatetime.substring(0,16) : '';
          this.assign.fmNote = this.detail.request.fmNote || '';
        }
        this.loading = false;
      },
      error: e => { this.loading = false; console.error('Detail load error', e.status, e.error); this.flash('[' + e.status + '] ' + (e.error?.message || e.error?.error || 'Failed to load request'), false); }
    });
  }

  get id() { return this.detail?.request?.id; }
  get isOpen() { return !['DONE','CANCELLED'].includes(this.detail?.request?.status); }
  get canCancel() { return ['PENDING','ASSIGNED'].includes(this.detail?.request?.status); }

  goBack() {
    if (this.detail?.canManage) this.router.navigate(['/helpdesk/fm']);
    else this.router.navigate(['/helpdesk']);
  }

  flash(msg: string, ok = true) {
    if (ok) { this.okMsg = msg; setTimeout(() => this.okMsg = '', 3000); }
    else     { this.error = msg; setTimeout(() => this.error = '', 4000); }
  }

  doAssign() {
    if (!this.assign.staffName.trim()) { this.flash('Staff name is required', false); return; }
    this.assigning = true;
    this.svc.assign(this.id, this.assign).subscribe({
      next: () => { this.flash('Assignment saved!'); this.load(this.id); this.assigning = false; },
      error: e => { this.flash(e.error?.message || 'Failed', false); this.assigning = false; }
    });
  }

  changeStatus(status: string, defaultNote: string) {
    this.pendingStatus = status;
    this.statusNote    = defaultNote;
    this.showNoteInput = true;
  }

  promptCancel() { this.changeStatus('CANCELLED', 'Cancelled by FM'); }

  confirmStatusChange() {
    this.updatingStatus = true;
    this.svc.updateStatus(this.id, { status: this.pendingStatus, note: this.statusNote }).subscribe({
      next: () => {
        this.flash('Status updated!');
        this.showNoteInput = false;
        this.load(this.id);
        this.updatingStatus = false;
      },
      error: e => { this.flash(e.error?.message || 'Failed', false); this.updatingStatus = false; }
    });
  }

  residentCancel() {
    if (!confirm('Cancel this service request?')) return;
    this.cancelling = true;
    this.svc.cancel(this.id).subscribe({
      next: () => { this.flash('Request cancelled.'); this.load(this.id); this.cancelling = false; },
      error: e => { this.flash(e.error?.message, false); this.cancelling = false; }
    });
  }
}
