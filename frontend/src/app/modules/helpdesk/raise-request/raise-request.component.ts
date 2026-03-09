import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { CATEGORY_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-raise-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/helpdesk">← Back</a>
    </div>
    <h1>🛠️ Raise Service Request</h1>
    <p>Submit a maintenance or service request</p>
  </div>
  <div class="form-body">
    <div class="section-label">CATEGORY</div>
    <div class="category-grid">
      <button class="cat-btn" *ngFor="let cat of categories"
        [class.selected]="form.category === cat.key"
        [style.border-color]="form.category === cat.key ? cat.color : '#333'"
        (click)="form.category = cat.key">
        <span class="cat-icon">{{ cat.icon }}</span>
        <span class="cat-label" [style.color]="form.category === cat.key ? cat.color : '#9ca3af'">{{ cat.label }}</span>
      </button>
    </div>

    <div class="section-label">DETAILS</div>
    <div class="field"><label>Title *</label>
      <input [(ngModel)]="form.title" placeholder="e.g. Kitchen tap leaking, Power socket not working" /></div>
    <div class="field"><label>Description *</label>
      <textarea [(ngModel)]="form.description" rows="4"
        placeholder="Location, how long the issue has been happening, any other relevant details…"></textarea></div>

    <div class="section-label">PREFERRED TIME <span class="optional">(optional)</span></div>
    <div class="field"><label>Suggest a date & time</label>
      <input type="datetime-local" [(ngModel)]="form.preferredDatetime" />
      <small>FM will confirm or suggest an alternative slot</small></div>

    <div class="section-label">PHOTOS <span class="optional">(up to 3)</span></div>
    <div class="photo-row">
      <div class="preview-item" *ngFor="let p of previews; let i = index">
        <img [src]="p" /><button class="rm-btn" (click)="removePhoto(i)">✕</button>
      </div>
      <label class="add-photo" for="photos" *ngIf="photos.length < 3">
        <span>📷</span><span>Add</span>
      </label>
      <input type="file" id="photos" (change)="onPhotos($event)" accept="image/*" multiple class="file-inp" />
    </div>

    <div class="error" *ngIf="error">{{ error }}</div>
    <button class="submit-btn" (click)="submit()" [disabled]="saving">
      {{ saving ? 'Submitting…' : '📤 Submit Request' }}</button>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .form-body{padding:14px;display:flex;flex-direction:column;gap:12px}
    .section-label{font-family:'Oswald',sans-serif;font-size:10px;color:#3b82f6;letter-spacing:2px;border-bottom:1px solid #2a2a2a;padding-bottom:4px;margin-top:4px}
    .optional{color:#4b5563;font-size:9px}
    .category-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
    .cat-btn{background:#252525;border:2px solid #333;border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:border-color 0.15s,background 0.15s}
    .cat-btn.selected{background:rgba(59,130,246,0.08)}
    .cat-icon{font-size:24px}
    .cat-label{font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px}
    .field{display:flex;flex-direction:column;gap:4px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;font-family:'Oswald',sans-serif}
    input,textarea{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:9px 11px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box}
    input:focus,textarea:focus{border-color:#3b82f6}
    textarea{resize:vertical}
    small{font-size:10px;color:#4b5563}
    .photo-row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
    .preview-item{position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid #333}
    .preview-item img{width:100%;height:100%;object-fit:cover}
    .rm-btn{position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);border:none;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;padding:0;line-height:1}
    .add-photo{width:80px;height:80px;background:#252525;border:1.5px dashed #333;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;font-size:10px;color:#6b7280}
    .add-photo span:first-child{font-size:22px}
    .file-inp{display:none}
    .error{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:8px 12px;border-radius:6px;font-size:12px}
    .submit-btn{background:#3b82f6;border:none;color:#fff;padding:13px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;cursor:pointer}
    .submit-btn:disabled{opacity:0.4}
  `]
})
export class RaiseRequestComponent {
  form = { title: '', description: '', category: 'PLUMBING', preferredDatetime: '' };
  photos:   File[]   = [];
  previews: string[] = [];
  saving = false; error = '';
  categories = Object.entries(CATEGORY_CONFIG).map(([key, v]) => ({ key, ...v }));

  constructor(private svc: HelpdeskService, public router: Router) {}

  onPhotos(e: any) {
    const files: FileList = e.target.files;
    for (let i = 0; i < files.length && this.photos.length < 3; i++) {
      this.photos.push(files[i]);
      const r = new FileReader();
      r.onload = (ev: any) => this.previews.push(ev.target.result);
      r.readAsDataURL(files[i]);
    }
    e.target.value = '';
  }

  removePhoto(i: number) { this.photos.splice(i, 1); this.previews.splice(i, 1); }

  submit() {
    if (!this.form.title.trim() || !this.form.description.trim()) {
      this.error = 'Title and description are required.'; return;
    }
    this.saving = true; this.error = '';
    const fd = new FormData();
    fd.append('title', this.form.title);
    fd.append('description', this.form.description);
    fd.append('category', this.form.category);
    if (this.form.preferredDatetime) fd.append('preferredDatetime', this.form.preferredDatetime);
    this.photos.forEach(f => fd.append('photos', f));
    this.svc.create(fd).subscribe({
      next: r => this.router.navigate(['/helpdesk', r.data.id]),
      error: e => { this.error = e.error?.message || 'Submission failed.'; this.saving = false; }
    });
  }
}
