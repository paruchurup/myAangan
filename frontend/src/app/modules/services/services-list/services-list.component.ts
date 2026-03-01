import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceDirectoryService } from '../../../core/services/service-directory.service';
import { AuthService } from '../../../core/services/auth.service';
import { Category, ProviderSummary } from '../../../core/models/service.model';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-top">
          <h1>🔧 Service Directory</h1>
          <a routerLink="/services/add" class="btn-add" *ngIf="canAddProvider">
            + Add Provider
          </a>
        </div>
        <p class="subtitle">Trusted workers recommended by your community</p>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by name..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
        />
        <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">✕</button>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <button
          class="tab"
          [class.active]="!selectedCategoryId"
          (click)="selectCategory(null)">
          All
        </button>
        <button
          *ngFor="let cat of categories"
          class="tab"
          [class.active]="selectedCategoryId === cat.id"
          (click)="selectCategory(cat.id)">
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading providers...</p>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && providers.length === 0">
        <div class="empty-icon">🔍</div>
        <p>No providers found</p>
        <small *ngIf="canAddProvider">Be the first to add one!</small>
        <a routerLink="/services/add" class="btn-primary" *ngIf="canAddProvider">Add Provider</a>
      </div>

      <!-- Provider Cards -->
      <div class="provider-list" *ngIf="!loading && providers.length > 0">
        <a
          *ngFor="let p of providers"
          [routerLink]="['/services', p.id]"
          class="provider-card">

          <!-- Avatar -->
          <div class="avatar">{{ p.name.charAt(0).toUpperCase() }}</div>

          <!-- Info -->
          <div class="info">
            <div class="name-row">
              <span class="name">{{ p.name }}</span>
              <span class="availability-dot" [class]="p.availability.toLowerCase()"></span>
            </div>
            <div class="category-tag">
              {{ p.categoryIcon }} {{ p.categoryName }}
            </div>
            <div class="area" *ngIf="p.area">📍 {{ p.area }}</div>
            <div class="rating-row">
              <span class="stars">{{ getStars(p.avgRating) }}</span>
              <span class="rating-val" *ngIf="p.reviewCount > 0">
                {{ p.avgRating | number:'1.1-1' }} ({{ p.reviewCount }})
              </span>
              <span class="no-reviews" *ngIf="p.reviewCount === 0">No reviews yet</span>
            </div>
          </div>

          <!-- Call button -->
          <a class="call-btn" href="tel:{{ p.phone }}" (click)="$event.stopPropagation()">
            📞
          </a>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0 0 80px; background: #f5f6fa; min-height: 100vh; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      padding: 20px 16px 24px;
      color: white;
    }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0; font-weight: 700; }
    .subtitle { font-size: 13px; color: rgba(255,255,255,0.7); margin: 4px 0 0; }

    .btn-add {
      background: #e94560; color: white; padding: 8px 14px; border-radius: 20px;
      text-decoration: none; font-size: 13px; font-weight: 600; white-space: nowrap;
    }

    .search-bar {
      margin: 12px 16px; background: white; border-radius: 12px;
      display: flex; align-items: center; padding: 0 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .search-icon { font-size: 16px; margin-right: 8px; color: #999; }
    .search-bar input {
      flex: 1; border: none; outline: none; font-size: 15px;
      padding: 12px 0; background: transparent;
    }
    .clear-btn { background: none; border: none; color: #999; font-size: 16px; cursor: pointer; }

    .category-tabs {
      display: flex; gap: 8px; padding: 4px 16px 12px;
      overflow-x: auto; scrollbar-width: none;
    }
    .category-tabs::-webkit-scrollbar { display: none; }
    .tab {
      padding: 7px 14px; border-radius: 20px; border: 1.5px solid #ddd;
      background: white; font-size: 13px; white-space: nowrap; cursor: pointer;
      transition: all 0.2s; color: #555;
    }
    .tab.active { background: #0f3460; color: white; border-color: #0f3460; }

    .loading { text-align: center; padding: 60px 20px; color: #888; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #eee;
      border-top-color: #0f3460; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center; padding: 60px 20px; color: #888;
    }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; font-weight: 600; color: #555; margin: 0 0 4px; }
    .empty-state small { font-size: 13px; }
    .btn-primary {
      display: inline-block; margin-top: 16px; background: #0f3460;
      color: white; padding: 10px 24px; border-radius: 20px;
      text-decoration: none; font-size: 14px; font-weight: 600;
    }

    .provider-list { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }

    .provider-card {
      background: white; border-radius: 14px; padding: 14px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-decoration: none; color: inherit;
      transition: transform 0.15s;
    }
    .provider-card:active { transform: scale(0.98); }

    .avatar {
      width: 50px; height: 50px; border-radius: 50%; background: #0f3460;
      color: white; font-size: 22px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .info { flex: 1; min-width: 0; }
    .name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .name { font-size: 16px; font-weight: 600; color: #1a1a2e; }

    .availability-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .availability-dot.available { background: #22c55e; }
    .availability-dot.busy { background: #f59e0b; }
    .availability-dot.not_responding { background: #ef4444; }

    .category-tag {
      font-size: 12px; color: #0f3460; background: #e8f0fe;
      display: inline-block; padding: 2px 8px; border-radius: 10px; margin-bottom: 3px;
    }
    .area { font-size: 12px; color: #888; margin-bottom: 4px; }

    .rating-row { display: flex; align-items: center; gap: 6px; }
    .stars { font-size: 13px; letter-spacing: -1px; }
    .rating-val { font-size: 12px; color: #555; font-weight: 600; }
    .no-reviews { font-size: 12px; color: #aaa; }

    .call-btn {
      font-size: 22px; width: 44px; height: 44px; border-radius: 50%;
      background: #e8f5e9; display: flex; align-items: center; justify-content: center;
      text-decoration: none; flex-shrink: 0;
    }
  `]
})
export class ServicesListComponent implements OnInit {
  categories: Category[] = [];
  providers: ProviderSummary[] = [];
  selectedCategoryId: number | null = null;
  searchQuery = '';
  loading = true;
  searchTimer: any;

  get canAddProvider(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return role === 'ADMIN' || role === 'RESIDENT';
  }

  constructor(
    private svc: ServiceDirectoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProviders();
  }

  loadCategories() {
    this.svc.getCategories().subscribe({
      next: r => this.categories = r.data,
      error: () => {}
    });
  }

  loadProviders() {
    this.loading = true;
    this.svc.getProviders(
      this.selectedCategoryId ?? undefined,
      this.searchQuery || undefined
    ).subscribe({
      next: r => { this.providers = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.loadProviders();
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProviders(), 400);
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadProviders();
  }

  getStars(avg: number): string {
    if (avg === 0) return '☆☆☆☆☆';
    const full = Math.round(avg);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
