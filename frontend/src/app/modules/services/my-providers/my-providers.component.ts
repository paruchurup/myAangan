import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceDirectoryService } from '@services/service-directory.service';
import { ProviderSummary } from '@models/service.model';

@Component({
  selector: 'app-my-providers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/services">← Back</a>
        </div>
        <h1>📋 My Added Providers</h1>
        <p>Providers you have added</p>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

      <div class="empty-state" *ngIf="!loading && providers.length === 0">
        <div class="empty-icon">📋</div>
        <p>You haven't added any providers yet</p>
        <a routerLink="/services/add" class="btn-primary">+ Add First Provider</a>
      </div>

      <div class="list" *ngIf="!loading && providers.length > 0">
        <a *ngFor="let p of providers" [routerLink]="['/services', p.id]" class="card">
          <div class="avatar-wrap">
            <img *ngIf="p.photoUrl" [src]="p.photoUrl" class="photo" [alt]="p.name"
              (error)="onImgError($event)" />
            <div *ngIf="!p.photoUrl" class="avatar">{{ p.name.charAt(0).toUpperCase() }}</div>
            <span class="dot" [class]="p.availability.toLowerCase()"></span>
          </div>
          <div class="info">
            <div class="name">{{ p.name }}</div>
            <div class="cat">{{ p.categoryIcon }} {{ p.categoryName }}</div>
            <div class="area" *ngIf="p.area">📍 {{ p.area }}</div>
            <div class="rating">
              <span class="stars">{{ getStars(p.avgRating) }}</span>
              <span *ngIf="p.reviewCount > 0" class="count">
                {{ p.avgRating | number:'1.1-1' }} ({{ p.reviewCount }})
              </span>
              <span *ngIf="p.reviewCount === 0" class="no-rev">No reviews yet</span>
            </div>
          </div>
          <span class="chevron">›</span>
        </a>
      </div>

      <div class="add-more" *ngIf="!loading && providers.length > 0">
        <a routerLink="/services/add" class="btn-add">+ Add Another Provider</a>
      </div>
    </div>
  `,
  styles: [`
    .page { background: #f5f6fa; min-height: 100vh; padding-bottom: 80px; }
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p  { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .loading { display: flex; justify-content: center; padding: 60px; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #eee;
      border-top-color: #0f3460; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: #555; margin-bottom: 20px; }
    .btn-primary {
      background: #0f3460; color: white; padding: 10px 24px;
      border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600;
    }

    .list { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .card {
      background: white; border-radius: 14px; padding: 14px;
      display: flex; align-items: center; gap: 12px;
      text-decoration: none; color: inherit;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.15s;
    }
    .card:active { transform: scale(0.98); }

    .avatar-wrap { position: relative; flex-shrink: 0; }
    .photo, .avatar { width: 52px; height: 52px; border-radius: 50%; }
    .photo { object-fit: cover; }
    .avatar {
      background: #0f3460; color: white; font-size: 20px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .dot {
      position: absolute; bottom: 2px; right: 2px;
      width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;
    }
    .dot.available { background: #22c55e; }
    .dot.busy { background: #f59e0b; }
    .dot.not_responding { background: #ef4444; }

    .info { flex: 1; min-width: 0; }
    .name { font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .cat {
      font-size: 12px; color: #0f3460; background: #e8f0fe;
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      margin: 3px 0;
    }
    .area { font-size: 12px; color: #888; }
    .rating { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
    .stars { font-size: 12px; color: #f59e0b; }
    .count { font-size: 12px; color: #555; font-weight: 600; }
    .no-rev { font-size: 12px; color: #aaa; }

    .chevron { font-size: 22px; color: #ccc; flex-shrink: 0; }

    .add-more { padding: 0 16px 16px; text-align: center; }
    .btn-add {
      display: inline-block; background: #0f3460; color: white;
      padding: 12px 28px; border-radius: 20px; text-decoration: none;
      font-size: 14px; font-weight: 600;
    }
  `]
})
export class MyProvidersComponent implements OnInit {
  providers: ProviderSummary[] = [];
  loading = true;

  constructor(private svc: ServiceDirectoryService) {}

  ngOnInit() {
    this.svc.getMyProviders().subscribe({
      next: r => { this.providers = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getStars(avg: number) {
    const f = Math.round(avg);
    return '★'.repeat(f) + '☆'.repeat(5 - f);
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
