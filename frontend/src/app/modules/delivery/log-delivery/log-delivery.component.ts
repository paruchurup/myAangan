import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DELIVERY_TYPES, Delivery } from '../../../core/models/delivery.model';

@Component({
  selector: 'app-log-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" routerLink="/delivery/guard">← Back</button>
        <h1>📦 Log New Delivery</h1>
        <p>Record a delivery arrival at the gate</p>
      </div>

      <div class="form-wrap">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Flat Number with autocomplete -->
          <div class="field">
            <label>Flat Number *</label>
            <div class="flat-input-wrap">
              <input type="text" formControlName="flatNumber"
                placeholder="e.g. 101 or A-101"
                autocomplete="off"
                (input)="onFlatInput()"
                (blur)="hideSuggestions()" />
              <div class="suggestions" *ngIf="flatSuggestions.length > 0">
                <div class="suggestion" *ngFor="let s of flatSuggestions"
                  (mousedown)="$event.preventDefault()"
                  (click)="selectFlat(s)">
                  🏠 {{ displayLabel(s) }}
                </div>
              </div>
            </div>
            <span class="err" *ngIf="f['flatNumber'].touched && f['flatNumber'].errors?.['required']">
              Flat number is required
            </span>
            <!-- Resident resolution feedback -->
            <div class="resident-found" *ngIf="residentPreview">
              ✅ {{ residentPreview }}
            </div>
            <div class="resident-not-found" *ngIf="residentNotFound">
              ⚠️ No resident found for this flat — delivery will still be logged
            </div>
          </div>

          <!-- Block (optional) -->
          <div class="field">
            <label>Block <span class="opt">(optional)</span></label>
            <input type="text" formControlName="block" placeholder="e.g. A, B, C" maxlength="5" />
          </div>

          <!-- Delivery Type -->
          <div class="field">
            <label>Delivery Type *</label>
            <div class="type-grid">
              <button type="button"
                *ngFor="let t of deliveryTypes"
                class="type-btn"
                [class.selected]="f['deliveryType'].value === t.value"
                (click)="selectType(t.value)">
                {{ t.label }}
              </button>
            </div>
            <span class="err" *ngIf="f['deliveryType'].touched && f['deliveryType'].errors?.['required']">
              Please select delivery type
            </span>
          </div>

          <!-- Sender Name -->
          <div class="field">
            <label>Sender / Company <span class="opt">(optional)</span></label>
            <input type="text" formControlName="senderName"
              placeholder="e.g. Amazon, Swiggy, DTDC" />
          </div>

          <!-- Description -->
          <div class="field">
            <label>Description <span class="opt">(optional)</span></label>
            <input type="text" formControlName="description"
              placeholder="e.g. 2 boxes, envelope" />
          </div>

          <div class="err-banner" *ngIf="submitError">{{ submitError }}</div>

          <button type="submit" class="btn-submit"
            [disabled]="form.invalid || submitting">
            {{ submitting ? 'Logging...' : '✅ Log Delivery' }}
          </button>
        </form>
      </div>

      <!-- Success state -->
      <div class="success-card" *ngIf="lastLogged">
        <div class="success-icon">✅</div>
        <h3>Delivery Logged!</h3>
        <div class="success-details">
          <div class="sd-row">
            <span>Flat</span>
            <strong>{{ lastLogged.block ? lastLogged.block + '-' : '' }}{{ lastLogged.flatNumber }}</strong>
          </div>
          <div class="sd-row">
            <span>Resident</span>
            <strong>{{ lastLogged.residentFound ? lastLogged.residentName : 'Not found' }}</strong>
          </div>
          <div class="sd-row">
            <span>Type</span>
            <strong>{{ lastLogged.deliveryTypeLabel }}</strong>
          </div>
          <div class="sd-row" *ngIf="lastLogged.senderName">
            <span>From</span>
            <strong>{{ lastLogged.senderName }}</strong>
          </div>
        </div>
        <button class="btn-another" (click)="logAnother()">+ Log Another</button>
      </div>

    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      padding: 16px 16px 24px; color: white;
    }
    .back-btn {
      background: rgba(255,255,255,0.15); border: none; color: white;
      padding: 6px 12px; border-radius: 20px; font-size: 13px;
      cursor: pointer; margin-bottom: 12px; display: inline-block;
    }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; }
    .page-header p  { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .form-wrap { padding: 20px 16px; }
    .field { margin-bottom: 18px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .opt  { font-weight: 400; color: #999; font-size: 12px; }

    input {
      width: 100%; padding: 12px 14px; border: 1.5px solid #ddd; border-radius: 10px;
      font-size: 15px; outline: none; background: white; box-sizing: border-box; color: #1a1a2e;
    }
    input:focus { border-color: #0f3460; }

    .flat-input-wrap { position: relative; }
    .suggestions {
      position: absolute; top: 100%; left: 0; right: 0; background: white;
      border: 1.5px solid #0f3460; border-top: none; border-radius: 0 0 10px 10px;
      z-index: 100; max-height: 200px; overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .suggestion {
      padding: 10px 14px; font-size: 14px; cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
    }
    .suggestion:hover { background: #f0f4ff; }
    .suggestion:last-child { border-bottom: none; }

    .resident-found {
      margin-top: 6px; font-size: 13px; color: #166534;
      background: #dcfce7; padding: 6px 10px; border-radius: 8px;
    }
    .resident-not-found {
      margin-top: 6px; font-size: 13px; color: #92400e;
      background: #fef3c7; padding: 6px 10px; border-radius: 8px;
    }

    .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .type-btn {
      padding: 10px 6px; border: 1.5px solid #ddd; border-radius: 10px;
      background: white; font-size: 13px; cursor: pointer; text-align: center;
      transition: all 0.15s; color: #555;
    }
    .type-btn.selected { background: #0f3460; color: white; border-color: #0f3460; }

    .err { color: #dc2626; font-size: 12px; margin-top: 4px; display: block; }
    .err-banner {
      background: #fee2e2; border: 1px solid #ef4444; border-radius: 10px;
      padding: 10px 14px; font-size: 13px; color: #991b1b; margin-bottom: 16px;
    }

    .btn-submit {
      width: 100%; background: #0f3460; color: white; border: none;
      padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;
    }
    .btn-submit:disabled { background: #ccc; cursor: not-allowed; }

    .success-card {
      margin: 0 16px; background: white; border-radius: 16px; padding: 24px;
      text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .success-icon { font-size: 48px; margin-bottom: 8px; }
    .success-card h3 { font-size: 20px; color: #166534; margin: 0 0 16px; }
    .success-details { text-align: left; margin-bottom: 20px; }
    .sd-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;
    }
    .sd-row span { color: #888; }
    .btn-another {
      width: 100%; background: #0f3460; color: white; border: none;
      padding: 12px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;
    }
  `]
})
export class LogDeliveryComponent implements OnInit {
  form!: FormGroup;
  deliveryTypes = DELIVERY_TYPES;
  flatSuggestions: string[] = [];
  residentPreview = '';
  residentNotFound = false;
  submitting = false;
  submitError = '';
  lastLogged: Delivery | null = null;
  private flatTimer: any;

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private svc: DeliveryService) {}

  ngOnInit() {
    this.form = this.fb.group({
      flatNumber:   ['', Validators.required],
      block:        [''],
      deliveryType: ['', Validators.required],
      senderName:   [''],
      description:  ['']
    });
  }

  onFlatInput() {
    clearTimeout(this.flatTimer);
    const val = this.f['flatNumber'].value;
    this.residentPreview = '';
    this.residentNotFound = false;
    if (val && val.length >= 1) {
      this.flatTimer = setTimeout(() => {
        this.svc.searchFlats(val).subscribe({
          next: r => this.flatSuggestions = r.data
        });
      }, 300);
    } else {
      this.flatSuggestions = [];
    }
  }

  // Show just the human-readable part before |||
  displayLabel(suggestion: string): string {
    return suggestion.split('|||')[0];
  }

  selectFlat(suggestion: string) {
    // Format: "A-1108 (Praveena Paruchuru)|||A|||1108"
    const parts = suggestion.split('|||');
    if (parts.length === 3) {
      const block    = parts[1];  // empty string if no block
      const flatNum  = parts[2];
      // Extract resident name from the display label "A-1108 (Praveena)"
      const nameMatch = parts[0].match(/\((.+)\)$/);
      const residentName = nameMatch ? nameMatch[1] : '';

      this.form.patchValue({
        flatNumber: flatNum,
        block:      block || ''
      });
      this.residentPreview  = `Resident: ${residentName}`;
      this.residentNotFound = false;
    }
    this.flatSuggestions = [];
  }

  hideSuggestions() {
    // Small delay still needed for keyboard navigation, but mousedown preventDefault
    // handles the click case — blur fires after click is processed
    setTimeout(() => { this.flatSuggestions = []; }, 150);
  }

  selectType(value: string) {
    this.form.patchValue({ deliveryType: value });
    this.form.get('deliveryType')?.markAsTouched();
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.submitError = '';

    const v = this.form.value;
    this.svc.logDelivery({
      flatNumber:   v.flatNumber.trim().toUpperCase(),
      block:        v.block?.trim().toUpperCase() || undefined,
      deliveryType: v.deliveryType,
      senderName:   v.senderName?.trim() || undefined,
      description:  v.description?.trim() || undefined
    }).subscribe({
      next: r => {
        this.submitting = false;
        this.lastLogged = r.data;
        if (!r.data.residentFound) this.residentNotFound = true;
        this.form.reset();
        this.residentPreview = '';
      },
      error: err => {
        this.submitting = false;
        this.submitError = err.error?.message || 'Failed to log delivery';
      }
    });
  }

  logAnother() {
    this.lastLogged = null;
    this.residentNotFound = false;
  }
}
