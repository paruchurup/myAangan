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
  templateUrl: "./raise-request.component.html",
  styleUrls: ["./raise-request.component.scss"]
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
