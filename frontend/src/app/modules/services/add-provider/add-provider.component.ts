import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceDirectoryService } from '../../../core/services/service-directory.service';
import { Category } from '../../../core/models/service.model';

@Component({
  selector: 'app-add-provider',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="page">

      <div class="page-header">
        <button class="back-btn" routerLink="/services">← Back</button>
        <h1>Add Service Provider</h1>
        <p>Help your community find trusted workers</p>
      </div>

      <div class="form-container">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Name -->
          <div class="field">
            <label>Full Name *</label>
            <input type="text" formControlName="name" placeholder="e.g. Ramesh Kumar" />
            <span class="error" *ngIf="f['name'].touched && f['name'].errors?.['required']">
              Name is required
            </span>
          </div>

          <!-- Phone -->
          <div class="field">
            <label>Mobile Number *</label>
            <input type="tel" formControlName="phone" placeholder="10-digit mobile number" />
            <span class="error" *ngIf="f['phone'].touched && f['phone'].errors?.['required']">
              Phone is required
            </span>
            <span class="error" *ngIf="f['phone'].touched && f['phone'].errors?.['pattern']">
              Enter a valid 10-digit mobile number
            </span>
          </div>

          <!-- Category -->
          <div class="field">
            <label>Category *</label>
            <select formControlName="categoryId">
              <option value="">-- Select Category --</option>
              <option *ngFor="let c of categories" [value]="c.id">
                {{ c.icon }} {{ c.name }}
              </option>
            </select>
            <span class="error" *ngIf="f['categoryId'].touched && f['categoryId'].errors?.['required']">
              Please select a category
            </span>
          </div>

          <!-- Area -->
          <div class="field">
            <label>Area / Locality <span class="optional">(optional)</span></label>
            <input type="text" formControlName="area"
              placeholder="e.g. Near Main Gate, Sector 5" />
          </div>

          <!-- Duplicate warning -->
          <div class="warning" *ngIf="duplicateWarning">
            ⚠️ A provider with this phone number might already exist. Please check the
            directory before adding.
          </div>

          <!-- Error -->
          <div class="error-banner" *ngIf="submitError">{{ submitError }}</div>

          <button type="submit" class="btn-submit"
            [disabled]="form.invalid || submitting">
            {{ submitting ? 'Adding...' : '✅ Add to Directory' }}
          </button>

        </form>
      </div>

    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      padding: 16px 16px 28px; color: white; position: relative;
    }
    .back-btn {
      background: rgba(255,255,255,0.15); border: none; color: white;
      padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer;
      margin-bottom: 12px; display: inline-block;
    }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .form-container { padding: 20px 16px; }

    .field { margin-bottom: 18px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .optional { font-weight: 400; color: #999; font-size: 12px; }

    input, select, textarea {
      width: 100%; padding: 12px 14px; border: 1.5px solid #ddd; border-radius: 10px;
      font-size: 15px; outline: none; background: white; box-sizing: border-box;
      font-family: inherit; color: #1a1a2e;
    }
    input:focus, select:focus { border-color: #0f3460; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

    .error { color: #dc2626; font-size: 12px; margin-top: 4px; display: block; }
    .warning {
      background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px;
      padding: 10px 14px; font-size: 13px; color: #92400e; margin-bottom: 16px;
    }
    .error-banner {
      background: #fee2e2; border: 1px solid #ef4444; border-radius: 10px;
      padding: 10px 14px; font-size: 13px; color: #991b1b; margin-bottom: 16px;
    }

    .btn-submit {
      width: 100%; background: #0f3460; color: white; border: none;
      padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 600;
      cursor: pointer; margin-top: 8px;
    }
    .btn-submit:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class AddProviderComponent implements OnInit {
  form!: FormGroup;
  categories: Category[] = [];
  submitting = false;
  submitError = '';
  duplicateWarning = false;

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private svc: ServiceDirectoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name:       ['', [Validators.required, Validators.minLength(2)]],
      phone:      ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      categoryId: ['', Validators.required],
      area:       ['']
    });

    this.form.get('phone')?.valueChanges.subscribe(val => {
      this.duplicateWarning = false;
    });

    this.svc.getCategories().subscribe({
      next: r => this.categories = r.data
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.submitError = '';

    this.svc.createProvider({
      name: this.f['name'].value.trim(),
      phone: this.f['phone'].value.trim(),
      categoryId: Number(this.f['categoryId'].value),
      area: this.f['area'].value.trim() || undefined
    }).subscribe({
      next: r => {
        this.router.navigate(['/services', r.data.id]);
      },
      error: err => {
        this.submitting = false;
        const msg = err.error?.message || 'Failed to add provider';
        if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('exists')) {
          this.duplicateWarning = true;
        }
        this.submitError = msg;
      }
    });
  }
}
