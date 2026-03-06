import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import {
  Vehicle, ParkingSlot, ParkingViolation, VisitorVehicle, ParkingStats, SlotVehicleInfo,
  VEHICLE_STATUS_CONFIG, VEHICLE_TYPE_CONFIG, SLOT_STATUS_CONFIG, VIOLATION_TYPE_CONFIG
} from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-manage-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">

  <!-- Header with stats -->
  <div class="header">
    <button class="back" routerLink="/vehicles">← Back</button>
    <div class="title-row">
      <h1>🅿️ PARKING CONTROL</h1>
    </div>
    <div class="stats-grid" *ngIf="stats">
      <div class="stat-box" [class.amber]="stats.pendingApproval > 0">
        <span class="sn">{{ stats.pendingApproval }}</span>
        <span class="sl">PENDING</span>
      </div>
      <div class="stat-box">
        <span class="sn">{{ stats.registeredVehicles }}</span>
        <span class="sl">REGISTERED</span>
      </div>
      <div class="stat-box green">
        <span class="sn">{{ stats.available }}</span>
        <span class="sl">FREE SLOTS</span>
      </div>
      <div class="stat-box red">
        <span class="sn">{{ stats.occupied }}</span>
        <span class="sl">OCCUPIED</span>
      </div>
      <div class="stat-box">
        <span class="sn">{{ stats.visitorsNow }}</span>
        <span class="sl">VISITORS IN</span>
      </div>
      <div class="stat-box" [class.red]="stats.openViolations > 0">
        <span class="sn">{{ stats.openViolations }}</span>
        <span class="sl">VIOLATIONS</span>
      </div>
    </div>
  </div>

  <!-- Tab navigation -->
  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab===t.v"
      (click)="activeTab=t.v; loadTab(t.v)">
      {{ t.label }}
      <span class="tab-count" *ngIf="tabCount(t.v)">{{ tabCount(t.v) }}</span>
    </button>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <!-- ── PENDING APPROVALS ─────────────────────────────────────────────── -->
  <div class="tab-body" *ngIf="activeTab==='PENDING' && !loading">
    <div class="empty" *ngIf="!pending.length">✅ No pending registrations</div>
    <div class="vehicle-row" *ngFor="let v of pending">
      <div class="vr-plate">{{ v.plateNumber }}</div>
      <div class="vr-info">
        <strong>{{ v.make }} {{ v.model }}</strong>
        <span>{{ v.colour }} · {{ v.year }}</span>
        <span class="vr-owner">{{ v.ownerName }} · Flat {{ v.ownerBlock }}-{{ v.ownerFlat }}</span>
      </div>
      <div class="vr-type">{{ typeIcon(v.type) }}</div>
      <div class="vr-actions">
        <button class="act approve" (click)="approve(v)">✓ Approve</button>
        <button class="act reject"  (click)="promptReject(v)">✕ Reject</button>
      </div>
    </div>
    <div class="reject-modal" *ngIf="rejectTarget">
      <div class="rm-box">
        <h3>Reject — {{ rejectTarget.plateNumber }}</h3>
        <textarea [(ngModel)]="rejectReason" placeholder="Reason for rejection…" rows="3"></textarea>
        <div class="rm-actions">
          <button class="act reject" (click)="confirmReject()">Reject</button>
          <button class="act cancel" (click)="rejectTarget=null">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── ALL VEHICLES ──────────────────────────────────────────────────── -->
  <div class="tab-body" *ngIf="activeTab==='ALL' && !loading">
    <input class="search" [(ngModel)]="vehicleSearch" placeholder="🔍  Search plate, owner, flat…" />
    <div class="vehicle-row" *ngFor="let v of filteredVehicles">
      <div class="vr-plate">{{ v.plateNumber }}</div>
      <div class="vr-info">
        <strong>{{ v.make }} {{ v.model }}</strong>
        <span>{{ v.colour }} {{ v.year }}</span>
        <span class="vr-owner">{{ v.ownerName }} · {{ v.ownerBlock }}-{{ v.ownerFlat }}</span>
      </div>
      <div class="vr-status">
        <span class="status-dot" [style.background]="statusColor(v)"></span>
        <span class="status-lbl" [style.color]="statusColor(v)">{{ statusLabel(v) }}</span>
      </div>
      <div class="vr-slot" *ngIf="v.assignedSlotLabel">🅿️ {{ v.assignedSlotLabel }}</div>
      <button class="act suspend" *ngIf="v.status==='APPROVED'" (click)="promptSuspend(v)">Suspend</button>
    </div>
    <div class="suspend-modal" *ngIf="suspendTarget">
      <div class="rm-box">
        <h3>Suspend — {{ suspendTarget.plateNumber }}</h3>
        <textarea [(ngModel)]="suspendReason" placeholder="Reason for suspension…" rows="3"></textarea>
        <div class="rm-actions">
          <button class="act reject" (click)="confirmSuspend()">Suspend</button>
          <button class="act cancel" (click)="suspendTarget=null">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── PARKING SLOTS ─────────────────────────────────────────────────── -->
  <div class="tab-body" *ngIf="activeTab==='SLOTS' && !loading">
    <button class="add-slot-btn" (click)="showSlotForm=!showSlotForm">
      {{ showSlotForm ? '✕ Cancel' : '+ Add Slot' }}
    </button>

    <!-- Add slot form -->
    <div class="slot-form" *ngIf="showSlotForm">
      <div class="sf-row">
        <div class="field"><label>Block</label><input [(ngModel)]="slotForm.block" placeholder="A" /></div>
        <div class="field"><label>Slot #</label><input [(ngModel)]="slotForm.slotNumber" placeholder="01" /></div>
        <div class="field"><label>Level</label><input [(ngModel)]="slotForm.level" placeholder="Ground" /></div>
      </div>
      <div class="sf-row">
        <div class="field">
          <label>Type</label>
          <select [(ngModel)]="slotForm.type">
            <option value="CAR">Car</option><option value="BIKE">Bike</option>
            <option value="VISITOR">Visitor</option><option value="RESERVED">Reserved</option>
          </select>
        </div>
      </div>
      <button class="submit-btn" (click)="createSlot()">Create Slot</button>
    </div>

    <!-- Slot grid grouped by block -->
    <div *ngFor="let group of slotGroups">
      <div class="block-label">BLOCK {{ group.block }}</div>
      <div class="slot-grid">
        <div class="slot-card" *ngFor="let s of group.slots"
             [class.occupied]="s.status==='OCCUPIED'"
             [class.available]="s.status==='AVAILABLE'"
             [class.reserved]="s.status==='RESERVED'"
             [class.maintenance]="s.status==='MAINTENANCE'">
          <div class="sc-number">{{ s.slotNumber }}</div>
          <div class="sc-type">{{ slotTypeIcon(s.type) }}</div>
          <div class="sc-status">{{ slotStatusLabel(s.status) }}</div>
          <div class="sc-vehicle" *ngFor="let v of s.vehicles">
            <span class="sc-plate">{{ v.plate }}</span>
            <span class="sc-vtype">{{ v.type === 'CAR' ? '🚗' : v.type === 'BIKE' ? '🏍️' : '🛵' }}</span>
            <span class="sc-owner">{{ v.ownerFlat }}</span>
            <button class="sa unassign-v" (click)="unassignVehicle(s, v.id)" title="Remove">×</button>
          </div>
          <div class="sc-actions">
            <button class="sa delete"   *ngIf="!s.vehicles?.length" (click)="deleteSlot(s)">🗑</button>
            <button class="sa assign"   *ngIf="s.status==='AVAILABLE'" (click)="startAssign(s)">+ Assign</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign vehicle modal -->
    <div class="assign-modal" *ngIf="assignSlot">
      <div class="rm-box">
        <h3>Assign to Slot {{ assignSlot.block }}-{{ assignSlot.slotNumber }}</h3>
        <input [(ngModel)]="assignSearch" placeholder="Search vehicle plate…" />
        <div class="assign-list">
          <div *ngFor="let v of assignableVehicles" class="assign-row" (click)="doAssign(v)">
            <span class="assign-plate">{{ v.plateNumber }}</span>
            <span>{{ v.ownerName }} · {{ v.ownerBlock }}-{{ v.ownerFlat }}</span>
            <span class="assign-go">→</span>
          </div>
          <div *ngIf="!assignableVehicles.length" class="assign-empty">No approved vehicles without slots</div>
        </div>
        <button class="act cancel" (click)="assignSlot=null">Cancel</button>
      </div>
    </div>
  </div>

  <!-- ── VIOLATIONS ────────────────────────────────────────────────────── -->
  <div class="tab-body" *ngIf="activeTab==='VIOLATIONS' && !loading">
    <div class="empty" *ngIf="!violations.length">✅ No violations on record</div>
    <div class="violation-row" *ngFor="let v of violations" [class.resolved]="v.resolved">
      <div class="viol-top">
        <span class="viol-plate">{{ v.plateNumber }}</span>
        <span class="viol-type">{{ violationIcon(v.violationType) }} {{ violationLabel(v.violationType) }}</span>
        <span class="viol-resolved" *ngIf="v.resolved">✅ Resolved</span>
        <span class="viol-open"     *ngIf="!v.resolved">⚠️ Open</span>
      </div>
      <p class="viol-desc">{{ v.description }}</p>
      <div class="viol-meta">
        <span>Reported by {{ v.reportedBy?.firstName }} · {{ v.reportedAt | date:'MMM d, h:mm a' }}</span>
        <span *ngIf="v.slot">Slot: {{ v.slot.block }}-{{ v.slot.slotNumber }}</span>
      </div>
      <div class="viol-resolve" *ngIf="!v.resolved">
        <input [(ngModel)]="resolveNotes[v.id]" placeholder="Resolution note…" class="resolve-input" />
        <button class="act resolve" (click)="resolveViolation(v)">Mark Resolved</button>
      </div>
    </div>
  </div>

  <!-- ── VISITOR LOG ────────────────────────────────────────────────────── -->
  <div class="tab-body" *ngIf="activeTab==='VISITORS' && !loading">
    <div class="visitor-tabs">
      <button class="vtab" [class.active]="visitorFilter==='INSIDE'" (click)="visitorFilter='INSIDE'">
        Inside Now <span *ngIf="currentVisitors.length">({{ currentVisitors.length }})</span>
      </button>
      <button class="vtab" [class.active]="visitorFilter==='ALL'" (click)="visitorFilter='ALL'">All Logs</button>
    </div>
    <div class="visitor-row" *ngFor="let vv of displayedVisitors">
      <div class="vi-plate">{{ vv.plateNumber }}</div>
      <div class="vi-info">
        <strong>{{ vv.visitorName }}</strong> · {{ vv.visitorPhone }}
        <span>Visiting Flat: <strong>{{ vv.hostFlat }}</strong></span>
        <span *ngIf="vv.vehicleDescription">{{ vv.vehicleDescription }}</span>
      </div>
      <div class="vi-times">
        <span>In: {{ vv.enteredAt | date:'h:mm a' }}</span>
        <span *ngIf="vv.exitedAt">Out: {{ vv.exitedAt | date:'h:mm a' }}</span>
        <span class="vi-inside" *ngIf="!vv.exitedAt">🟢 Inside</span>
      </div>
      <button class="act exit-btn" *ngIf="!vv.exitedAt" (click)="logExit(vv)">Log Exit</button>
    </div>
    <div class="empty" *ngIf="!displayedVisitors.length">No visitor vehicles {{ visitorFilter==='INSIDE' ? 'currently inside' : 'on record' }}</div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}

    .header{background:#111;border-bottom:3px solid #f59e0b;padding:16px}
    .back{background:none;border:1px solid #333;color:#9ca3af;padding:5px 12px;border-radius:4px;font-size:11px;cursor:pointer;margin-bottom:12px;display:block;font-family:'Oswald',sans-serif;letter-spacing:0.5px}
    .title-row{margin-bottom:14px}
    h1{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#f59e0b;margin:0;letter-spacing:2px}
    .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .stat-box{background:#1c1c1c;border:1px solid #333;border-radius:8px;padding:10px;text-align:center}
    .stat-box.amber{border-color:#f59e0b;background:rgba(245,158,11,0.08)}
    .stat-box.green{border-color:#10b981;background:rgba(16,185,129,0.08)}
    .stat-box.red{border-color:#ef4444;background:rgba(239,68,68,0.08)}
    .sn{display:block;font-family:'Oswald',sans-serif;font-size:24px;font-weight:700;color:#fff;line-height:1}
    .stat-box.amber .sn{color:#f59e0b}
    .stat-box.green .sn{color:#10b981}
    .stat-box.red .sn{color:#ef4444}
    .sl{font-size:9px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;font-family:'Oswald',sans-serif}

    .tabs{display:flex;background:#111;border-bottom:1px solid #333;overflow-x:auto}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:12px 6px;font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:0.5px;text-transform:uppercase;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:6px}
    .tab.active{color:#f59e0b;border-bottom-color:#f59e0b}
    .tab-count{background:#f59e0b;color:#111;font-size:10px;padding:1px 5px;border-radius:8px;font-weight:700}

    .loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    .tab-body{padding:14px;display:flex;flex-direction:column;gap:10px}
    .empty{text-align:center;padding:40px;color:#4b5563;font-size:14px}

    /* Vehicle rows */
    .search{width:100%;background:#252525;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:10px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;box-sizing:border-box;margin-bottom:4px}
    .search:focus{border-color:#f59e0b}
    .vehicle-row{background:#252525;border:1px solid #333;border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .vr-plate{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;color:#fff;background:#333;padding:4px 10px;border-radius:4px;letter-spacing:1.5px;min-width:110px;text-align:center}
    .vr-info{flex:1;display:flex;flex-direction:column;gap:2px;min-width:140px}
    .vr-info strong{color:#e8e8e8;font-size:14px}
    .vr-info span{font-size:12px;color:#6b7280}
    .vr-owner{color:#9ca3af !important}
    .vr-type{font-size:20px}
    .vr-status{display:flex;align-items:center;gap:6px}
    .status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .status-lbl{font-size:11px;font-family:'Oswald',sans-serif;font-weight:500;letter-spacing:0.5px}
    .vr-slot{font-size:12px;color:#f59e0b}
    .vr-actions{display:flex;gap:6px;flex-wrap:wrap}

    /* Action buttons */
    .act{border:none;border-radius:5px;font-size:11px;font-weight:700;padding:6px 12px;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:0.5px;text-transform:uppercase}
    .act.approve{background:#065f46;color:#d1fae5}
    .act.reject{background:#7f1d1d;color:#fee2e2}
    .act.suspend{background:#4c1d95;color:#ede9fe}
    .act.resolve{background:#065f46;color:#d1fae5}
    .act.cancel{background:#333;color:#9ca3af}
    .act.unassign{background:#333;color:#f59e0b}
    .act.delete{background:rgba(239,68,68,0.15);color:#f87171}
    .act.assign{background:rgba(245,158,11,0.15);color:#f59e0b}
    .act.exit-btn{background:#065f46;color:#d1fae5;font-size:11px}

    /* Modals */
    .reject-modal,.suspend-modal,.assign-modal{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
    .rm-box{background:#252525;border:1px solid #444;border-radius:12px;padding:20px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:12px}
    .rm-box h3{font-family:'Oswald',sans-serif;color:#f59e0b;font-size:15px;margin:0;letter-spacing:1px}
    .rm-box textarea,.rm-box input{background:#333;border:1.5px solid #444;border-radius:6px;color:#e8e8e8;padding:10px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box;resize:vertical}
    .rm-actions{display:flex;gap:8px}
    .submit-btn{background:#f59e0b;border:none;color:#111;padding:11px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:1px}

    /* Slot form */
    .add-slot-btn{background:#f59e0b;border:none;color:#111;padding:9px 18px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:0.5px;align-self:flex-start}
    .slot-form{background:#252525;border:1px solid #333;border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:10px}
    .sf-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .field{display:flex;flex-direction:column;gap:4px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif}
    input,select{background:#333;border:1.5px solid #444;border-radius:5px;color:#e8e8e8;padding:8px;font-size:12px;outline:none;width:100%;box-sizing:border-box;font-family:'IBM Plex Sans',sans-serif}
    input:focus,select:focus{border-color:#f59e0b}

    /* Slot grid */
    .block-label{font-family:'Oswald',sans-serif;font-size:12px;color:#f59e0b;letter-spacing:3px;padding:12px 0 6px;border-top:1px solid #333;margin-top:8px}
    .slot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
    .slot-card{border:1.5px solid #333;border-radius:8px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color 0.15s}
    .slot-card.available{border-color:#065f46;background:rgba(16,185,129,0.05)}
    .slot-card.occupied{border-color:#7f1d1d;background:rgba(239,68,68,0.05)}
    .slot-card.reserved{border-color:#92400e;background:rgba(245,158,11,0.05)}
    .slot-card.maintenance{border-color:#4b5563;background:rgba(107,114,128,0.05)}
    .sc-number{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#fff}
    .sc-type{font-size:16px}
    .sc-status{font-size:9px;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif;color:#6b7280}
    .slot-card.available .sc-status{color:#10b981}
    .slot-card.occupied .sc-status{color:#ef4444}
    .sc-vehicle{display:flex;align-items:center;gap:4px;width:100%;margin:2px 0}
    .sc-plate{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#e8e8e8;letter-spacing:1px;flex:1}
    .sc-vtype{font-size:11px}
    .sc-owner{font-size:9px;color:#6b7280}
    .sc-actions{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;justify-content:center}
    .sa{border:none;border-radius:4px;font-size:9px;font-weight:700;padding:4px 8px;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:0.5px}
    .sa.unassign-v{background:transparent;color:#6b7280;font-size:13px;padding:2px 4px;line-height:1}
    .sa.unassign-v:hover{color:#f87171}
    .sa.delete{background:rgba(239,68,68,0.1);color:#f87171}
    .sa.assign{background:rgba(245,158,11,0.1);color:#f59e0b}

    /* Assign modal */
    .assign-list{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto}
    .assign-row{display:flex;align-items:center;gap:8px;background:#333;border-radius:6px;padding:8px 10px;cursor:pointer;transition:background 0.15s}
    .assign-row:hover{background:#444}
    .assign-plate{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#fff}
    .assign-row span{font-size:12px;color:#9ca3af;flex:1}
    .assign-go{color:#f59e0b;font-weight:700;margin-left:auto}
    .assign-empty{color:#4b5563;font-size:13px;text-align:center;padding:16px}

    /* Violations */
    .violation-row{background:#252525;border:1px solid #333;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:6px}
    .violation-row.resolved{opacity:0.5}
    .viol-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .viol-plate{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:#fff;background:#333;padding:3px 8px;border-radius:4px;letter-spacing:1px}
    .viol-type{font-size:12px;color:#f59e0b;font-family:'Oswald',sans-serif;letter-spacing:0.5px}
    .viol-resolved{font-size:11px;color:#10b981;margin-left:auto}
    .viol-open{font-size:11px;color:#f59e0b;margin-left:auto}
    .viol-desc{font-size:13px;color:#9ca3af;margin:0}
    .viol-meta{font-size:11px;color:#4b5563;display:flex;gap:10px;flex-wrap:wrap}
    .viol-resolve{display:flex;gap:8px;align-items:center}
    .resolve-input{flex:1;background:#333;border:1.5px solid #444;border-radius:5px;color:#e8e8e8;padding:7px 10px;font-size:12px;outline:none;font-family:'IBM Plex Sans',sans-serif}

    /* Visitor log */
    .visitor-tabs{display:flex;gap:8px;margin-bottom:8px}
    .vtab{background:#252525;border:1.5px solid #333;border-radius:20px;color:#6b7280;padding:7px 14px;font-size:11px;font-family:'Oswald',sans-serif;letter-spacing:0.5px;cursor:pointer;transition:all 0.15s}
    .vtab.active{background:#f59e0b;border-color:#f59e0b;color:#111}
    .visitor-row{background:#252525;border:1px solid #333;border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .vi-plate{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#fff;background:#333;padding:3px 8px;border-radius:4px;letter-spacing:1px;flex-shrink:0}
    .vi-info{flex:1;display:flex;flex-direction:column;gap:2px;font-size:12px;color:#9ca3af}
    .vi-info strong{color:#e8e8e8;font-size:13px}
    .vi-times{display:flex;flex-direction:column;gap:2px;font-size:11px;color:#6b7280;text-align:right}
    .vi-inside{color:#10b981;font-weight:600}
  `]
})
export class ManageVehiclesComponent implements OnInit {
  activeTab = 'PENDING';
  loading = true;
  stats: ParkingStats | null = null;

  pending: Vehicle[] = [];
  allVehicles: Vehicle[] = [];
  slots: ParkingSlot[] = [];
  violations: ParkingViolation[] = [];
  allVisitorLogs: VisitorVehicle[] = [];
  currentVisitors: VisitorVehicle[] = [];

  vehicleSearch = '';
  rejectTarget: Vehicle | null = null;
  rejectReason = '';
  suspendTarget: Vehicle | null = null;
  suspendReason = '';
  assignSlot: ParkingSlot | null = null;
  assignSearch = '';
  visitorFilter = 'INSIDE';
  resolveNotes: Record<number, string> = {};

  showSlotForm = false;
  slotForm = { block: '', slotNumber: '', level: '', type: 'CAR', status: 'AVAILABLE' };

  tabs = [
    { v: 'PENDING',    label: 'Pending' },
    { v: 'ALL',        label: 'All Vehicles' },
    { v: 'SLOTS',      label: 'Slots' },
    { v: 'VIOLATIONS', label: 'Violations' },
    { v: 'VISITORS',   label: 'Visitors' },
  ];

  constructor(private svc: VehicleService) {}

  ngOnInit() {
    this.svc.getStats().subscribe(r => this.stats = r.data);
    this.loadTab('PENDING');
  }

  loadTab(tab: string) {
    this.loading = true;
    switch (tab) {
      case 'PENDING':
        this.svc.getPendingVehicles().subscribe(r => { this.pending = r.data; this.loading = false; });
        break;
      case 'ALL':
        this.svc.getAllVehicles().subscribe(r => { this.allVehicles = r.data; this.loading = false; });
        break;
      case 'SLOTS':
        this.svc.getAllSlots().subscribe(r => { this.slots = r.data; this.loading = false; });
        break;
      case 'VIOLATIONS':
        this.svc.getAllViolations().subscribe(r => { this.violations = r.data; this.loading = false; });
        break;
      case 'VISITORS':
        Promise.all([
          this.svc.getCurrentVisitors().toPromise(),
          this.svc.getAllVisitorLogs().toPromise(),
        ]).then(([cur, all]) => {
          this.currentVisitors = cur?.data || [];
          this.allVisitorLogs  = all?.data || [];
          this.loading = false;
        });
        break;
    }
  }

  tabCount(v: string) {
    if (v === 'PENDING') return this.stats?.pendingApproval || 0;
    if (v === 'VIOLATIONS') return this.stats?.openViolations || 0;
    if (v === 'VISITORS') return this.stats?.visitorsNow || 0;
    return 0;
  }

  get filteredVehicles() {
    if (!this.vehicleSearch) return this.allVehicles;
    const q = this.vehicleSearch.toLowerCase();
    return this.allVehicles.filter(v =>
      v.plateNumber.toLowerCase().includes(q) ||
      v.ownerName.toLowerCase().includes(q) ||
      (v.ownerFlat || '').toLowerCase().includes(q)
    );
  }

  get slotGroups() {
    const map = new Map<string, ParkingSlot[]>();
    for (const s of this.slots) {
      if (!map.has(s.block)) map.set(s.block, []);
      map.get(s.block)!.push(s);
    }
    return Array.from(map.entries()).map(([block, slots]) => ({ block, slots }));
  }

  get displayedVisitors() {
    return this.visitorFilter === 'INSIDE' ? this.currentVisitors : this.allVisitorLogs;
  }

  get assignableVehicles() {
    return this.allVehicles.filter(v =>
      v.status === 'APPROVED' && !v.assignedSlotId &&
      (!this.assignSearch || v.plateNumber.toLowerCase().includes(this.assignSearch.toLowerCase()))
    );
  }

  approve(v: Vehicle) {
    this.svc.approveVehicle(v.id).subscribe(() => {
      this.pending = this.pending.filter(x => x.id !== v.id);
      if (this.stats) this.stats.pendingApproval--;
    });
  }

  promptReject(v: Vehicle)  { this.rejectTarget = v; this.rejectReason = ''; }
  confirmReject() {
    this.svc.rejectVehicle(this.rejectTarget!.id, this.rejectReason).subscribe(() => {
      this.pending = this.pending.filter(x => x.id !== this.rejectTarget!.id);
      this.rejectTarget = null;
      if (this.stats) this.stats.pendingApproval--;
    });
  }

  promptSuspend(v: Vehicle) { this.suspendTarget = v; this.suspendReason = ''; }
  confirmSuspend() {
    this.svc.suspendVehicle(this.suspendTarget!.id, this.suspendReason).subscribe(r => {
      const i = this.allVehicles.findIndex(x => x.id === r.data.id);
      if (i >= 0) this.allVehicles[i] = r.data;
      this.suspendTarget = null;
    });
  }

  createSlot() {
    this.svc.createSlot(this.slotForm).subscribe(r => {
      this.slots.push(r.data);
      this.showSlotForm = false;
      this.slotForm = { block: '', slotNumber: '', level: '', type: 'CAR', status: 'AVAILABLE' };
      if (this.stats) this.stats.totalSlots++;
    });
  }

  deleteSlot(s: ParkingSlot) {
    if (!confirm(`Delete slot ${s.block}-${s.slotNumber}?`)) return;
    this.svc.deleteSlot(s.id).subscribe(() => {
      this.slots = this.slots.filter(x => x.id !== s.id);
    });
  }

  unassignVehicle(s: ParkingSlot, vehicleId: number) {
    this.svc.unassignVehicleFromSlot(s.id, vehicleId).subscribe(r => {
      const i = this.slots.findIndex(x => x.id === s.id);
      if (i >= 0) this.slots[i] = r.data;
    });
  }

  startAssign(s: ParkingSlot) {
    this.assignSlot = s;
    this.assignSearch = '';
    if (!this.allVehicles.length) {
      this.svc.getAllVehicles().subscribe(r => this.allVehicles = r.data);
    }
  }

  doAssign(v: Vehicle) {
    this.svc.assignVehicleToSlot(this.assignSlot!.id, v.id).subscribe(r => {
      const i = this.slots.findIndex(x => x.id === this.assignSlot!.id);
      if (i >= 0) this.slots[i] = r.data;
      this.assignSlot = null;
    });
  }

  resolveViolation(v: ParkingViolation) {
    this.svc.resolveViolation(v.id, this.resolveNotes[v.id] || '').subscribe(r => {
      const i = this.violations.findIndex(x => x.id === v.id);
      if (i >= 0) this.violations[i] = r.data;
      if (this.stats) this.stats.openViolations--;
    });
  }

  logExit(vv: VisitorVehicle) {
    this.svc.logVisitorExit(vv.id).subscribe(r => {
      this.currentVisitors = this.currentVisitors.filter(x => x.id !== vv.id);
      const i = this.allVisitorLogs.findIndex(x => x.id === vv.id);
      if (i >= 0) this.allVisitorLogs[i] = r.data;
      if (this.stats) this.stats.visitorsNow--;
    });
  }

  statusLabel(v: Vehicle) { return VEHICLE_STATUS_CONFIG[v.status]?.label || v.status; }
  statusColor(v: Vehicle) { return VEHICLE_STATUS_CONFIG[v.status]?.color || '#9ca3af'; }
  slotStatusLabel(s: string) { return SLOT_STATUS_CONFIG[s as keyof typeof SLOT_STATUS_CONFIG]?.label || s; }
  slotTypeIcon(t: string) { return t==='CAR'?'🚗':t==='BIKE'?'🏍️':t==='VISITOR'?'🚙':'⭐'; }
  typeIcon(t: string)  { return VEHICLE_TYPE_CONFIG[t as keyof typeof VEHICLE_TYPE_CONFIG]?.icon || '🚗'; }
  violationIcon(t: string) { return VIOLATION_TYPE_CONFIG[t as keyof typeof VIOLATION_TYPE_CONFIG]?.icon || '⚠️'; }
  violationLabel(t: string){ return VIOLATION_TYPE_CONFIG[t as keyof typeof VIOLATION_TYPE_CONFIG]?.label || t; }
}
