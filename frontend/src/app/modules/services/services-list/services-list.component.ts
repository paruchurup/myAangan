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
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.scss']
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
