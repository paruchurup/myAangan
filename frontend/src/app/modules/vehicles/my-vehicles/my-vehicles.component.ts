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
  templateUrl: "./my-vehicles.component.html",
  styleUrls: ["./my-vehicles.component.scss"]
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
