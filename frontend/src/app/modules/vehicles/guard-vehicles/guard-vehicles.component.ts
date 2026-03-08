import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle, VisitorVehicle, VIOLATION_TYPE_CONFIG, ParkingViolation, PassValidationResult, DAY_NAMES } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-guard-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">

  <div class="header">
    <div class="header-row">
      <div>
        <div class="eyebrow">GATE CONTROL</div>
        <h1>Vehicle Registry</h1>
      </div>
      <div class="live-dot"><span class="dot"></span>LIVE</div>
    </div>
  </div>

  <!-- Tab strip -->
  <div class="tabs">
    <button class="tab" [class.active]="tab==='LOOKUP'"   (click)="tab='LOOKUP'">🔍 Lookup</button>
    <button class="tab" [class.active]="tab==='VISITORS'" (click)="tab='VISITORS'; loadVisitors()">
      🚙 Visitors <span class="tc" *ngIf="currentVisitors.length">{{ currentVisitors.length }}</span>
    </button>
    <button class="tab" [class.active]="tab==='LOG_IN'"   (click)="tab='LOG_IN'">➕ Log Entry</button>
    <button class="tab" [class.active]="tab==='VIOLATE'"  (click)="tab='VIOLATE'">⚠️ Violation</button>
    <button class="tab" [class.active]="tab==='PASS'"     (click)="tab='PASS'; resetPassScan()">🎫 Pass Scan</button>
  </div>

  <!-- ── PLATE LOOKUP ─────────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='LOOKUP'">
    <div class="search-box">
      <input [(ngModel)]="lookupPlate" class="plate-search"
        placeholder="Enter plate number…" (input)="onSearch()"
        style="text-transform:uppercase" />
      <div class="search-hint">Live search across all registered vehicles</div>
    </div>

    <div class="loading-sm" *ngIf="lookupLoading"><div class="spinner-sm"></div></div>

    <!-- Search results -->
    <ng-container *ngIf="!lookupLoading">
      <div class="result-card" *ngFor="let v of lookupResults"
           [class.approved]="v.status==='APPROVED'"
           [class.pending]="v.status==='PENDING'"
           [class.rejected]="v.status==='REJECTED' || v.status==='SUSPENDED'">
        <div class="rc-top">
          <div class="rc-plate">{{ v.plateNumber }}</div>
          <div class="status-lamp" [class.green]="v.status==='APPROVED'" [class.amber]="v.status==='PENDING'" [class.red]="v.status==='REJECTED'||v.status==='SUSPENDED'">
            <span class="lamp"></span>
            <span class="lamp-lbl">{{ v.status }}</span>
          </div>
        </div>
        <div class="rc-vehicle">{{ v.colour }} {{ v.make }} {{ v.model }} {{ v.year }}</div>
        <div class="rc-owner">
          <span>👤 {{ v.ownerName }}</span>
          <span>🏠 Flat {{ v.ownerBlock }}-{{ v.ownerFlat }}</span>
          <span *ngIf="v.ownerPhone">📱 {{ v.ownerPhone }}</span>
        </div>
        <div class="rc-slot" *ngIf="v.assignedSlotLabel">🅿️ {{ v.assignedSlotLabel }}</div>
        <div class="rc-note" *ngIf="v.adminNote">⚠️ {{ v.adminNote }}</div>
        <div class="rc-violations" *ngIf="v.violationCount > 0">
          🚨 {{ v.violationCount }} violation{{ v.violationCount > 1 ? 's' : '' }} on record
        </div>
      </div>
      <div class="no-result" *ngIf="lookupPlate.length > 2 && !lookupResults.length && !lookupLoading">
        <div class="nr-icon">❓</div>
        <p>Not registered</p>
        <small>This vehicle is not in the society registry</small>
        <button class="cta-btn" (click)="tab='LOG_IN'; visitorForm.plateNumber=lookupPlate">
          Log as Visitor →
        </button>
      </div>
      <div class="lookup-empty" *ngIf="!lookupPlate">
        <div class="le-icon">🔍</div>
        <p>Search any plate number to verify</p>
      </div>
    </ng-container>
  </div>

  <!-- ── VISITORS INSIDE ──────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='VISITORS'">
    <div class="loading-sm" *ngIf="visitorsLoading"><div class="spinner-sm"></div></div>
    <div class="visitor-card" *ngFor="let vv of currentVisitors">
      <div class="vi-top">
        <div class="vi-plate">{{ vv.plateNumber }}</div>
        <div class="vi-in">IN: {{ vv.enteredAt | date:'h:mm a' }}</div>
      </div>
      <div class="vi-name">{{ vv.visitorName }} · {{ vv.visitorPhone }}</div>
      <div class="vi-host">Visiting: <strong>Flat {{ vv.hostFlat }}</strong></div>
      <div class="vi-desc" *ngIf="vv.vehicleDescription">{{ vv.vehicleDescription }}</div>
      <div class="vi-slot" *ngIf="vv.slot">🅿️ Slot {{ vv.slot.block }}-{{ vv.slot.slotNumber }}</div>
      <button class="exit-btn" (click)="logExit(vv)">✓ Log Exit</button>
    </div>
    <div class="no-visitors" *ngIf="!visitorsLoading && !currentVisitors.length">
      <div>🟢</div>
      <p>No visitor vehicles currently inside</p>
    </div>
  </div>

  <!-- ── LOG VISITOR ENTRY ────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='LOG_IN'">
    <h2>Log Visitor Vehicle</h2>

    <div class="field">
      <label>Plate Number *</label>
      <input class="plate-input" [(ngModel)]="visitorForm.plateNumber"
        placeholder="KA01AB1234" style="text-transform:uppercase" />
    </div>
    <div class="field">
      <label>Vehicle Description</label>
      <input [(ngModel)]="visitorForm.vehicleDescription" placeholder="e.g. White Honda City" />
    </div>
    <div class="field">
      <label>Visitor Name *</label>
      <input [(ngModel)]="visitorForm.visitorName" placeholder="Full name" />
    </div>
    <div class="field">
      <label>Visitor Phone *</label>
      <input [(ngModel)]="visitorForm.visitorPhone" placeholder="10-digit mobile" type="tel" />
    </div>
    <div class="field">
      <label>Host Flat *</label>
      <input [(ngModel)]="visitorForm.hostFlat" placeholder="e.g. A-101" />
    </div>
    <div class="field">
      <label>Notes</label>
      <input [(ngModel)]="visitorForm.notes" placeholder="Optional notes" />
    </div>

    <div class="err" *ngIf="visitorError">{{ visitorError }}</div>
    <button class="submit-btn" (click)="logEntry()" [disabled]="visitorSubmitting">
      {{ visitorSubmitting ? 'Logging…' : '✓ Log Entry' }}
    </button>

    <div class="success-banner" *ngIf="visitorSuccess">
      ✅ Visitor vehicle logged successfully
    </div>
  </div>

  <!-- ── REPORT VIOLATION ─────────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='VIOLATE'">
    <h2>Report Violation</h2>

    <div class="field">
      <label>Plate Number *</label>
      <input class="plate-input" [(ngModel)]="violForm.plateNumber"
        placeholder="KA01AB1234" style="text-transform:uppercase" />
    </div>

    <div class="field">
      <label>Violation Type *</label>
      <div class="type-grid">
        <button *ngFor="let vt of violationTypes" class="vtype-btn"
          [class.active]="violForm.violationType===vt.value"
          (click)="violForm.violationType=vt.value">
          {{ vt.icon }} {{ vt.label }}
        </button>
      </div>
    </div>

    <div class="field">
      <label>Description *</label>
      <textarea [(ngModel)]="violForm.description" rows="3"
        placeholder="Describe the violation in detail…"></textarea>
    </div>

    <div class="field">
      <label>Photo Evidence (optional)</label>
      <div class="photo-drop" (click)="violPhotoInput.click()">
        <span *ngIf="!violPhoto">📷 Tap to attach photo</span>
        <span *ngIf="violPhoto">✅ {{ violPhoto.name }}</span>
      </div>
      <input #violPhotoInput type="file" accept="image/*" style="display:none" (change)="onViolPhoto($event)" />
    </div>

    <div class="err" *ngIf="violError">{{ violError }}</div>
    <button class="submit-btn" (click)="submitViolation()" [disabled]="violSubmitting">
      {{ violSubmitting ? 'Reporting…' : '🚨 Report Violation' }}
    </button>

    <div class="success-banner action-required" *ngIf="violSuccess && lastViolation?.status === 'ACTION_REQUIRED'">
      🚨 Violation reported — owner notified to move their vehicle
    </div>
    <div class="success-banner" *ngIf="violSuccess && lastViolation?.status !== 'ACTION_REQUIRED'">
      ✅ Violation reported — admin notified
    </div>
  </div>

  <!-- ── VISITOR PASS SCAN ──────────────────────────────────────────── -->
  <div class="body" *ngIf="tab==='PASS'">
    <h2>🎫 Visitor Pass Scan</h2>

    <!-- Input: typed code or scanned QR -->
    <div *ngIf="!passResult">
      <div class="scan-area">
        <div class="scan-icon" *ngIf="!cameraActive" (click)="startCamera()">
          <div class="cam-ring">📷</div>
          <div class="cam-hint">Tap to scan QR</div>
        </div>
        <video #videoEl id="pass-video" class="cam-video" [class.hidden]="!cameraActive"
          autoplay playsinline></video>
        <button class="stop-cam" *ngIf="cameraActive" (click)="stopCamera()">✕ Close Camera</button>
      </div>

      <div class="divider-or"><span>or enter code</span></div>

      <div class="code-entry">
        <input class="code-input" [(ngModel)]="passToken"
          placeholder="X K Y M  9 2 P Q"
          (input)="onPassTokenInput($event)"
          maxlength="8" />
        <button class="lookup-btn" (click)="validatePass()" [disabled]="!passToken || passLooking">
          {{ passLooking ? '…' : '→' }}
        </button>
      </div>
      <div class="pass-err" *ngIf="passInputErr">{{ passInputErr }}</div>
    </div>

    <!-- Validation result -->
    <div class="pass-result" *ngIf="passResult">

      <!-- VALID -->
      <div class="result-card valid" *ngIf="passResult.valid">
        <div class="result-header valid-hdr">
          <span class="result-icon">✅</span>
          <span class="result-title">PASS VALID</span>
        </div>
        <div class="result-visitor">{{ passResult.pass?.visitorName }}</div>
        <div class="result-meta" *ngIf="passResult.pass?.purpose">{{ passResult.pass?.purpose }}</div>
        <div class="result-meta" *ngIf="passResult.pass?.visitorPhone">📱 {{ passResult.pass?.visitorPhone }}</div>
        <div class="result-host">
          🏠 Flat {{ passResult.pass?.createdBy?.block }}-{{ passResult.pass?.createdBy?.flatNumber }}
          · {{ passResult.pass?.createdBy?.firstName }} {{ passResult.pass?.createdBy?.lastName }}
        </div>
        <div class="result-validity">
          <span *ngIf="passResult.pass?.passType==='ONE_TIME'">📅 One-time pass · {{ passResult.pass?.validDate | date:'d MMM' }}
            <span *ngIf="passResult.pass?.windowStart"> · {{ passResult.pass?.windowStart }}–{{ passResult.pass?.windowEnd }}</span>
          </span>
          <span *ngIf="passResult.pass?.passType==='STANDING'">🔄 Standing · {{ formatPassDays(passResult.pass?.allowedDays) }}</span>
        </div>
        <div class="result-notes" *ngIf="passResult.pass?.notes">💬 {{ passResult.pass?.notes }}</div>
        <button class="checkin-btn" (click)="checkIn(false)" [disabled]="checkingIn">
          {{ checkingIn ? 'Checking in…' : '✅ Allow Entry' }}
        </button>
      </div>

      <!-- INVALID -->
      <div class="result-card invalid" *ngIf="!passResult.valid">
        <div class="result-header invalid-hdr">
          <span class="result-icon">🚫</span>
          <span class="result-title">PASS INVALID</span>
        </div>
        <div class="result-reason">{{ passResult.errorReason }}</div>

        <ng-container *ngIf="passResult.pass">
          <div class="result-visitor mt">{{ passResult.pass?.visitorName }}</div>
          <div class="result-meta" *ngIf="passResult.pass?.purpose">{{ passResult.pass?.purpose }}</div>
          <div class="result-host">
            🏠 Flat {{ passResult.pass?.createdBy?.block }}-{{ passResult.pass?.createdBy?.flatNumber }}
            · {{ passResult.pass?.createdBy?.firstName }} {{ passResult.pass?.createdBy?.lastName }}
          </div>
        </ng-container>

        <!-- Override section -->
        <div class="override-section">
          <div class="override-label">Guard Override — Allow Entry Anyway?</div>
          <textarea [(ngModel)]="overrideReason" rows="2"
            placeholder="Reason for override (required)…" class="override-input"></textarea>
          <button class="override-btn" (click)="checkIn(true)"
            [disabled]="!overrideReason.trim() || checkingIn">
            {{ checkingIn ? 'Processing…' : '⚠️ Override & Allow Entry' }}
          </button>
        </div>
      </div>

      <!-- Post check-in success -->
      <div class="checkin-success" *ngIf="checkInDone">
        <div class="cs-icon">✅</div>
        <div class="cs-msg">Entry logged for {{ passResult.pass?.visitorName }}</div>
      </div>

      <button class="scan-another" (click)="resetPassScan()">← Scan Another Pass</button>
    </div>
  </div>

