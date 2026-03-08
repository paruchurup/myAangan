import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../core/services/vehicle.service';
import { VisitorPass, PASS_STATUS_CONFIG, DAY_NAMES } from '../../core/models/vehicle.model';

// QR code library loaded from CDN via script tag in index.html
declare const QRCode: any;

@Component({
  selector: 'app-my-passes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">

  <div class="header">
    <div>
      <div class="eyebrow">VISITOR PRE-APPROVAL</div>
      <h1>🎫 My Passes</h1>
    </div>
    <button class="add-btn" (click)="toggleForm()">
      {{ showForm ? '✕ Cancel' : '+ New Pass' }}
    </button>
  </div>

  <!-- ── CREATE FORM ──────────────────────────────────────────────────── -->
  <div class="form-card" *ngIf="showForm">
    <div class="form-title">New Visitor Pass</div>

    <!-- Pass type toggle -->
    <div class="type-toggle">
      <button [class.active]="form.passType==='ONE_TIME'"  (click)="form.passType='ONE_TIME'">📅 One-Time Visit</button>
      <button [class.active]="form.passType==='STANDING'"  (click)="form.passType='STANDING'">🔄 Standing Pass</button>
    </div>

    <div class="fg2">
      <div class="field"><label>Visitor Name *</label>
        <input [(ngModel)]="form.visitorName" placeholder="Ravi Kumar" /></div>
      <div class="field"><label>Phone</label>
        <input [(ngModel)]="form.visitorPhone" placeholder="+91 99999 00000" type="tel" /></div>
    </div>

    <div class="field"><label>Purpose</label>
      <div class="purpose-chips">
        <button *ngFor="let p of purposes" class="chip"
          [class.active]="form.purpose===p" (click)="form.purpose=p">{{ p }}</button>
      </div>
      <input [(ngModel)]="form.purpose" placeholder="Or type custom purpose…" style="margin-top:6px" />
    </div>

    <!-- ONE_TIME fields -->
    <ng-container *ngIf="form.passType==='ONE_TIME'">
      <div class="field"><label>Visit Date *</label>
        <input type="date" [(ngModel)]="form.validDate" [min]="today" /></div>
      <div class="fg2">
        <div class="field"><label>Entry Window — From</label>
          <input type="time" [(ngModel)]="form.windowStart" /></div>
        <div class="field"><label>Entry Window — To</label>
          <input type="time" [(ngModel)]="form.windowEnd" /></div>
      </div>
    </ng-container>

    <!-- STANDING fields -->
    <ng-container *ngIf="form.passType==='STANDING'">
      <div class="field"><label>Allowed Days *</label>
        <div class="day-grid">
          <button *ngFor="let d of dayOptions" class="day-btn"
            [class.active]="isDaySelected(d.num)"
            (click)="toggleDay(d.num)">{{ d.label }}</button>
        </div>
      </div>
      <div class="fg2">
        <div class="field"><label>Valid From *</label>
          <input type="date" [(ngModel)]="form.standingFrom" [min]="today" /></div>
        <div class="field"><label>Valid Until (leave blank = indefinite)</label>
          <input type="date" [(ngModel)]="form.standingUntil" [min]="form.standingFrom || today" /></div>
      </div>
      <div class="fg2">
        <div class="field"><label>Daily Entry From</label>
          <input type="time" [(ngModel)]="form.windowStart" /></div>
        <div class="field"><label>Daily Entry Until</label>
          <input type="time" [(ngModel)]="form.windowEnd" /></div>
      </div>
    </ng-container>

    <div class="field"><label>Notes for Guard</label>
      <textarea [(ngModel)]="form.notes" rows="2" placeholder="e.g. Will arrive by car, wearing blue jacket…"></textarea>
    </div>

    <div class="err" *ngIf="formError">{{ formError }}</div>
    <button class="submit-btn" (click)="createPass()" [disabled]="creating">
      {{ creating ? 'Generating…' : '🎫 Generate Pass' }}
    </button>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading && !passes.length && !showForm">
    <div>🎫</div><p>No visitor passes yet</p>
    <small>Create a pass to pre-approve visitors at the gate</small>
  </div>

  <!-- ── PASS CARDS ───────────────────────────────────────────────────── -->
  <div *ngFor="let pass of passes" class="pass-card" [class]="'s-' + pass.status.toLowerCase()">

    <!-- Status stripe -->
    <div class="stripe" [class]="'stripe-' + pass.status.toLowerCase()"></div>

    <div class="pass-body">

      <!-- Top row -->
      <div class="pass-top">
        <div class="visitor-name">{{ pass.visitorName }}</div>
        <div class="status-pill" [style.background]="statusCfg[pass.status]?.bg"
             [style.color]="statusCfg[pass.status]?.color">
          {{ statusCfg[pass.status]?.icon }} {{ statusCfg[pass.status]?.label }}
        </div>
      </div>

      <div class="pass-purpose" *ngIf="pass.purpose">{{ pass.purpose }}</div>
      <div class="pass-phone" *ngIf="pass.visitorPhone">📱 {{ pass.visitorPhone }}</div>

      <!-- Validity badge -->
      <div class="validity">
        <span *ngIf="pass.passType==='ONE_TIME'">
          📅 {{ pass.validDate | date:'EEE, d MMM yyyy' }}
          <span *ngIf="pass.windowStart"> · {{ pass.windowStart }} – {{ pass.windowEnd }}</span>
        </span>
        <span *ngIf="pass.passType==='STANDING'">
          🔄 {{ formatDays(pass.allowedDays) }}
          <span *ngIf="pass.windowStart"> · {{ pass.windowStart }} – {{ pass.windowEnd }}</span>
          <span *ngIf="pass.standingUntil"> · Until {{ pass.standingUntil | date:'d MMM' }}</span>
          <span *ngIf="!pass.standingUntil"> · No expiry</span>
        </span>
      </div>

      <div class="pass-notes" *ngIf="pass.notes">💬 {{ pass.notes }}</div>

      <!-- QR + code (active passes only) -->
      <div class="pass-qr-section" *ngIf="pass.status==='ACTIVE'">
        <div class="qr-wrap">
          <div [id]="'qr-' + pass.id" class="qr-canvas"></div>
        </div>
        <div class="pass-code-block">
          <div class="code-label">Pass Code</div>
          <div class="pass-code">{{ formatCode(pass.token) }}</div>
          <div class="code-hint">Show this to the guard</div>
        </div>
      </div>

      <!-- Log: last check-in -->
      <div class="last-checkin" *ngIf="pass.logs?.length">
        ✅ Last entry: {{ pass.logs[0].checkedInAt | date:'d MMM, h:mm a' }}
        <span *ngIf="pass.logs[0].checkInStatus==='OVERRIDE'" class="override-tag">OVERRIDE</span>
      </div>

      <!-- Actions -->
      <div class="pass-actions" *ngIf="pass.status==='ACTIVE'">
        <button class="action-cancel" (click)="cancelPass(pass)"
          [disabled]="cancellingId===pass.id">
          {{ cancellingId===pass.id ? 'Cancelling…' : '✕ Cancel Pass' }}
        </button>
      </div>
    </div>
  </div>

</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}
    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #a78bfa;padding:18px 16px 14px;display:flex;justify-content:space-between;align-items:flex-start}
    .eyebrow{font-size:10px;color:#a78bfa;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;margin:0;letter-spacing:1px}
    .add-btn{background:#a78bfa;border:none;color:#111;padding:8px 14px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}

    /* Form */
    .form-card{background:#252525;border:1px solid #333;border-radius:12px;margin:12px 14px;padding:16px;display:flex;flex-direction:column;gap:12px}
    .form-title{font-family:'Oswald',sans-serif;font-size:13px;color:#a78bfa;letter-spacing:2px;text-transform:uppercase}
    .type-toggle{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .type-toggle button{background:#1c1c1c;border:1.5px solid #333;border-radius:8px;color:#9ca3af;padding:10px;font-size:13px;cursor:pointer;transition:all 0.15s}
    .type-toggle button.active{background:rgba(167,139,250,0.1);border-color:#a78bfa;color:#a78bfa}
    .fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .field{display:flex;flex-direction:column;gap:4px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif}
    input,select,textarea{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:9px 11px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box}
    input:focus,textarea:focus{border-color:#a78bfa}
    .purpose-chips{display:flex;flex-wrap:wrap;gap:6px}
    .chip{background:#1c1c1c;border:1px solid #333;border-radius:20px;color:#9ca3af;padding:4px 10px;font-size:11px;cursor:pointer}
    .chip.active{background:rgba(167,139,250,0.12);border-color:#a78bfa;color:#a78bfa}
    .day-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
    .day-btn{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#6b7280;padding:7px 0;font-size:11px;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:0.5px}
    .day-btn.active{background:rgba(167,139,250,0.1);border-color:#a78bfa;color:#a78bfa}
    textarea{resize:vertical;min-height:56px}
    .err{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:9px;border-radius:6px;font-size:12px}
    .submit-btn{background:#a78bfa;border:none;color:#111;padding:12px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer}
    .submit-btn:disabled{opacity:0.4}

    /* Cards */
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:28px;height:28px;border:3px solid #333;border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:42px}.empty p{font-family:'Oswald',sans-serif;font-size:18px}.empty small{font-size:12px}

    .pass-card{background:#252525;border:1px solid #333;border-radius:12px;margin:10px 14px;display:flex;overflow:hidden;animation:fadeIn 0.2s ease-out}
    @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .pass-card.s-used,.pass-card.s-expired,.pass-card.s-cancelled{opacity:0.65}
    .stripe{width:5px;flex-shrink:0}
    .stripe-active{background:#a78bfa}.stripe-used{background:#6b7280}.stripe-expired{background:#ef4444}.stripe-cancelled{background:#374151}
    .pass-body{flex:1;padding:12px 14px;display:flex;flex-direction:column;gap:7px}
    .pass-top{display:flex;justify-content:space-between;align-items:center}
    .visitor-name{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#fff;letter-spacing:0.5px}
    .status-pill{font-size:11px;font-family:'Oswald',sans-serif;padding:3px 9px;border-radius:10px;font-weight:700}
    .pass-purpose{font-size:12px;color:#9ca3af}
    .pass-phone{font-size:12px;color:#9ca3af}
    .validity{font-size:12px;color:#c4b5fd;font-weight:500}
    .pass-notes{font-size:12px;color:#6b7280;font-style:italic}

    /* QR section */
    .pass-qr-section{display:flex;align-items:center;gap:16px;background:#1c1c1c;border:1px solid #333;border-radius:10px;padding:12px;margin-top:4px}
    .qr-wrap{background:#fff;padding:6px;border-radius:6px;flex-shrink:0}
    .qr-canvas canvas{display:block}
    .pass-code-block{display:flex;flex-direction:column;gap:4px}
    .code-label{font-size:10px;color:#6b7280;letter-spacing:2px;font-family:'Oswald',sans-serif}
    .pass-code{font-family:'IBM Plex Mono',monospace;font-size:26px;font-weight:700;color:#a78bfa;letter-spacing:6px}
    .code-hint{font-size:11px;color:#4b5563}

    .last-checkin{font-size:12px;color:#10b981}
    .override-tag{background:rgba(245,158,11,0.15);color:#f59e0b;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:4px;font-family:'Oswald',sans-serif}
    .pass-actions{display:flex;gap:8px;margin-top:2px}
    .action-cancel{background:none;border:1px solid #333;color:#6b7280;padding:6px 12px;border-radius:6px;font-size:11px;cursor:pointer}
    .action-cancel:hover{border-color:#ef4444;color:#f87171}
    .action-cancel:disabled{opacity:0.4}
  `]
})
export class MyPassesComponent implements OnInit {
  passes: VisitorPass[] = [];
  loading = true;

  showForm  = false;
  creating  = false;
  formError = '';
  cancellingId: number | null = null;

  today = new Date().toISOString().split('T')[0];

  form: any = {
    passType: 'ONE_TIME',
    visitorName: '', visitorPhone: '', purpose: '',
    validDate: '', windowStart: '', windowEnd: '',
    allowedDays: [] as number[],
    standingFrom: this.today, standingUntil: '',
    notes: ''
  };

  purposes = ['Guest', 'House Help', 'Plumber', 'Electrician', 'Delivery Agent', 'Relative'];
  dayOptions = [
    { num: 1, label: 'Mon' }, { num: 2, label: 'Tue' }, { num: 3, label: 'Wed' },
    { num: 4, label: 'Thu' }, { num: 5, label: 'Fri' }, { num: 6, label: 'Sat' },
    { num: 7, label: 'Sun' }
  ];

  statusCfg = PASS_STATUS_CONFIG;
  dayNames  = DAY_NAMES;

  constructor(private svc: VehicleService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getMyPasses().subscribe({
      next: r => {
        this.passes = r.data;
        this.loading = false;
        setTimeout(() => this.renderQRCodes(), 100);
      },
      error: () => this.loading = false
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.formError = '';
    if (!this.showForm) this.resetForm();
  }

  isDaySelected(n: number) { return (this.form.allowedDays as number[]).includes(n); }
  toggleDay(n: number) {
    const days = this.form.allowedDays as number[];
    const idx = days.indexOf(n);
    idx === -1 ? days.push(n) : days.splice(idx, 1);
  }

  createPass() {
    if (!this.form.visitorName.trim()) { this.formError = 'Visitor name is required.'; return; }
    if (this.form.passType === 'ONE_TIME' && !this.form.validDate) { this.formError = 'Visit date is required.'; return; }
    if (this.form.passType === 'STANDING' && !this.form.allowedDays.length) { this.formError = 'Select at least one allowed day.'; return; }

    this.creating = true; this.formError = '';
    const body = {
      ...this.form,
      validDate:     this.form.validDate     || null,
      windowStart:   this.form.windowStart   || null,
      windowEnd:     this.form.windowEnd     || null,
      standingFrom:  this.form.standingFrom  || null,
      standingUntil: this.form.standingUntil || null,
      allowedDays:   this.form.allowedDays.length ? [...this.form.allowedDays].sort() : null,
    };

    this.svc.createPass(body).subscribe({
      next: r => {
        this.passes.unshift(r.data);
        this.showForm = false;
        this.resetForm();
        this.creating = false;
        setTimeout(() => this.renderQRCodes(), 150);
      },
      error: e => { this.formError = e.error?.message || 'Failed to create pass.'; this.creating = false; }
    });
  }

  cancelPass(pass: VisitorPass) {
    this.cancellingId = pass.id;
    this.svc.cancelPass(pass.id).subscribe({
      next: r => {
        const idx = this.passes.findIndex(p => p.id === pass.id);
        if (idx > -1) this.passes[idx] = r.data;
        this.cancellingId = null;
      },
      error: () => this.cancellingId = null
    });
  }

  formatCode(token: string) {
    // Display as "XKYM  92PQ" — split into two groups of 4 with space
    return token.substring(0, 4) + '  ' + token.substring(4);
  }

  formatDays(allowedDays: string): string {
    if (!allowedDays) return '';
    return allowedDays.split(',')
      .map(d => DAY_NAMES[+d] || d)
      .join(', ');
  }

  private renderQRCodes() {
    if (typeof QRCode === 'undefined') return;
    this.passes
      .filter(p => p.status === 'ACTIVE')
      .forEach(p => {
        const el = document.getElementById('qr-' + p.id);
        if (el && !el.querySelector('canvas')) {
          el.innerHTML = '';
          new QRCode(el, {
            text: p.token,
            width: 96, height: 96,
            colorDark: '#1a1a2e',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      });
  }

  private resetForm() {
    this.form = {
      passType: 'ONE_TIME',
      visitorName: '', visitorPhone: '', purpose: '',
      validDate: '', windowStart: '', windowEnd: '',
      allowedDays: [],
      standingFrom: this.today, standingUntil: '',
      notes: ''
    };
  }
}
