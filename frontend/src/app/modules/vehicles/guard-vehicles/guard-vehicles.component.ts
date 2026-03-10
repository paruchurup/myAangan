import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '@services/vehicle.service';
import { Vehicle, VisitorVehicle, VIOLATION_TYPE_CONFIG, ParkingViolation, PassValidationResult, DAY_NAMES } from '@models/vehicle.model';

@Component({
  selector: 'app-guard-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./guard-vehicles.component.html",
  styleUrls: ["./guard-vehicles.component.scss"]
})
export class GuardVehiclesComponent implements OnInit {
  tab = 'LOOKUP';
  lookupPlate = '';
  lookupResults: Vehicle[] = [];
  lookupLoading = false;
  allApproved: Vehicle[] = [];

  currentVisitors: VisitorVehicle[] = [];
  visitorsLoading = false;

  visitorForm = { plateNumber: '', vehicleDescription: '', visitorName: '', visitorPhone: '', hostFlat: '', notes: '' };
  visitorSubmitting = false;
  visitorError = '';
  visitorSuccess = false;

  violForm = { plateNumber: '', violationType: '', description: '' };
  violPhoto: File | null = null;
  violSubmitting = false;
  violError = '';
  violSuccess = false;
  lastViolation: ParkingViolation | null = null;

  violationTypes = Object.entries(VIOLATION_TYPE_CONFIG).map(([value, cfg]) => ({ value, ...cfg }));

  constructor(private svc: VehicleService) {}

  ngOnInit() {
    // Pre-load approved vehicles for instant search
    this.svc.getApprovedForGuard().subscribe(r => this.allApproved = r.data);
    this.loadVisitors();
  }

  onSearch() {
    const q = this.lookupPlate.trim().toUpperCase();
    if (q.length < 3) { this.lookupResults = []; return; }
    this.lookupResults = this.allApproved.filter(v => v.plateNumber.includes(q));
  }

  loadVisitors() {
    this.visitorsLoading = true;
    this.svc.getCurrentVisitors().subscribe({
      next: r => { this.currentVisitors = r.data; this.visitorsLoading = false; },
      error: () => this.visitorsLoading = false
    });
  }

  logEntry() {
    const f = this.visitorForm;
    if (!f.plateNumber || !f.visitorName || !f.visitorPhone || !f.hostFlat) {
      this.visitorError = 'Plate, visitor name, phone, and host flat are required.';
      return;
    }
    this.visitorSubmitting = true; this.visitorError = '';
    const body = { ...f, plateNumber: f.plateNumber.toUpperCase() };
    this.svc.logVisitorEntry(body).subscribe({
      next: r => {
        this.currentVisitors.unshift(r.data);
        this.visitorForm = { plateNumber: '', vehicleDescription: '', visitorName: '', visitorPhone: '', hostFlat: '', notes: '' };
        this.visitorSuccess = true;
        this.visitorSubmitting = false;
        setTimeout(() => this.visitorSuccess = false, 3000);
      },
      error: e => { this.visitorError = e.error?.message || 'Failed to log entry.'; this.visitorSubmitting = false; }
    });
  }

  logExit(vv: VisitorVehicle) {
    this.svc.logVisitorExit(vv.id).subscribe(() => {
      this.currentVisitors = this.currentVisitors.filter(x => x.id !== vv.id);
    });
  }

  onViolPhoto(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.violPhoto = f;
  }

  submitViolation() {
    if (!this.violForm.plateNumber || !this.violForm.violationType || !this.violForm.description) {
      this.violError = 'Plate number, violation type, and description are required.';
      return;
    }
    this.violSubmitting = true; this.violError = '';

    const data = { ...this.violForm, plateNumber: this.violForm.plateNumber.toUpperCase() };
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (this.violPhoto) fd.append('photo', this.violPhoto);

    this.svc.reportViolation(fd).subscribe({
      next: r => {
        this.lastViolation = r.data;
        this.violForm = { plateNumber: '', violationType: '', description: '' };
        this.violPhoto = null;
        this.violSuccess = true;
        this.violSubmitting = false;
        setTimeout(() => this.violSuccess = false, 4000);
      },
      error: e => { this.violError = e.error?.message || 'Failed to report.'; this.violSubmitting = false; }
    });
  }

  // ── Pass scan ─────────────────────────────────────────────────────────
  passToken    = '';
  passLooking  = false;
  passInputErr = '';
  passResult: PassValidationResult | null = null;
  overrideReason = '';
  checkingIn   = false;
  checkInDone  = false;
  cameraActive = false;
  private stream: MediaStream | null = null;
  private scanInterval: any = null;

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  resetPassScan() {
    this.passToken = ''; this.passLooking = false; this.passInputErr = '';
    this.passResult = null; this.overrideReason = ''; this.checkingIn = false;
    this.checkInDone = false; this.stopCamera();
  }

  onPassTokenInput(e: Event) {
    this.passToken = (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  validatePass() {
    if (!this.passToken.trim()) return;
    this.passLooking = true; this.passInputErr = '';
    this.svc.validateToken(this.passToken.toUpperCase()).subscribe({
      next: r  => { this.passResult = r.data; this.passLooking = false; this.stopCamera(); },
      error: () => { this.passInputErr = 'Could not validate pass. Try again.'; this.passLooking = false; }
    });
  }

  checkIn(override: boolean) {
    this.checkingIn = true;
    const body: any = { token: this.passToken };
    if (override) { body.override = 'true'; body.overrideReason = this.overrideReason; }
    this.svc.checkInPass(body).subscribe({
      next: () => { this.checkingIn = false; this.checkInDone = true; },
      error: e  => { this.checkingIn = false; this.passInputErr = e.error?.message || 'Check-in failed.'; }
    });
  }

  formatPassDays(allowedDays: string | undefined): string {
    if (!allowedDays) return '';
    return allowedDays.split(',').map(d => DAY_NAMES[+d] || d).join(', ');
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.cameraActive = true;
      setTimeout(() => {
        if (this.videoEl?.nativeElement) this.videoEl.nativeElement.srcObject = this.stream!;
      }, 100);
      // Poll video frames for QR decoding using BarcodeDetector API if available
      this.scanInterval = setInterval(() => this.tryDecodeFrame(), 400);
    } catch { this.passInputErr = 'Camera access denied. Use code entry instead.'; }
  }

  stopCamera() {
    this.cameraActive = false;
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.scanInterval) { clearInterval(this.scanInterval); this.scanInterval = null; }
  }

  private async tryDecodeFrame() {
    if (!(window as any).BarcodeDetector || !this.videoEl?.nativeElement) return;
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await detector.detect(this.videoEl.nativeElement);
      if (barcodes.length > 0) {
        const raw = barcodes[0].rawValue?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (raw?.length === 8) {
          this.passToken = raw;
          this.validatePass();
        }
      }
    } catch { /* BarcodeDetector not supported */ }
  }

}
