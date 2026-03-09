import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceDirectoryService } from '@services/service-directory.service';
import { Category } from '@models/service.model';

@Component({
  selector: 'app-add-provider',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/services">← Back</a>
        </div>
        <h1>🔧 Add Service Provider</h1>
        <p>Recommend a trusted worker to the community</p>
      </div>

      <div class="form-container">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <div class="field">
            <label>Full Name *</label>
            <input type="text" formControlName="name" placeholder="e.g. Ramesh Kumar" />
            <span class="err" *ngIf="f['name'].touched && f['name'].errors?.['required']">
              Name is required
            </span>
          </div>

          <div class="field">
            <label>Mobile Number *</label>
            <input type="tel" formControlName="phone" placeholder="10-digit number" maxlength="10" />
            <span class="err" *ngIf="f['phone'].touched && f['phone'].errors?.['required']">
              Phone is required
            </span>
            <span class="err" *ngIf="f['phone'].touched && f['phone'].errors?.['pattern']">
              Enter a valid 10-digit mobile number
            </span>
          </div>

          <div class="field">
            <label>Category *</label>
            <select formControlName="categoryId">
              <option value="">-- Select Category --</option>
              <option *ngFor="let c of categories" [value]="c.id">
                {{ c.icon }} {{ c.name }}
              </option>
            </select>
            <span class="err" *ngIf="f['categoryId'].touched && f['categoryId'].errors?.['required']">
              Please select a category
            </span>
          </div>

          <div class="field">
            <label>Area / Locality <span class="opt">(optional)</span></label>
            <input type="text" formControlName="area"
              placeholder="e.g. Near Main Gate, Sector 5" />
          </div>

          <!-- Photo upload (optional) -->
          <div class="field">
            <label>Photo <span class="opt">(optional, max 5MB)</span></label>
            <div class="photo-picker" (click)="photoInput.click()">
              <img *ngIf="photoPreview" [src]="photoPreview" class="preview-img" />
              <div *ngIf="!photoPreview" class="photo-placeholder">
                <span>📷</span>
                <span>Tap to add photo</span>
              </div>
            </div>
            <input #photoInput type="file" accept="image/*"
              (change)="onPhotoSelected($event)" hidden />
            <span class="err" *ngIf="photoError">{{ photoError }}</span>
          </div>

          <div class="warning" *ngIf="duplicateWarning">
            ⚠️ A provider with this phone number might already exist. Please check
            the directory before adding.
          </div>

          <div class="err-banner" *ngIf="submitError">{{ submitError }}</div>

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

    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p  { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .form-container { padding: 20px 16px; }

    .field { margin-bottom: 18px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .opt { font-weight: 400; color: #999; font-size: 12px; }

    input, select {
      width: 100%; padding: 12px 14px; border: 1.5px solid #ddd; border-radius: 10px;
      font-size: 15px; outline: none; background: white; box-sizing: border-box; color: #1a1a2e;
    }
    input:focus, select:focus { border-color: #0f3460; }
    select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
    }

    .photo-picker {
      border: 2px dashed #ddd; border-radius: 12px; height: 120px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; overflow: hidden; background: white;
    }
    .photo-picker:hover { border-color: #0f3460; }
    .preview-img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #aaa; }
    .photo-placeholder span:first-child { font-size: 32px; }
    .photo-placeholder span:last-child  { font-size: 13px; }

    .err { color: #dc2626; font-size: 12px; margin-top: 4px; display: block; }
    .warning {
      background: #fef3c7; border: 1px solid #f59e0b;
      border-radius: 10px; padding: 10px 14px; font-size: 13px;
      color: #92400e; margin-bottom: 16px;
    }
    .err-banner {
      background: #fee2e2; border: 1px solid #ef4444;
      border-radius: 10px; padding: 10px 14px; font-size: 13px;
      color: #991b1b; margin-bottom: 16px;
    }

    .btn-submit {
      width: 100%; background: #0f3460; color: white; border: none;
      padding: 14px; border-radius: 12px; font-size: 16px;
      font-weight: 600; cursor: pointer; margin-top: 8px;
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
  photoPreview: string | null = null;
  photoFile: File | null = null;
  photoError = '';

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

    this.form.get('phone')?.valueChanges.subscribe(() => {
      this.duplicateWarning = false;
    });

    this.svc.getCategories().subscribe({ next: r => this.categories = r.data });
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoError = '';
    if (!file.type.startsWith('image/')) {
      this.photoError = 'Only image files are allowed';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'Photo must be under 5MB';
      return;
    }
    this.photoFile = file;
    const reader = new FileReader();
    reader.onload = e => this.photoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.submitError = '';

    this.svc.createProvider({
      name:       this.f['name'].value.trim(),
      phone:      this.f['phone'].value.trim(),
      categoryId: Number(this.f['categoryId'].value),
      area:       this.f['area'].value.trim() || undefined
    }).subscribe({
      next: r => {
        const providerId = r.data.id;
        // If photo selected, upload it then navigate
        if (this.photoFile) {
          this.svc.uploadPhoto(providerId, this.photoFile).subscribe({
            next: () => this.router.navigate(['/services', providerId]),
            error: () => this.router.navigate(['/services', providerId]) // navigate anyway
          });
        } else {
          this.router.navigate(['/services', providerId]);
        }
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
