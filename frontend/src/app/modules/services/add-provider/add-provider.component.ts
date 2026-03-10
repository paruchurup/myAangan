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
  templateUrl: "./add-provider.component.html",
  styleUrls: ["./add-provider.component.scss"]
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
