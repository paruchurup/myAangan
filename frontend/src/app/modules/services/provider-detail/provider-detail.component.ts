import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceDirectoryService } from '../../../core/services/service-directory.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderDetail, Review } from '../../../core/models/service.model';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page" *ngIf="provider">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">← Back</button>
        <div class="header-content">
          <div class="big-avatar">{{ provider.name.charAt(0).toUpperCase() }}</div>
          <h1>{{ provider.name }}</h1>
          <div class="category-badge">{{ provider.categoryIcon }} {{ provider.categoryName }}</div>

          <div class="availability-badge" [class]="provider.availability.toLowerCase()">
            <span class="dot"></span>
            {{ availabilityLabel(provider.availability) }}
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="section">
        <div class="info-grid">
          <a class="info-card call-card" href="tel:{{ provider.phone }}">
            <span class="info-icon">📞</span>
            <div>
              <div class="info-label">Phone</div>
              <div class="info-val">{{ provider.phone }}</div>
            </div>
            <span class="call-label">Call</span>
          </a>

          <div class="info-card" *ngIf="provider.area">
            <span class="info-icon">📍</span>
            <div>
              <div class="info-label">Area</div>
              <div class="info-val">{{ provider.area }}</div>
            </div>
          </div>

          <div class="info-card">
            <span class="info-icon">⭐</span>
            <div>
              <div class="info-label">Rating</div>
              <div class="info-val">
                {{ provider.avgRating | number:'1.1-1' }} / 5
                <span class="review-count">({{ provider.reviewCount }} reviews)</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <span class="info-icon">👤</span>
            <div>
              <div class="info-label">Added by</div>
              <div class="info-val">{{ provider.addedByName }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Availability toggle (anyone can update) -->
      <div class="section" *ngIf="!isVisitor">
        <h3>Update Availability</h3>
        <div class="avail-buttons">
          <button
            *ngFor="let opt of availabilityOptions"
            [class]="'avail-btn ' + opt.value.toLowerCase()"
            [class.selected]="provider.availability === opt.value"
            (click)="updateAvailability(opt.value)">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Admin Actions -->
      <div class="section admin-actions" *ngIf="isAdmin">
        <button class="btn-danger" (click)="deleteProvider()">🗑 Remove Provider</button>
      </div>

      <!-- Reviews Section -->
      <div class="section">
        <h3>Reviews ({{ provider.reviews.length }})</h3>

        <!-- Star rating display -->
        <div class="overall-rating" *ngIf="provider.reviewCount > 0">
          <div class="big-stars">{{ getStarDisplay(provider.avgRating) }}</div>
          <div class="rating-text">{{ provider.avgRating | number:'1.1-1' }} out of 5</div>
        </div>

        <!-- Write / Edit Review -->
        <div class="review-form" *ngIf="!isVisitor">
          <h4>{{ myReview ? 'Edit Your Review' : 'Write a Review' }}</h4>
          <div class="star-picker">
            <span
              *ngFor="let s of [1,2,3,4,5]"
              class="star-pick"
              [class.filled]="s <= newStars"
              (click)="newStars = s">
              {{ s <= newStars ? '★' : '☆' }}
            </span>
            <span class="star-label">{{ starLabel(newStars) }}</span>
          </div>
          <textarea
            [(ngModel)]="newComment"
            placeholder="Share your experience (optional)..."
            rows="3">
          </textarea>
          <button
            class="btn-primary"
            [disabled]="newStars === 0 || submitting"
            (click)="submitReview()">
            {{ submitting ? 'Submitting...' : (myReview ? 'Update Review' : 'Submit Review') }}
          </button>
          <div class="success-msg" *ngIf="reviewSuccess">✅ Review saved!</div>
          <div class="error-msg" *ngIf="reviewError">{{ reviewError }}</div>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list">
          <div class="no-reviews" *ngIf="provider.reviews.length === 0">
            No reviews yet. Be the first!
          </div>
          <div class="review-card" *ngFor="let r of provider.reviews">
            <div class="review-header">
              <div class="reviewer-avatar">{{ r.reviewerName.charAt(0) }}</div>
              <div class="reviewer-info">
                <div class="reviewer-name">{{ r.reviewerName }}</div>
                <div class="review-date">{{ r.createdAt | date:'MMM d, y' }}</div>
              </div>
              <div class="review-stars">{{ getStarDisplay(r.stars) }}</div>
              <button
                class="delete-review-btn"
                *ngIf="isAdmin"
                (click)="deleteReview(r)">✕</button>
            </div>
            <p class="review-comment" *ngIf="r.comment">{{ r.comment }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Loading -->
    <div class="loading" *ngIf="!provider">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .page { padding-bottom: 80px; background: #f5f6fa; min-height: 100vh; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      padding: 16px 16px 28px; color: white; text-align: center; position: relative;
    }
    .back-btn {
      position: absolute; left: 16px; top: 16px; background: rgba(255,255,255,0.15);
      border: none; color: white; padding: 6px 12px; border-radius: 20px;
      font-size: 13px; cursor: pointer;
    }
    .big-avatar {
      width: 72px; height: 72px; border-radius: 50%; background: white;
      color: #0f3460; font-size: 32px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
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

    .section { padding: 16px; border-bottom: 1px solid #eee; }
    .section h3 { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
    .section h4 { font-size: 14px; font-weight: 600; color: #333; margin: 0 0 10px; }

    .info-grid { display: flex; flex-direction: column; gap: 10px; }
    .info-card {
      background: white; border-radius: 12px; padding: 12px 14px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .call-card { text-decoration: none; color: inherit; }
    .info-icon { font-size: 22px; flex-shrink: 0; }
    .info-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-val { font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .review-count { font-size: 12px; font-weight: 400; color: #888; }
    .call-label {
      margin-left: auto; background: #e8f5e9; color: #166534;
      padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }

    .avail-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .avail-btn {
      padding: 8px 16px; border-radius: 20px; border: 2px solid;
      font-size: 13px; font-weight: 600; cursor: pointer; background: white;
      transition: all 0.2s;
    }
    .avail-btn.available { border-color: #22c55e; color: #166534; }
    .avail-btn.available.selected { background: #22c55e; color: white; }
    .avail-btn.busy { border-color: #f59e0b; color: #92400e; }
    .avail-btn.busy.selected { background: #f59e0b; color: white; }
    .avail-btn.not_responding { border-color: #ef4444; color: #991b1b; }
    .avail-btn.not_responding.selected { background: #ef4444; color: white; }

    .admin-actions { display: flex; gap: 8px; }
    .btn-danger {
      background: #fee2e2; color: #991b1b; border: none;
      padding: 10px 18px; border-radius: 10px; font-size: 14px;
      font-weight: 600; cursor: pointer;
    }

    .overall-rating { text-align: center; padding: 12px 0 16px; }
    .big-stars { font-size: 28px; letter-spacing: 2px; color: #f59e0b; }
    .rating-text { font-size: 14px; color: #555; margin-top: 4px; }

    .review-form { background: white; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    .star-picker { display: flex; align-items: center; gap: 4px; margin-bottom: 12px; }
    .star-pick { font-size: 28px; cursor: pointer; color: #f59e0b; transition: transform 0.1s; }
    .star-pick:active { transform: scale(1.2); }
    .star-pick.filled { color: #f59e0b; }
    .star-label { font-size: 13px; color: #888; margin-left: 8px; }
    textarea {
      width: 100%; border: 1.5px solid #eee; border-radius: 10px;
      padding: 10px; font-size: 14px; resize: none; outline: none;
      font-family: inherit; box-sizing: border-box;
    }
    textarea:focus { border-color: #0f3460; }
    .btn-primary {
      margin-top: 10px; width: 100%; background: #0f3460; color: white;
      border: none; padding: 12px; border-radius: 10px; font-size: 15px;
      font-weight: 600; cursor: pointer;
    }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .success-msg { color: #166534; font-size: 13px; margin-top: 8px; text-align: center; }
    .error-msg { color: #991b1b; font-size: 13px; margin-top: 8px; text-align: center; }

    .no-reviews { text-align: center; color: #aaa; padding: 24px 0; font-size: 14px; }
    .review-card { background: white; border-radius: 12px; padding: 14px; margin-bottom: 10px; }
    .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .reviewer-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: #0f3460;
      color: white; font-weight: 700; display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0;
    }
    .reviewer-name { font-size: 14px; font-weight: 600; }
    .review-date { font-size: 11px; color: #aaa; }
    .review-stars { margin-left: auto; color: #f59e0b; font-size: 15px; }
    .review-comment { font-size: 14px; color: #444; margin: 0; line-height: 1.5; }
    .delete-review-btn {
      background: #fee2e2; border: none; color: #991b1b; width: 24px; height: 24px;
      border-radius: 50%; font-size: 11px; cursor: pointer; flex-shrink: 0;
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
  newStars = 0;
  newComment = '';
  submitting = false;
  reviewSuccess = false;
  reviewError = '';
  myReview: any = null;

  availabilityOptions = [
    { value: 'AVAILABLE', label: '✅ Available' },
    { value: 'BUSY', label: '⏳ Busy' },
    { value: 'NOT_RESPONDING', label: '❌ Not Responding' }
  ];

  get isAdmin(): boolean { return this.authService.getCurrentUser()?.role === 'ADMIN'; }
  get isVisitor(): boolean { return this.authService.getCurrentUser()?.role === 'VISITOR'; }
  get currentUserId(): number | undefined { return this.authService.getCurrentUser()?.id; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: ServiceDirectoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProvider(id);
  }

  loadProvider(id: number) {
    this.svc.getProvider(id).subscribe({
      next: r => {
        this.provider = r.data;
        // Pre-fill if user already reviewed
        this.myReview = r.data.reviews.find(
          rv => rv.reviewerId === this.currentUserId) || null;
        if (this.myReview) {
          this.newStars = this.myReview.stars;
          this.newComment = this.myReview.comment || '';
        }
      }
    });
  }

  submitReview() {
    if (!this.provider || this.newStars === 0) return;
    this.submitting = true;
    this.reviewError = '';
    this.reviewSuccess = false;
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

  updateAvailability(value: string) {
    if (!this.provider) return;
    this.svc.updateProvider(this.provider.id, { availability: value as any }).subscribe({
      next: r => { this.provider!.availability = r.data.availability; }
    });
  }

  deleteProvider() {
    if (!this.provider || !confirm(`Remove ${this.provider.name} from directory?`)) return;
    this.svc.deleteProvider(this.provider.id).subscribe({
      next: () => this.router.navigate(['/services'])
    });
  }

  deleteReview(review: any) {
    if (!this.provider || !confirm('Delete this review?')) return;
    this.svc.deleteReview(this.provider.id, review.id).subscribe({
      next: () => this.loadProvider(this.provider!.id)
    });
  }

  goBack() { this.router.navigate(['/services']); }

  getStarDisplay(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  availabilityLabel(a: string): string {
    return { AVAILABLE: 'Available', BUSY: 'Busy', NOT_RESPONDING: 'Not Responding' }[a] || a;
  }

  starLabel(s: number): string {
    return ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][s] || '';
  }
}
