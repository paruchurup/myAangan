import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VehicleService } from '@services/vehicle.service';
import { Vehicle, VEHICLE_STATUS_CONFIG, VEHICLE_TYPE_CONFIG } from '@models/vehicle.model';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <button class="add-btn" (click)="showForm=!showForm">{{ showForm ? '✕ Cancel' : '+ Register' }}</button>
    </div>
    <h1>🚗 My Vehicles</h1>
    <p>Manage your registered vehicles</p>
  </div>

  <!-- Register form -->
  <div class="form-panel" *ngIf="showForm">
    <h2>Register Vehicle</h2>

    <div class="type-row">
      <button *ngFor="let t of vehicleTypes" class="type-pill"
        [class.active]="form.type===t.value" (click)="form.type=t.value">
        {{ t.icon }} {{ t.label }}
      </button>
    </div>

    <div class="field-grid">
      <div class="field">
        <label>Plate Number *</label>
        <input class="plate-input" [(ngModel)]="form.plateNumber" placeholder="KA01AB1234"
          style="text-transform:uppercase" maxlength="20" />
      </div>
      <div class="field">
        <label>Make *</label>
        <input [(ngModel)]="form.make" placeholder="e.g. Maruti" />
      </div>
      <div class="field">
        <label>Model *</label>
        <input [(ngModel)]="form.model" placeholder="e.g. Swift" />
      </div>
      <div class="field">
        <label>Colour</label>
        <input [(ngModel)]="form.colour" placeholder="e.g. Red" />
      </div>
      <div class="field">
        <label>Year</label>
        <input [(ngModel)]="form.year" placeholder="2022" maxlength="4" />
      </div>
    </div>

    <div class="photo-row">
      <label>Vehicle Photo (optional)</label>
      <div class="photo-drop" (click)="photoInput.click()">
        <span *ngIf="!photoFile">📷 Tap to add photo</span>
        <span *ngIf="photoFile">✅ {{ photoFile.name }}</span>
      </div>
      <input #photoInput type="file" accept="image/*" style="display:none" (change)="onPhoto($event)" />
    </div>

    <div class="err" *ngIf="formError">{{ formError }}</div>
    <button class="submit-btn" (click)="register()" [disabled]="submitting">
      {{ submitting ? 'Registering…' : '📋 Submit for Approval' }}
    </button>
  </div>

  <!-- Claim slot panel -->
  <div class="form-panel claim-panel" *ngIf="claimVehicle">
    <h2>🅿️ Claim Parking Slot for {{ claimVehicle.plateNumber }}</h2>
    <p class="claim-hint">
      Cars: enter your fixed slot (max 1 car per slot).<br>
      Bikes/scooters: enter a slot number to share it with other vehicles.
    </p>
    <div class="field-grid">
      <div class="field">
        <label>Block *</label>
        <input [(ngModel)]="claimForm.block" placeholder="e.g. A" maxlength="5" style="text-transform:uppercase" />
      </div>
      <div class="field">
        <label>Slot Number *</label>
        <input [(ngModel)]="claimForm.slotNumber" placeholder="e.g. 12" maxlength="10" />
      </div>
      <div class="field">
        <label>Level / Floor</label>
        <input [(ngModel)]="claimForm.level" placeholder="e.g. Ground, B1" maxlength="20" />
      </div>
      <div class="field">
        <label>Slot Type *</label>
        <select [(ngModel)]="claimForm.type" class="sel">
          <option value="CAR">🚗 Car</option>
          <option value="BIKE">🏍️ Bike / Scooter</option>
          <option value="EV">⚡ EV</option>
          <option value="COMPACT">📦 Compact</option>
        </select>
      </div>
    </div>
    <div class="err" *ngIf="claimError">{{ claimError }}</div>
    <div class="claim-actions">
      <button class="cancel-btn" (click)="closeClaimForm()">Cancel</button>
      <button class="submit-btn" (click)="submitClaim()" [disabled]="claimSubmitting">
        {{ claimSubmitting ? 'Claiming…' : '✅ Confirm Slot' }}
      </button>
    </div>
  </div>

  <!-- Vehicle list -->
  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="vehicles" *ngIf="!loading">
    <div class="empty-state" *ngIf="!vehicles.length">
      <div class="es-icon">🅿️</div>
      <p>No vehicles registered yet</p>
      <small>Register your vehicle to get a parking slot assigned</small>
      <button class="es-btn" (click)="showForm=true">+ Register Now</button>
    </div>

    <div class="vehicle-card" *ngFor="let v of vehicles">
      <div class="vc-left" [style.background]="statusColor(v)"></div>
      <div class="vc-body">
        <div class="vc-top">
          <span class="plate">{{ v.plateNumber }}</span>
          <span class="status-badge"
            [style.background]="statusBg(v)" [style.color]="statusColor(v)">
            {{ statusLabel(v) }}
          </span>
        </div>
        <div class="vc-desc">
          <span class="type-icon">{{ typeIcon(v.type) }}</span>
          {{ v.colour }} {{ v.make }} {{ v.model }}
          <span class="year" *ngIf="v.year">· {{ v.year }}</span>
        </div>
        <div class="vc-slot" *ngIf="v.assignedSlotLabel">
          🅿️ <strong>{{ v.assignedSlotLabel }}</strong>
        </div>
        <div class="vc-slot pending-slot" *ngIf="!v.assignedSlotLabel && v.status==='APPROVED'">
          🅿️ No slot assigned yet —
          <button class="claim-btn" (click)="openClaimForm(v)">Claim your slot</button>
        </div>
        <div class="vc-note" *ngIf="v.adminNote">
          📝 {{ v.adminNote }}
        </div>
        <div class="vc-foot">
          <span class="vc-date">Registered {{ v.createdAt | date:'MMM d, y' }}</span>
          <span class="vc-violations" *ngIf="v.violationCount > 0">
            ⚠️ {{ v.violationCount }} violation{{ v.violationCount > 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121}

    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .add-btn{background:#f59e0b;border:none;color:#111;padding:8px 16px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;cursor:pointer}

    .form-panel{background:#252525;border-bottom:1px solid #333;padding:16px;display:flex;flex-direction:column;gap:12px}
    h2{font-family:'Oswald',sans-serif;font-size:14px;font-weight:500;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;margin:0}
    .type-row{display:flex;gap:8px;flex-wrap:wrap}
    .type-pill{background:#333;border:1.5px solid #444;color:#9ca3af;padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;transition:all 0.15s}
    .type-pill.active{background:#f59e0b;border-color:#f59e0b;color:#111}
    .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .field{display:flex;flex-direction:column;gap:4px}
    label{font-size:11px;color:#6b7280;letter-spacing:0.5px;text-transform:uppercase;font-family:'Oswald',sans-serif}
    input{background:#333;border:1.5px solid #444;border-radius:6px;color:#e8e8e8;padding:9px 12px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box}
    input:focus{border-color:#f59e0b}
    .plate-input{font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:2px;font-weight:600}
    .photo-row{display:flex;flex-direction:column;gap:6px}
    .photo-drop{background:#333;border:1.5px dashed #555;border-radius:8px;padding:14px;text-align:center;cursor:pointer;font-size:13px;color:#6b7280;transition:border-color 0.15s}
    .photo-drop:hover{border-color:#f59e0b}
    .err{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:10px;border-radius:6px;font-size:13px}
    .submit-btn{background:#f59e0b;border:none;color:#111;padding:13px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;cursor:pointer;width:100%}
    .submit-btn:disabled{opacity:0.5}

    .loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    .vehicles{padding:14px;display:flex;flex-direction:column;gap:12px}
    .empty-state{text-align:center;padding:50px 20px}
    .es-icon{font-size:48px;margin-bottom:12px}
    .empty-state p{font-family:'Oswald',sans-serif;font-size:20px;color:#9ca3af;margin:0 0 6px}
    .empty-state small{font-size:13px;color:#4b5563;display:block;margin-bottom:20px}
    .es-btn{background:#f59e0b;border:none;color:#111;padding:10px 24px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.5px}

    .vehicle-card{background:#252525;border:1px solid #333;border-radius:10px;overflow:hidden;display:flex}
    .vc-left{width:5px;flex-shrink:0}
    .vc-body{padding:14px;flex:1}
    .vc-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
    .plate{font-family:'IBM Plex Mono',monospace;font-size:17px;font-weight:600;color:#fff;letter-spacing:2px;background:#333;padding:4px 10px;border-radius:4px;border:1px solid #555}
    .status-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.5px;font-family:'Oswald',sans-serif}
    .vc-desc{font-size:13px;color:#9ca3af;margin-bottom:6px;display:flex;align-items:center;gap:6px}
    .type-icon{font-size:16px}
    .year{color:#4b5563}
    .vc-slot{font-size:13px;color:#f59e0b;margin-bottom:4px}
    .pending-slot{color:#6b7280}
    .vc-note{font-size:12px;color:#9ca3af;background:#333;border-radius:4px;padding:6px 10px;margin-bottom:4px}
    .vc-foot{display:flex;justify-content:space-between;font-size:11px;color:#4b5563;margin-top:6px}
    .vc-violations{color:#f87171;font-weight:600}

    .claim-btn{background:transparent;border:1px solid #f59e0b;color:#f59e0b;padding:2px 10px;border-radius:4px;font-size:12px;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;margin-left:6px}
    .claim-btn:hover{background:#f59e0b;color:#111}

    .claim-panel{border-top:2px solid #f59e0b}
    .claim-hint{font-size:12px;color:#9ca3af;margin:0 0 4px}
    .sel{background:#333;border:1.5px solid #444;border-radius:6px;color:#e8e8e8;padding:9px 12px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box}
    .sel:focus{border-color:#f59e0b}
    .claim-actions{display:flex;gap:10px}
    .cancel-btn{flex:1;background:#333;border:1px solid #444;color:#9ca3af;padding:13px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;cursor:pointer}
  `]
})
export class MyVehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  loading = true;
  showForm = false;
  submitting = false;
  formError = '';
  photoFile: File | null = null;

  form = { type: 'CAR', plateNumber: '', make: '', model: '', colour: '', year: '' };

  // Claim slot
  claimVehicle: Vehicle | null = null;
  claimForm = { block: '', slotNumber: '', level: '', type: 'CAR' };
  claimError = '';
  claimSubmitting = false;

  vehicleTypes = [
    { value: 'CAR',    icon: '🚗', label: 'Car' },
    { value: 'BIKE',   icon: '🏍️', label: 'Bike' },
    { value: 'SCOOTER',icon: '🛵', label: 'Scooter' },
    { value: 'OTHER',  icon: '🚙', label: 'Other' },
  ];

  constructor(private svc: VehicleService) {}

  ngOnInit() {
    this.svc.getMyVehicles().subscribe({
      next: r => { this.vehicles = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  onPhoto(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.photoFile = f;
  }

  register() {
    if (!this.form.plateNumber.trim() || !this.form.make.trim() || !this.form.model.trim()) {
      this.formError = 'Plate number, make, and model are required.';
      return;
    }
    this.submitting = true; this.formError = '';

    const data = { ...this.form, plateNumber: this.form.plateNumber.toUpperCase().replace(/\s/g,'') };
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (this.photoFile) fd.append('photo', this.photoFile);

    this.svc.registerVehicle(fd).subscribe({
      next: r => {
        this.vehicles.unshift(r.data);
        this.showForm = false;
        this.form = { type: 'CAR', plateNumber: '', make: '', model: '', colour: '', year: '' };
        this.photoFile = null;
        this.submitting = false;
      },
      error: e => { this.formError = e.error?.message || 'Registration failed.'; this.submitting = false; }
    });
  }

  openClaimForm(v: Vehicle) {
    this.claimVehicle = v;
    this.claimForm = { block: '', slotNumber: '', level: '', type: v.type || 'CAR' };
    this.claimError = '';
    this.showForm = false;
  }

  closeClaimForm() { this.claimVehicle = null; this.claimError = ''; }

  submitClaim() {
    if (!this.claimForm.block.trim() || !this.claimForm.slotNumber.trim()) {
      this.claimError = 'Block and slot number are required.';
      return;
    }
    this.claimSubmitting = true;
    this.claimError = '';

    const body = {
      vehicleId: this.claimVehicle!.id,
      block: this.claimForm.block.toUpperCase(),
      slotNumber: this.claimForm.slotNumber,
      level: this.claimForm.level || null,
      type: this.claimForm.type,
    };

    this.svc.claimMySlot(body).subscribe({
      next: r => {
        // Update the vehicle card in the list with the new slot label
        const v = this.vehicles.find(x => x.id === this.claimVehicle!.id);
        if (v) v.assignedSlotLabel = r.data.label || `${r.data.block}-${r.data.slotNumber}`;
        this.claimSubmitting = false;
        this.closeClaimForm();
      },
      error: e => {
        this.claimError = e.error?.message || 'Could not claim slot. Please try again.';
        this.claimSubmitting = false;
      }
    });
  }

  statusLabel(v: Vehicle) { return VEHICLE_STATUS_CONFIG[v.status]?.label || v.status; }
  statusColor(v: Vehicle) { return VEHICLE_STATUS_CONFIG[v.status]?.color || '#9ca3af'; }
  statusBg(v: Vehicle)    { return VEHICLE_STATUS_CONFIG[v.status]?.bg    || '#f3f4f6'; }
  typeIcon(t: string)     { return VEHICLE_TYPE_CONFIG[t as keyof typeof VEHICLE_TYPE_CONFIG]?.icon || '🚗'; }
}
