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
  template: `
    <div class="page" *ngIf="provider">

      <!-- Header -->
      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/services">← Back</a>
        </div>
        <div class="header-content">

          <!-- Photo or Avatar -->
          <div class="photo-wrap">
            <img *ngIf="provider.photoUrl && !photoError" [src]="provider.photoUrl"
              class="provider-photo" [alt]="provider.name"
              (error)="photoError = true" />
            <div *ngIf="!provider.photoUrl || photoError" class="big-avatar">
              {{ provider.name.charAt(0).toUpperCase() }}
            </div>
            <!-- Photo upload button (admin/resident who added) -->
            <label class="photo-upload-btn" *ngIf="canEdit" title="Change photo">
              📷
              <input type="file" accept="image/*" (change)="onPhotoSelected($event)" hidden />
            </label>
          </div>

          <h1>{{ provider.name }}</h1>
          <div class="category-badge">{{ provider.categoryIcon }} {{ provider.categoryName }}</div>
          <div class="availability-badge" [class]="provider.availability.toLowerCase()">
            <span class="dot"></span> {{ availLabel(provider.availability) }}
          </div>
        </div>
      </div>

      <!-- Photo upload progress -->
      <div class="upload-banner" *ngIf="uploadingPhoto">📤 Uploading photo...</div>
      <div class="upload-banner success" *ngIf="uploadSuccess">✅ Photo updated!</div>

      <!-- Action Buttons Row -->
      <div class="action-row">
        <a class="action-btn call" href="tel:{{ provider.phone }}">
          📞 <span>Call</span>
        </a>
        <button class="action-btn whatsapp" (click)="shareWhatsApp()">
          💬 <span>WhatsApp</span>
        </button>
        <button class="action-btn share" (click)="shareContact()">
          🔗 <span>Share</span>
        </button>
        <button class="action-btn edit" *ngIf="canEdit" (click)="toggleEdit()">
          ✏️ <span>Edit</span>
        </button>
      </div>

      <!-- Info Section -->
      <div class="section" *ngIf="!editMode">
        <div class="info-row" *ngIf="provider.phone">
          <span class="lbl">📱 Phone</span><span class="val">{{ provider.phone }}</span>
        </div>
        <div class="info-row" *ngIf="provider.area">
          <span class="lbl">📍 Area</span><span class="val">{{ provider.area }}</span>
        </div>
        <div class="info-row">
          <span class="lbl">⭐ Rating</span>
          <span class="val">
            {{ provider.avgRating | number:'1.1-1' }} / 5
            <small>({{ provider.reviewCount }} reviews)</small>
          </span>
        </div>
        <div class="info-row">
          <span class="lbl">👤 Added by</span><span class="val">{{ provider.addedByName }}</span>
        </div>
      </div>

      <!-- Edit Mode -->
      <div class="section edit-section" *ngIf="editMode">
        <h3>Edit Provider Details</h3>
        <form [formGroup]="editForm">
          <div class="field">
            <label>Name</label>
            <input formControlName="name" type="text" />
          </div>
          <div class="field">
            <label>Phone</label>
            <input formControlName="phone" type="tel" />
          </div>
          <div class="field">
            <label>Category</label>
            <select formControlName="categoryId">
              <option *ngFor="let c of categories" [value]="c.id">
                {{ c.icon }} {{ c.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Area</label>
            <input formControlName="area" type="text" placeholder="e.g. Near Main Gate" />
          </div>
          <div class="edit-actions">
            <button class="btn-save" (click)="saveEdit()" [disabled]="saving">
              {{ saving ? 'Saving...' : '✅ Save Changes' }}
            </button>
            <button class="btn-cancel" (click)="toggleEdit()">Cancel</button>
          </div>
          <div class="error-msg" *ngIf="editError">{{ editError }}</div>
        </form>
      </div>

      <!-- Availability -->
      <div class="section" *ngIf="!isVisitor">
        <h3>Availability</h3>
        <div class="avail-buttons">
          <button *ngFor="let opt of availOpts"
            class="avail-btn" [class]="opt.cls"
            [class.selected]="provider.availability === opt.value"
            (click)="setAvailability(opt.value)">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Admin delete -->
      <div class="section" *ngIf="isAdmin">
        <button class="btn-danger" (click)="deleteProvider()">🗑 Remove from Directory</button>
      </div>

      <!-- Reviews -->
      <div class="section">
        <div class="reviews-header">
          <h3>Reviews ({{ provider.reviews.length }})</h3>
          <div class="overall-stars" *ngIf="provider.reviewCount > 0">
            <span class="big-stars">{{ getStars(provider.avgRating) }}</span>
            <span class="rating-num">{{ provider.avgRating | number:'1.1-1' }}</span>
          </div>
        </div>

        <!-- Write/edit review -->
        <div class="review-form" *ngIf="!isVisitor">
          <h4>{{ myReview ? 'Edit Your Review' : 'Write a Review' }}</h4>
          <div class="star-picker">
            <span *ngFor="let s of [1,2,3,4,5]"
              class="star" [class.filled]="s <= newStars"
              (click)="newStars = s">{{ s <= newStars ? '★' : '☆' }}</span>
            <span class="star-label">{{ starLabel(newStars) }}</span>
          </div>
          <textarea [(ngModel)]="newComment"
            placeholder="Share your experience... (optional)" rows="3"></textarea>
          <button class="btn-review" [disabled]="newStars === 0 || submitting"
            (click)="submitReview()">
            {{ submitting ? 'Submitting...' : (myReview ? 'Update Review' : 'Submit Review') }}
          </button>
          <div class="success-msg" *ngIf="reviewSuccess">✅ Review saved!</div>
          <div class="error-msg" *ngIf="reviewError">{{ reviewError }}</div>
        </div>

        <!-- Reviews list -->
        <div class="no-reviews" *ngIf="provider.reviews.length === 0">
          No reviews yet. Be the first to review!
        </div>
        <div class="review-card" *ngFor="let r of provider.reviews">
          <div class="review-top">
            <div class="rev-avatar">{{ r.reviewerName.charAt(0) }}</div>
            <div class="rev-meta">
              <div class="rev-name">{{ r.reviewerName }}</div>
              <div class="rev-date">{{ r.createdAt | date:'MMM d, y' }}</div>
            </div>
            <div class="rev-stars">{{ getStars(r.stars) }}</div>
            <button class="del-review" *ngIf="isAdmin" (click)="deleteReview(r)">✕</button>
          </div>
          <p class="rev-comment" *ngIf="r.comment">{{ r.comment }}</p>
        </div>
      </div>

    </div>

    <div class="loading" *ngIf="!provider">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .page { background: #f5f6fa; min-height: 100vh; padding-bottom: 80px; }

    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; text-align: center; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; text-align: left; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }

    .photo-wrap { position: relative; display: inline-block; margin-bottom: 12px; }
    .provider-photo, .big-avatar {
      width: 80px; height: 80px; border-radius: 50%;
    }
    .provider-photo { object-fit: cover; border: 3px solid rgba(255,255,255,0.3); }
    .big-avatar {
      background: white; color: #0f3460; font-size: 34px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .photo-upload-btn {
      position: absolute; bottom: 0; right: 0; width: 26px; height: 26px;
      background: #e94560; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 13px; cursor: pointer;
    }

    .page-header h1 { font-size: 22px; margin: 0 0 6px; }
    .category-badge {
      display: inline-block; background: rgba(255,255,255,0.15);
      padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 8px;
    }
    .availability-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .availability-badge.available { background: #dcfce7; color: #166534; }
    .availability-badge.busy { background: #fef3c7; color: #92400e; }
    .availability-badge.not_responding { background: #fee2e2; color: #991b1b; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

    .upload-banner {
      background: #e8f0fe; color: #0f3460; text-align: center;
      padding: 8px; font-size: 13px; font-weight: 600;
    }
    .upload-banner.success { background: #dcfce7; color: #166534; }

    .action-row {
      display: flex; gap: 8px; padding: 12px 16px;
      background: white; border-bottom: 1px solid #f0f0f0;
    }
    .action-btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
      padding: 10px 4px; border-radius: 12px; border: none; cursor: pointer;
      font-size: 11px; font-weight: 600; text-decoration: none; color: white;
    }
    .action-btn span { font-size: 11px; }
    .action-btn.call     { background: #22c55e; }
    .action-btn.whatsapp { background: #25D366; }
    .action-btn.share    { background: #0f3460; }
    .action-btn.edit     { background: #f59e0b; }

    .section { padding: 16px; border-bottom: 1px solid #eee; }
    .section h3 { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
    .section h4 { font-size: 14px; font-weight: 600; margin: 0 0 10px; }

    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid #f5f5f5;
    }
    .info-row:last-child { border-bottom: none; }
    .lbl { font-size: 13px; color: #888; }
    .val { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .val small { font-weight: 400; color: #999; }

    .edit-section { background: white; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 5px; }
    .field input, .field select {
      width: 100%; padding: 10px 12px; border: 1.5px solid #ddd;
      border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box;
    }
    .field input:focus, .field select:focus { border-color: #0f3460; }
    .edit-actions { display: flex; gap: 10px; margin-top: 4px; }
    .btn-save {
      flex: 1; background: #0f3460; color: white; border: none;
      padding: 11px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-save:disabled { background: #ccc; cursor: not-allowed; }
    .btn-cancel {
      flex: 1; background: #f3f4f6; color: #555; border: none;
      padding: 11px; border-radius: 10px; font-size: 14px; cursor: pointer;
    }

    .avail-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .avail-btn {
      padding: 8px 16px; border-radius: 20px; border: 2px solid;
      font-size: 13px; font-weight: 600; cursor: pointer; background: white;
    }
    .avail-btn.av { border-color: #22c55e; color: #166534; }
    .avail-btn.av.selected { background: #22c55e; color: white; }
    .avail-btn.bu { border-color: #f59e0b; color: #92400e; }
    .avail-btn.bu.selected { background: #f59e0b; color: white; }
    .avail-btn.nr { border-color: #ef4444; color: #991b1b; }
    .avail-btn.nr.selected { background: #ef4444; color: white; }

    .btn-danger {
      background: #fee2e2; color: #991b1b; border: none;
      padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
    }

    .reviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .reviews-header h3 { margin: 0; }
    .overall-stars { display: flex; align-items: center; gap: 6px; }
    .big-stars { color: #f59e0b; font-size: 18px; }
    .rating-num { font-size: 16px; font-weight: 700; color: #1a1a2e; }

    .review-form { background: #f8f9ff; border-radius: 14px; padding: 14px; margin-bottom: 16px; }
    .star-picker { display: flex; align-items: center; gap: 4px; margin-bottom: 10px; }
    .star { font-size: 30px; cursor: pointer; color: #f59e0b; }
    .star.filled { color: #f59e0b; }
    .star-label { font-size: 13px; color: #888; margin-left: 8px; }
    textarea {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 10px; font-size: 14px; resize: none; outline: none;
      font-family: inherit; box-sizing: border-box; background: white;
    }
    textarea:focus { border-color: #0f3460; }
    .btn-review {
      margin-top: 10px; width: 100%; background: #0f3460; color: white;
      border: none; padding: 12px; border-radius: 10px; font-size: 15px;
      font-weight: 600; cursor: pointer;
    }
    .btn-review:disabled { background: #ccc; cursor: not-allowed; }
    .success-msg { color: #166534; font-size: 13px; margin-top: 8px; text-align: center; }
    .error-msg { color: #dc2626; font-size: 13px; margin-top: 8px; }

    .no-reviews { text-align: center; color: #aaa; padding: 24px 0; font-size: 14px; }
    .review-card { background: white; border-radius: 12px; padding: 14px; margin-bottom: 10px; }
    .review-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .rev-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: #0f3460;
      color: white; font-weight: 700; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; font-size: 15px;
    }
    .rev-name { font-size: 14px; font-weight: 600; }
    .rev-date { font-size: 11px; color: #aaa; }
    .rev-stars { margin-left: auto; color: #f59e0b; font-size: 15px; }
    .rev-comment { font-size: 14px; color: #444; margin: 0; line-height: 1.5; }
    .del-review {
      background: #fee2e2; border: none; color: #991b1b;
      width: 24px; height: 24px; border-radius: 50%; font-size: 11px; cursor: pointer;
    }

    .loading { display: flex; justify-content: center; align-items: center; height: 50vh; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #eee;
      border-top-color: #0f3460; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
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
