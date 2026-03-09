import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { AuthService } from '@services/auth.service';
import { COMPLAINT_CATEGORIES } from '@models/complaint.model';

@Component({
  selector: 'app-raise-complaint',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
<div class="page">
  <div class="page-header">
    <button class="back-btn" routerLink="/complaints/my">← Back</button>
    <h1>📝 Raise Complaint</h1>
    <p>Report an issue to the Facility Manager</p>
  </div>

  <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">
    <div class="section">
      <label class="section-label">Category *</label>
      <div class="category-grid">
        <button type="button" *ngFor="let cat of categories"
          class="cat-btn" [class.selected]="form.get('category')?.value === cat.value"
          (click)="selectCategory(cat.value)">{{ cat.label }}</button>
      </div>
      <div class="err" *ngIf="form.get('category')?.touched && form.get('category')?.invalid">
        Please select a category</div>
    </div>

    <div class="section">
      <label class="section-label">Title *</label>
      <input type="text" formControlName="title"
        placeholder="Brief summary (e.g. Water leakage in basement)" />
      <div class="err" *ngIf="form.get('title')?.touched && form.get('title')?.invalid">
        Title is required (max 200 characters)</div>
    </div>

    <div class="section">
      <label class="section-label">Description *</label>
      <textarea formControlName="description" rows="4"
        placeholder="Describe the issue — when it started, frequency, prior attempts to fix it..."></textarea>
      <div class="char-count">{{ form.get('description')?.value?.length || 0 }} / 2000</div>
      <div class="err" *ngIf="form.get('description')?.touched && form.get('description')?.invalid">
        Description is required</div>
    </div>

    <div class="section">
      <label class="section-label">Location <span class="opt">(optional)</span></label>
      <div class="row-2">
        <input type="text" formControlName="flatNumber" placeholder="Flat No." />
        <input type="text" formControlName="block" placeholder="Block" />
      </div>
      <input type="text" formControlName="locationDescription" style="margin-top:8px;"
        placeholder="e.g. Ground floor corridor, Near lift" />
    </div>

    <div class="section">
      <label class="section-label">Attachments <span class="opt">(max 10, 5MB each)</span></label>
      <div class="upload-zone" (click)="fileInput.click()"
        (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
        <div class="upload-icon">📎</div>
        <div class="upload-text">Tap to upload photos, PDFs, videos or documents</div>
        <div class="upload-sub">JPG, PNG, PDF, MP4, DOC, XLS</div>
      </div>
      <input #fileInput type="file" multiple hidden
        accept="image/*,.pdf,video/mp4,.doc,.docx,.xls,.xlsx"
        (change)="onFileChange($event)" />
      <div class="file-list" *ngIf="selectedFiles.length > 0">
        <div class="file-item" *ngFor="let f of selectedFiles; let i = index">
          <span class="file-icon">{{ fileIcon(f) }}</span>
          <span class="file-name">{{ f.name }}</span>
          <span class="file-size">{{ formatSize(f.size) }}</span>
          <button type="button" class="remove-file" (click)="removeFile(i)">✕</button>
        </div>
      </div>
      <div class="err" *ngIf="fileError">{{ fileError }}</div>
    </div>

    <div class="err-banner" *ngIf="submitError">{{ submitError }}</div>
    <button type="submit" class="btn-submit" [disabled]="submitting || form.invalid">
      {{ submitting ? 'Submitting...' : '🚀 Submit Complaint' }}
    </button>
  </form>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;margin-bottom:12px;display:inline-block}
    .page-header h1{font-size:22px;margin:0 0 4px}.page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .form-body{padding:16px;display:flex;flex-direction:column;gap:14px}
    .section{background:white;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
    .section-label{font-size:14px;font-weight:700;color:#1a1a2e;display:block;margin-bottom:10px}
    .opt{font-weight:400;color:#999;font-size:12px}
    .category-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .cat-btn{padding:10px 8px;border:1.5px solid #e5e7eb;border-radius:10px;background:white;font-size:12px;cursor:pointer;text-align:left;color:#555;transition:all 0.15s}
    .cat-btn.selected{background:#0f3460;color:white;border-color:#0f3460}
    input[type="text"],textarea{width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;outline:none;background:#fafafa;box-sizing:border-box;font-family:inherit;color:#1a1a2e}
    textarea{resize:vertical}
    input:focus,textarea:focus{border-color:#0f3460;background:white}
    .char-count{font-size:11px;color:#ccc;text-align:right;margin-top:4px}
    .row-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .err{color:#dc2626;font-size:12px;margin-top:6px}
    .err-banner{background:#fee2e2;border-radius:10px;padding:12px 16px;font-size:14px;color:#991b1b}
    .upload-zone{border:2px dashed #c7d2fe;border-radius:12px;padding:24px 16px;text-align:center;cursor:pointer;background:#f8f9ff;transition:all 0.2s}
    .upload-zone:hover{border-color:#0f3460;background:#eef2ff}
    .upload-icon{font-size:32px;margin-bottom:8px}.upload-text{font-size:14px;font-weight:600;color:#3730a3;margin-bottom:4px}.upload-sub{font-size:12px;color:#888}
    .file-list{margin-top:12px;display:flex;flex-direction:column;gap:6px}
    .file-item{display:flex;align-items:center;gap:8px;background:#f8f9ff;border-radius:8px;padding:8px 10px}
    .file-icon{font-size:18px}.file-name{flex:1;font-size:13px;color:#1a1a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .file-size{font-size:11px;color:#888;flex-shrink:0}
    .remove-file{background:#fee2e2;border:none;color:#dc2626;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:11px;flex-shrink:0}
    .btn-submit{width:100%;background:#e94560;color:white;border:none;padding:14px;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer}
    .btn-submit:disabled{background:#ccc;cursor:not-allowed}
  `]
})
export class RaiseComplaintComponent implements OnInit {
  form!: FormGroup;
  categories = COMPLAINT_CATEGORIES;
  selectedFiles: File[] = [];
  fileError = '';
  submitting = false;
  submitError = '';

  constructor(private fb: FormBuilder, private svc: ComplaintService,
              private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    this.form = this.fb.group({
      category:            ['', Validators.required],
      title:               ['', [Validators.required, Validators.maxLength(200)]],
      description:         ['', [Validators.required, Validators.maxLength(2000)]],
      flatNumber:          [user?.flatNumber || ''],
      block:               [user?.block || ''],
      locationDescription: ['']
    });
  }

  selectCategory(v: string) {
    this.form.patchValue({ category: v });
    this.form.get('category')?.markAsTouched();
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files) this.addFiles(Array.from(e.dataTransfer.files));
  }

  addFiles(files: File[]) {
    this.fileError = '';
    for (const f of files) {
      if (this.selectedFiles.length >= 10) { this.fileError = 'Maximum 10 files allowed'; break; }
      if (f.size > 5 * 1024 * 1024) { this.fileError = `"${f.name}" exceeds 5MB`; continue; }
      if (!this.selectedFiles.find(x => x.name === f.name && x.size === f.size)) {
        this.selectedFiles.push(f);
      }
    }
  }

  removeFile(i: number) { this.selectedFiles.splice(i, 1); }

  fileIcon(f: File): string {
    if (f.type.startsWith('image/')) return '🖼️';
    if (f.type === 'application/pdf') return '📄';
    if (f.type.startsWith('video/')) return '🎥';
    return '📎';
  }

  formatSize(b: number): string {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.submitError = '';
    const v = this.form.value;
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify({
      title: v.title, description: v.description, category: v.category,
      flatNumber: v.flatNumber || null, block: v.block || null,
      locationDescription: v.locationDescription || null
    })], { type: 'application/json' }));
    this.selectedFiles.forEach(f => fd.append('files', f));
    this.svc.raise(fd).subscribe({
      next: r => { this.submitting = false; this.router.navigate(['/complaints', r.data.id]); },
      error: err => { this.submitting = false; this.submitError = err.error?.message || 'Failed to submit'; }
    });
  }
}
