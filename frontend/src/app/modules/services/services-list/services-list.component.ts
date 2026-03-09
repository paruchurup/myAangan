import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceDirectoryService } from '@services/service-directory.service';
import { AuthService } from '@services/auth.service';
import { Category, ProviderSummary, SortOption } from '@models/service.model';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">

      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/dashboard">← Back</a>
          <a routerLink="/services/add" class="btn-add" *ngIf="canAddProvider">+ Add</a>
        </div>
        <h1>🔧 Service Directory</h1>
        <p>Trusted workers recommended by your community</p>
      </div>

      <!-- Search + Sort row -->
      <div class="controls">
        <div class="search-bar">
          <span>🔍</span>
          <input type="text" placeholder="Search by name..."
            [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" />
          <button *ngIf="searchQuery" (click)="clearSearch()">✕</button>
        </div>
        <div class="sort-toggle">
          <button [class.active]="sort === 'highest_rated'"
            (click)="setSort('highest_rated')">⭐ Top Rated</button>
          <button [class.active]="sort === 'most_reviewed'"
            (click)="setSort('most_reviewed')">💬 Most Reviewed</button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <button class="tab" [class.active]="!selectedCategoryId"
          (click)="selectCategory(null)">All</button>
        <button *ngFor="let cat of categories" class="tab"
          [class.active]="selectedCategoryId === cat.id"
          (click)="selectCategory(cat.id)">
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>

      <!-- My Providers shortcut for residents/admin -->
      <div class="my-providers-bar" *ngIf="canAddProvider">
        <a routerLink="/services/mine">📋 My Added Providers</a>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <div class="spinner"></div><p>Loading...</p>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && providers.length === 0">
        <div class="empty-icon">🔍</div>
        <p>No providers found</p>
        <a routerLink="/services/add" class="btn-primary" *ngIf="canAddProvider">
          Add First Provider
        </a>
      </div>

      <!-- Provider Cards -->
      <div class="provider-list" *ngIf="!loading && providers.length > 0">
        <a *ngFor="let p of providers" [routerLink]="['/services', p.id]"
          class="provider-card">

          <!-- Photo or Avatar -->
          <div class="avatar-wrap">
            <img *ngIf="p.photoUrl" [src]="p.photoUrl" class="photo"
              [alt]="p.name" (error)="onImgError($event)" />
            <div *ngIf="!p.photoUrl" class="avatar">
              {{ p.name.charAt(0).toUpperCase() }}
            </div>
            <span class="avail-dot" [class]="p.availability.toLowerCase()"></span>
          </div>

          <div class="info">
            <div class="name">{{ p.name }}</div>
            <div class="category-tag">{{ p.categoryIcon }} {{ p.categoryName }}</div>
            <div class="area" *ngIf="p.area">📍 {{ p.area }}</div>
            <div class="rating-row">
              <span class="stars">{{ getStars(p.avgRating) }}</span>
              <span class="rating-val" *ngIf="p.reviewCount > 0">
                {{ p.avgRating | number:'1.1-1' }} ({{ p.reviewCount }})
              </span>
              <span class="no-reviews" *ngIf="p.reviewCount === 0">No reviews</span>
            </div>
          </div>

          <a class="call-btn" href="tel:{{ p.phone }}" (click)="$event.stopPropagation()">📞</a>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0 0 80px; background: #f5f6fa; min-height: 100vh; }

    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .btn-add {
      background: #e94560; color: white; padding: 8px 14px;
      border-radius: 20px; text-decoration: none; font-size: 13px; font-weight: 600;
    }

    .controls { padding: 12px 16px 0; display: flex; flex-direction: column; gap: 8px; }

    .search-bar {
      background: white; border-radius: 12px; display: flex; align-items: center;
      padding: 0 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .search-bar span { color: #999; margin-right: 8px; }
    .search-bar input {
      flex: 1; border: none; outline: none; font-size: 15px;
      padding: 12px 0; background: transparent;
    }
    .search-bar button { background: none; border: none; color: #999; cursor: pointer; font-size: 16px; }

    .sort-toggle { display: flex; gap: 8px; }
    .sort-toggle button {
      flex: 1; padding: 8px; border: 1.5px solid #ddd; border-radius: 20px;
      background: white; font-size: 12px; cursor: pointer; color: #555;
      font-weight: 500; transition: all 0.2s;
    }
    .sort-toggle button.active { background: #0f3460; color: white; border-color: #0f3460; }

    .category-tabs {
      display: flex; gap: 8px; padding: 10px 16px;
      overflow-x: auto; scrollbar-width: none;
    }
    .category-tabs::-webkit-scrollbar { display: none; }
    .tab {
      padding: 7px 14px; border-radius: 20px; border: 1.5px solid #ddd;
      background: white; font-size: 13px; white-space: nowrap; cursor: pointer; color: #555;
    }
    .tab.active { background: #0f3460; color: white; border-color: #0f3460; }

    .my-providers-bar {
      padding: 0 16px 8px;
    }
    .my-providers-bar a {
      font-size: 13px; color: #0f3460; font-weight: 600; text-decoration: none;
      display: inline-flex; align-items: center; gap: 4px;
    }

    .loading { text-align: center; padding: 60px 20px; color: #888; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #0f3460;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: #555; margin: 0 0 16px; }
    .btn-primary {
      background: #0f3460; color: white; padding: 10px 24px;
      border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600;
    }

    .provider-list { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }

    .provider-card {
      background: white; border-radius: 14px; padding: 14px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-decoration: none; color: inherit;
      transition: transform 0.15s;
    }
    .provider-card:active { transform: scale(0.98); }

    .avatar-wrap { position: relative; flex-shrink: 0; }
    .photo {
      width: 54px; height: 54px; border-radius: 50%; object-fit: cover;
    }
    .avatar {
      width: 54px; height: 54px; border-radius: 50%; background: #0f3460;
      color: white; font-size: 22px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .avail-dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;
    }
    .avail-dot.available { background: #22c55e; }
    .avail-dot.busy { background: #f59e0b; }
    .avail-dot.not_responding { background: #ef4444; }

    .info { flex: 1; min-width: 0; }
    .name { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 3px; }
    .category-tag {
      font-size: 12px; color: #0f3460; background: #e8f0fe;
      display: inline-block; padding: 2px 8px; border-radius: 10px; margin-bottom: 3px;
    }
    .area { font-size: 12px; color: #888; margin-bottom: 4px; }
    .rating-row { display: flex; align-items: center; gap: 6px; }
    .stars { font-size: 13px; letter-spacing: -1px; color: #f59e0b; }
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
  sort: SortOption = 'highest_rated';
  loading = true;
  private searchTimer: any;

  get canAddProvider() {
    const role = this.auth.getCurrentUser()?.role;
    return role === 'ADMIN' || role === 'RESIDENT' || role === 'VOLUNTEER';
  }

  constructor(private svc: ServiceDirectoryService, private auth: AuthService) {}

  ngOnInit() {
    this.svc.getCategories().subscribe({ next: r => this.categories = r.data });
    this.loadProviders();
  }

  loadProviders() {
    this.loading = true;
    this.svc.getProviders(
      this.selectedCategoryId ?? undefined,
      this.searchQuery || undefined,
      this.sort
    ).subscribe({
      next: r => { this.providers = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  selectCategory(id: number | null) { this.selectedCategoryId = id; this.loadProviders(); }
  setSort(s: SortOption) { this.sort = s; this.loadProviders(); }
  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProviders(), 400);
  }
  clearSearch() { this.searchQuery = ''; this.loadProviders(); }

  getStars(avg: number): string {
    if (!avg) return '☆☆☆☆☆';
    const f = Math.round(avg);
    return '★'.repeat(f) + '☆'.repeat(5 - f);
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
