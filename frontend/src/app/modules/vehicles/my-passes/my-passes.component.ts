import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '@services/vehicle.service';
import { VisitorPass, PASS_STATUS_CONFIG, DAY_NAMES } from '@models/vehicle.model';

// QR code library loaded from CDN via script tag in index.html
declare const QRCode: any;

@Component({
  selector: 'app-my-passes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./my-passes.component.html",
  styleUrls: ["./my-passes.component.scss"]
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
