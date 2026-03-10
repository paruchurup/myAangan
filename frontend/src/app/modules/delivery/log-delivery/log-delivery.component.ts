import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DeliveryService } from '@services/delivery.service';
import { DELIVERY_TYPES, Delivery } from '@models/delivery.model';

@Component({
  selector: 'app-log-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./log-delivery.component.html",
  styleUrls: ["./log-delivery.component.scss"]
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

  constructor(private fb: FormBuilder, private deliveryService: DeliveryService) {}

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
        this.deliveryService.searchFlats(val).subscribe({
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
    this.deliveryService.logDelivery({
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
