import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '@services/event.service';
import { AuthService } from '@services/auth.service';
import { EVENT_STATUS_CONFIG } from '@models/event.model';

declare const Razorpay: any;

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./event-detail.component.html",
  styleUrls: ["./event-detail.component.scss"]
})
export class EventDetailComponent implements OnInit {
  detail:   any    = null;
  photos:   any[]  = [];
  loading         = true;
  photosLoading   = false;
  voting          = false;
  contributing    = false;
  loggingInKind   = false;
  loggingExp      = false;
  uploadingPhoto  = false;
  votingSurplus   = false;
  editingRec      = false;

  tab = 'INFO';
  error = '';
  okMsg = '';

  contribAmount = '';
  inkind  = { itemName: '', description: '', quantity: 1, estimatedValue: '' };
  exp     = { description: '', amount: '', category: 'Other' };
  receiptFile:  File | null = null;
  photoFile:    File | null = null;
  photoCaption = '';
  recognitionRaw = '';

  canCreate    = false;
  canVolunteer = false;
  canContribute= false;
  canExpense   = false;
  canPhoto     = false;

  Math = Math;
  statusCfg = EVENT_STATUS_CONFIG as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    public  svc: EventService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.canCreate    = this.auth.can('EVENT_CREATE');
    this.canVolunteer = this.auth.can('EVENT_VOLUNTEER');
    this.canContribute= this.auth.can('EVENT_CONTRIBUTE');
    this.canExpense   = this.auth.can('EVENT_EXPENSE');
    this.canPhoto     = this.auth.can('EVENT_PHOTO');

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDetail(id);
  }

  loadDetail(id: number) {
    this.loading = true;
    this.svc.getEventDetail(id).subscribe({
      next: r => { this.detail = r.data; this.loading = false; this.parseRecognition(); },
      error: e => { this.loading = false; this.flash(e.error?.message || 'Failed to load event details', false); }
    });
  }

  get id() { return this.detail?.event?.id; }
  get isVoting()   { return this.detail?.event?.status === 'VOTING'; }
  get isEventOpen(){ return ['APPROVED','ACTIVE'].includes(this.detail?.event?.status); }
  get fundPct()    { return this.detail ? Math.min(200, Math.round((this.detail.raised / this.detail.event.estimatedBudget) * 100)) : 0; }
  get quorumPct()  { return this.detail && this.detail.totalVotes > 0
    ? Math.round(this.detail.totalVotes * 100 / Math.max(1, this.detail.totalVotes)) : 0; }

  recognition: any[] = [];
  parseRecognition() {
    try { this.recognition = this.detail?.event?.recognitionJson ? JSON.parse(this.detail.event.recognitionJson) : []; }
    catch { this.recognition = []; }
  }

  flash(msg: string, ok = true) {
    if (ok) { this.okMsg = msg; setTimeout(() => this.okMsg = '', 3000); }
    else     { this.error = msg; setTimeout(() => this.error = '', 4000); }
  }

  // Organiser actions
  openVoting() { this.svc.openVoting(this.id).subscribe({ next: () => this.loadDetail(this.id), error: e => this.flash(e.error?.message, false) }); }
  activate()   { this.svc.activateEvent(this.id).subscribe({ next: () => this.loadDetail(this.id), error: e => this.flash(e.error?.message, false) }); }
  complete()   { this.svc.completeEvent(this.id).subscribe({ next: () => { this.loadDetail(this.id); this.tab = 'SETTLE'; }, error: e => this.flash(e.error?.message, false) }); }
  cancel()     { if (!confirm('Cancel this event?')) return; this.svc.cancelEvent(this.id).subscribe({ next: () => this.loadDetail(this.id), error: e => this.flash(e.error?.message, false) }); }

  vote(choice: string) {
    this.voting = true;
    this.svc.castVote(this.id, choice).subscribe({
      next: () => { this.flash('Vote cast!'); this.loadDetail(this.id); this.voting = false; },
      error: e => { this.flash(e.error?.message || 'Vote failed', false); this.voting = false; }
    });
  }

  signup(slotId: number) {
    this.svc.signUp(slotId).subscribe({
      next: () => { this.flash('Signed up!'); this.loadDetail(this.id); },
      error: e => this.flash(e.error?.message, false)
    });
  }

  withdrawSignup(slotId: number) {
    this.svc.withdraw(slotId).subscribe({
      next: () => { this.flash('Withdrawn.'); this.loadDetail(this.id); },
      error: e => this.flash(e.error?.message, false)
    });
  }

  contribute() {
    if (!this.contribAmount || +this.contribAmount <= 0) { this.flash('Enter a valid amount', false); return; }
    if (typeof Razorpay === 'undefined') { this.flash('Payment gateway not loaded', false); return; }
    this.contributing = true;
    this.svc.createContributionOrder(this.id, +this.contribAmount).subscribe({
      next: r => {
        const o = r.data;
        const rzp = new Razorpay({
          key: o.keyId, amount: o.amount, currency: o.currency,
          name: o.eventName, description: 'Event Contribution',
          order_id: o.orderId, theme: { color: '#f59e0b' },
          handler: () => { this.flash('Contribution recorded! Thank you 🙏'); this.contribAmount = ''; this.loadDetail(this.id); },
          modal: { ondismiss: () => {} }
        });
        rzp.open();
        this.contributing = false;
      },
      error: e => { this.flash(e.error?.message || 'Failed', false); this.contributing = false; }
    });
  }

  logInKind() {
    if (!this.inkind.itemName) { this.flash('Enter item name', false); return; }
    this.loggingInKind = true;
    this.svc.logInKind(this.id, this.inkind).subscribe({
      next: () => { this.flash('In-kind contribution logged!'); this.inkind = { itemName: '', description: '', quantity: 1, estimatedValue: '' }; this.loadDetail(this.id); this.loggingInKind = false; },
      error: e => { this.flash(e.error?.message, false); this.loggingInKind = false; }
    });
  }

  onReceipt(e: any) { this.receiptFile = e.target.files[0] || null; }
  onPhoto(e: any)   { this.photoFile   = e.target.files[0] || null; }

  logExpense() {
    if (!this.exp.description || !this.exp.amount) { this.flash('Fill description and amount', false); return; }
    this.loggingExp = true;
    const fd = new FormData();
    fd.append('description', this.exp.description);
    fd.append('amount', this.exp.amount);
    fd.append('category', this.exp.category);
    if (this.receiptFile) fd.append('receipt', this.receiptFile);
    this.svc.logExpense(this.id, fd).subscribe({
      next: () => { this.flash('Expense logged!'); this.exp = { description: '', amount: '', category: 'Other' }; this.receiptFile = null; this.loadDetail(this.id); this.loggingExp = false; },
      error: e => { this.flash(e.error?.message, false); this.loggingExp = false; }
    });
  }

  loadPhotos() {
    this.photosLoading = true;
    this.svc.getPhotos(this.id).subscribe({
      next: r => { this.photos = r.data; this.photosLoading = false; },
      error: () => this.photosLoading = false
    });
  }

  uploadPhoto() {
    if (!this.photoFile) { this.flash('Choose a photo first', false); return; }
    this.uploadingPhoto = true;
    const fd = new FormData();
    fd.append('photo', this.photoFile);
    if (this.photoCaption) fd.append('caption', this.photoCaption);
    this.svc.uploadPhoto(this.id, fd).subscribe({
      next: () => { this.flash('Photo uploaded!'); this.photoFile = null; this.photoCaption = ''; this.loadPhotos(); this.uploadingPhoto = false; },
      error: e => { this.flash(e.error?.message, false); this.uploadingPhoto = false; }
    });
  }

  surplusVote(choice: string) {
    this.votingSurplus = true;
    this.svc.castSurplusVote(this.id, choice).subscribe({
      next: () => { this.flash('Surplus vote cast!'); this.loadDetail(this.id); this.votingSurplus = false; },
      error: e => { this.flash(e.error?.message, false); this.votingSurplus = false; }
    });
  }

  startEditRec() {
    this.recognitionRaw = this.detail?.event?.recognitionJson || '[]';
    this.editingRec = true;
  }

  saveRecognition() {
    this.svc.saveRecognition(this.id, this.recognitionRaw).subscribe({
      next: () => { this.flash('Recognition saved!'); this.editingRec = false; this.loadDetail(this.id); },
      error: e => this.flash(e.error?.message, false)
    });
  }
}
