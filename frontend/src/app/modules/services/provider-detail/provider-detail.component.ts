import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceDirectoryService } from '@services/service-directory.service';
import { AuthService } from '@services/auth.service';
import { ProviderDetail } from '@models/service.model';
import { Category } from '@models/service.model';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./provider-detail.component.html",
  styleUrls: ["./provider-detail.component.scss"]
})
export class ProviderDetailComponent implements OnInit {
  provider: ProviderDetail | null = null;
  categories: Category[] = [];
  editMode = false;
  editForm!: FormGroup;
  saving = false;
  editError = '';
  newStars = 0;
  newComment = '';
  submitting = false;
  reviewSuccess = false;
  reviewError = '';
  myReview: any = null;
  uploadingPhoto = false;
  uploadSuccess = false;
  photoError = false;

  availOpts = [
    { value: 'AVAILABLE',     label: '✅ Available',      cls: 'av' },
    { value: 'BUSY',          label: '⏳ Busy',            cls: 'bu' },
    { value: 'NOT_RESPONDING',label: '❌ Not Responding',  cls: 'nr' }
  ];

  get isAdmin()   { return this.auth.getCurrentUser()?.role === 'ADMIN'; }
  get isVisitor() { return this.auth.getCurrentUser()?.role === 'VISITOR'; }
  get currentUserId() { return this.auth.getCurrentUser()?.id; }
  get canEdit() {
    const u = this.auth.getCurrentUser();
    return u?.role === 'ADMIN' ||
      (this.provider && u?.id === this.provider.addedById);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: ServiceDirectoryService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProvider(id);
    this.svc.getCategories().subscribe({ next: r => this.categories = r.data });
  }

  loadProvider(id: number) {
    this.svc.getProvider(id).subscribe({
      next: r => {
        this.provider = r.data;
        this.myReview = r.data.reviews.find(rv => rv.reviewerId === this.currentUserId) || null;
        if (this.myReview) {
          this.newStars = this.myReview.stars;
          this.newComment = this.myReview.comment || '';
        }
        this.initEditForm();
      }
    });
  }

  initEditForm() {
    if (!this.provider) return;
    this.editForm = this.fb.group({
      name:       [this.provider.name, Validators.required],
      phone:      [this.provider.phone, [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      categoryId: [this.provider.categoryId, Validators.required],
      area:       [this.provider.area || '']
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.editError = '';
    if (this.editMode) this.initEditForm();
  }

  saveEdit() {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.saving = true;
    this.editError = '';
    const v = this.editForm.value;
    this.svc.updateProvider(this.provider!.id, {
      name: v.name, phone: v.phone,
      categoryId: Number(v.categoryId), area: v.area
    }).subscribe({
      next: () => {
        this.saving = false;
        this.editMode = false;
        this.loadProvider(this.provider!.id);
      },
      error: err => {
        this.saving = false;
        this.editError = err.error?.message || 'Update failed';
      }
    });
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.provider) return;
    this.uploadingPhoto = true;
    this.uploadSuccess = false;
    this.svc.uploadPhoto(this.provider.id, file).subscribe({
      next: r => {
        this.uploadingPhoto = false;
        this.uploadSuccess = true;
        this.provider!.photoUrl = r.data.photoUrl;
        this.photoError = false;
        setTimeout(() => this.uploadSuccess = false, 3000);
      },
      error: err => {
        this.uploadingPhoto = false;
        alert(err.error?.message || 'Photo upload failed');
      }
    });
  }

  submitReview() {
    if (!this.provider || this.newStars === 0) return;
    this.submitting = true;
    this.reviewError = '';
    this.svc.submitReview(this.provider.id, {
      stars: this.newStars, comment: this.newComment
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.reviewSuccess = true;
        this.loadProvider(this.provider!.id);
        setTimeout(() => this.reviewSuccess = false, 3000);
      },
      error: err => {
        this.submitting = false;
        this.reviewError = err.error?.message || 'Failed to submit review';
      }
    });
  }

  setAvailability(value: string) {
    if (!this.provider) return;
    this.svc.updateProvider(this.provider.id, { availability: value as any })
      .subscribe({ next: r => { this.provider!.availability = r.data.availability; } });
  }

  shareWhatsApp() {
    if (!this.provider) return;
    const stars = this.provider.avgRating > 0
      ? `⭐ ${this.provider.avgRating.toFixed(1)}/5 (${this.provider.reviewCount} reviews)` : '';
    const msg = encodeURIComponent(
      `🔧 *${this.provider.name}* — ${this.provider.categoryIcon} ${this.provider.categoryName}\n` +
      `📞 ${this.provider.phone}\n` +
      (this.provider.area ? `📍 ${this.provider.area}\n` : '') +
      (stars ? `${stars}\n` : '') +
      `\nFound on MyAangan Service Directory`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  shareContact() {
    if (!this.provider) return;
    if (navigator.share) {
      navigator.share({
        title: this.provider.name,
        text: `${this.provider.categoryName} — ${this.provider.phone}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(
        `${this.provider.name} (${this.provider.categoryName}): ${this.provider.phone}`
      );
      alert('Contact details copied to clipboard!');
    }
  }

  deleteProvider() {
    if (!this.provider || !confirm(`Remove ${this.provider.name} from directory?`)) return;
    this.svc.deleteProvider(this.provider.id).subscribe({
      next: () => this.router.navigate(['/services'])
    });
  }

  deleteReview(review: any) {
    if (!this.provider || !confirm('Delete this review?')) return;
    this.svc.deleteReview(this.provider.id, review.id)
      .subscribe({ next: () => this.loadProvider(this.provider!.id) });
  }

  goBack() { this.router.navigate(['/services']); }
  getStars(r: number) { const f = Math.round(r); return '★'.repeat(f) + '☆'.repeat(5 - f); }
  availLabel(a: string) {
    return { AVAILABLE: 'Available', BUSY: 'Busy', NOT_RESPONDING: 'Not Responding' }[a] || a;
  }
  starLabel(s: number) {
    return ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][s] || '';
  }
}
