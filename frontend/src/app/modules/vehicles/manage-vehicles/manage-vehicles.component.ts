import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '@services/vehicle.service';
import {
  Vehicle, ParkingSlot, ParkingViolation, VisitorVehicle, ParkingStats, SlotVehicleInfo,
  VEHICLE_STATUS_CONFIG, VEHICLE_TYPE_CONFIG, SLOT_STATUS_CONFIG, VIOLATION_TYPE_CONFIG
} from '@models/vehicle.model';

@Component({
  selector: 'app-manage-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./manage-vehicles.component.html",
  styleUrls: ["./manage-vehicles.component.scss"]
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
