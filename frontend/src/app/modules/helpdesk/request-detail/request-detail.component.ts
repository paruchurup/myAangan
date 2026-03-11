import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./request-detail.component.html",
  styleUrls: ["./request-detail.component.scss"]
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
    // if (this.detail?.canManage) this.router.navigate(['/helpdesk/fm']);
    // else this.router.navigate(['/helpdesk']);
    this.router.navigate(['/helpdesk']);
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
