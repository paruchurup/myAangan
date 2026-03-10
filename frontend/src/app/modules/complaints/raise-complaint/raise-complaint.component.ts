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
  templateUrl: './raise-complaint.component.html',
  styleUrls: ['./raise-complaint.component.scss']
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