</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}

    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #f59e0b;padding:18px 16px 14px}
    .header-row{display:flex;justify-content:space-between;align-items:flex-start}
    .eyebrow{font-size:10px;color:#f59e0b;letter-spacing:3px;text-transform:uppercase;font-family:'Oswald',sans-serif;margin-bottom:2px}
    h1{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;margin:0;letter-spacing:1px}
    .live-dot{display:flex;align-items:center;gap:6px;font-size:10px;color:#10b981;font-family:'Oswald',sans-serif;letter-spacing:2px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:5px 10px;border-radius:20px}
    .dot{width:7px;height:7px;background:#10b981;border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}

    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a;overflow-x:auto}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:11px 4px;font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:0.3px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:4px}
    .tab.active{color:#f59e0b;border-bottom-color:#f59e0b}
    .tc{background:#f59e0b;color:#111;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700}

    .body{padding:14px;display:flex;flex-direction:column;gap:12px}
    h2{font-family:'Oswald',sans-serif;font-size:13px;font-weight:500;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;margin:0}

    /* Plate search */
    .search-box{display:flex;flex-direction:column;gap:6px}
    .plate-search,.plate-input{background:#252525;border:2px solid #333;border-radius:8px;color:#fff;padding:14px;font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:600;letter-spacing:3px;outline:none;width:100%;box-sizing:border-box;text-transform:uppercase}
    .plate-search:focus,.plate-input:focus{border-color:#f59e0b}
    .search-hint{font-size:11px;color:#4b5563;text-align:center}

    .loading-sm{display:flex;justify-content:center;padding:30px}
    .spinner-sm{width:24px;height:24px;border:2px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* Result card */
    .result-card{border-radius:10px;padding:14px;border:1.5px solid #333;background:#252525;animation:fadeIn 0.2s ease-out}
    .result-card.approved{border-color:#065f46;background:rgba(16,185,129,0.05)}
    .result-card.pending{border-color:#92400e;background:rgba(245,158,11,0.05)}
    .result-card.rejected{border-color:#7f1d1d;background:rgba(239,68,68,0.05)}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .rc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .rc-plate{font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:600;color:#fff;letter-spacing:3px;background:rgba(0,0,0,0.3);padding:5px 12px;border-radius:5px;border:1px solid #444}
    .status-lamp{display:flex;align-items:center;gap:6px}
    .lamp{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .status-lamp.green .lamp{background:#10b981;box-shadow:0 0 8px #10b981}
    .status-lamp.amber .lamp{background:#f59e0b;box-shadow:0 0 8px #f59e0b}
    .status-lamp.red   .lamp{background:#ef4444;box-shadow:0 0 8px #ef4444}
    .lamp-lbl{font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:1px}
    .status-lamp.green .lamp-lbl{color:#10b981}
    .status-lamp.amber .lamp-lbl{color:#f59e0b}
    .status-lamp.red   .lamp-lbl{color:#ef4444}
    .rc-vehicle{font-size:14px;color:#e8e8e8;margin-bottom:8px}
    .rc-owner{display:flex;flex-direction:column;gap:3px;font-size:12px;color:#9ca3af;margin-bottom:6px}
    .rc-slot{font-size:12px;color:#f59e0b;margin-bottom:4px}
    .rc-note{font-size:12px;color:#fbbf24;background:rgba(245,158,11,0.1);padding:6px 10px;border-radius:4px;margin-bottom:4px}
    .rc-violations{font-size:12px;color:#f87171;font-weight:600}

    .no-result,.lookup-empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .nr-icon,.le-icon{font-size:40px}
    .no-result p,.lookup-empty p{font-family:'Oswald',sans-serif;font-size:18px;color:#6b7280;margin:0}
    .no-result small{font-size:12px;color:#4b5563}
    .cta-btn{background:#f59e0b;border:none;color:#111;padding:10px 20px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:0.5px;margin-top:8px}

    /* Visitor cards */
    .visitor-card{background:#252525;border:1px solid #333;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px}
    .vi-top{display:flex;justify-content:space-between;align-items:center}
    .vi-plate{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:#fff;letter-spacing:2px;background:#333;padding:3px 10px;border-radius:4px}
    .vi-in{font-size:11px;color:#f59e0b;font-family:'Oswald',sans-serif;letter-spacing:0.5px}
    .vi-name{font-size:13px;color:#e8e8e8;font-weight:500}
    .vi-host{font-size:12px;color:#9ca3af}
    .vi-desc{font-size:12px;color:#6b7280}
    .vi-slot{font-size:12px;color:#f59e0b}
    .exit-btn{background:#065f46;border:none;color:#d1fae5;padding:9px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.5px;align-self:flex-start;margin-top:2px}
    .no-visitors{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .no-visitors div{font-size:40px}
    .no-visitors p{font-family:'Oswald',sans-serif;color:#4b5563;font-size:16px;margin:0}

    /* Form fields */
    .field{display:flex;flex-direction:column;gap:5px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif}
    input,textarea{background:#252525;border:1.5px solid #333;border-radius:7px;color:#e8e8e8;padding:10px 12px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box;resize:vertical}
    input:focus,textarea:focus{border-color:#f59e0b}

    /* Violation type grid */
    .type-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .vtype-btn{background:#252525;border:1.5px solid #333;border-radius:8px;color:#9ca3af;padding:9px 8px;font-size:11px;font-family:'IBM Plex Sans',sans-serif;font-weight:500;cursor:pointer;text-align:left;transition:all 0.15s}
    .vtype-btn.active{background:rgba(239,68,68,0.1);border-color:#ef4444;color:#f87171}

    .photo-drop{background:#252525;border:1.5px dashed #444;border-radius:8px;padding:14px;text-align:center;cursor:pointer;font-size:13px;color:#6b7280;transition:border-color 0.15s}
    .photo-drop:hover{border-color:#f59e0b}
    .err{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:10px;border-radius:6px;font-size:13px}
    .submit-btn{background:#f59e0b;border:none;color:#111;padding:13px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;cursor:pointer}
    .submit-btn:disabled{opacity:0.4}
    .success-banner{background:rgba(16,185,129,0.1);border:1px solid #10b981;color:#34d399;padding:12px;border-radius:8px;font-size:13px;text-align:center}

    /* Pass scan tab */
    .scan-area{display:flex;flex-direction:column;align-items:center;gap:8px;background:#111;border:1.5px dashed #333;border-radius:12px;padding:20px}
    .cam-ring{font-size:36px;cursor:pointer}
    .cam-hint{font-size:11px;color:#6b7280;letter-spacing:1px}
    .cam-video{width:100%;max-width:320px;border-radius:8px;background:#000}
    .cam-video.hidden{display:none}
    .stop-cam{background:none;border:1px solid #444;color:#6b7280;padding:6px 14px;border-radius:6px;font-size:11px;cursor:pointer}
    .divider-or{display:flex;align-items:center;gap:10px;color:#4b5563;font-size:11px}
    .divider-or::before,.divider-or::after{content:'';flex:1;border-top:1px solid #333}
    .code-entry{display:flex;gap:8px}
    .code-input{font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:700;letter-spacing:8px;text-align:center;text-transform:uppercase;flex:1}
    .lookup-btn{background:#f59e0b;border:none;color:#111;width:44px;border-radius:7px;font-size:18px;font-weight:700;cursor:pointer;flex-shrink:0}
    .lookup-btn:disabled{opacity:0.4}
    .pass-err{color:#f87171;font-size:12px;text-align:center}

    .pass-result{display:flex;flex-direction:column;gap:10px}
    .result-card{border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px}
    .result-card.valid{background:#0a1a0f;border:1.5px solid #10b981}
    .result-card.invalid{background:#1a0a0a;border:1.5px solid #ef4444}
    .result-header{display:flex;align-items:center;gap:8px}
    .valid-hdr .result-title{font-family:'Oswald',sans-serif;font-size:14px;color:#10b981;letter-spacing:2px}
    .invalid-hdr .result-title{font-family:'Oswald',sans-serif;font-size:14px;color:#ef4444;letter-spacing:2px}
    .result-icon{font-size:20px}
    .result-visitor{font-family:'Oswald',sans-serif;font-size:20px;color:#fff;font-weight:700}
    .result-meta{font-size:12px;color:#9ca3af}
    .result-host{font-size:13px;color:#f59e0b;font-weight:500}
    .result-validity{font-size:12px;color:#6ee7b7}
    .result-notes{font-size:12px;color:#6b7280;font-style:italic}
    .result-reason{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;padding:9px 12px;border-radius:6px;font-size:13px;font-weight:500}
    .mt{margin-top:4px}
    .checkin-btn{background:#10b981;border:none;color:#fff;padding:12px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer;margin-top:4px}
    .checkin-btn:disabled{opacity:0.4}
    .override-section{border-top:1px solid #333;padding-top:10px;margin-top:4px;display:flex;flex-direction:column;gap:8px}
    .override-label{font-size:11px;color:#f59e0b;letter-spacing:1px;font-family:'Oswald',sans-serif}
    .override-input{background:#1c1c1c;border:1.5px solid #444;border-radius:6px;color:#e8e8e8;padding:8px 10px;font-size:12px;font-family:'IBM Plex Sans',sans-serif;resize:vertical;width:100%;box-sizing:border-box}
    .override-btn{background:rgba(245,158,11,0.15);border:1px solid #f59e0b;color:#f59e0b;padding:10px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
    .override-btn:disabled{opacity:0.4}
    .checkin-success{background:#0a1a0f;border:1px solid #10b981;border-radius:8px;padding:14px;display:flex;align-items:center;gap:10px}
    .cs-icon{font-size:24px}
    .cs-msg{font-size:14px;color:#6ee7b7;font-weight:500}
    .scan-another{background:none;border:1px solid #333;color:#6b7280;padding:9px;border-radius:7px;font-size:12px;cursor:pointer;text-align:center}

  `]
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
