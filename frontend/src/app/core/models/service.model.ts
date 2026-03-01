// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon: string;
  active: boolean;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  icon: string;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export type Availability = 'AVAILABLE' | 'BUSY' | 'NOT_RESPONDING';

export interface ProviderSummary {
  id: number;
  name: string;
  phone: string;
  area: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  availability: Availability;
  avgRating: number;
  reviewCount: number;
  addedByName: string;
  addedById: number;
  createdAt: string;
}

export interface ProviderDetail extends ProviderSummary {
  reviews: Review[];
}

export interface ProviderRequest {
  name: string;
  phone: string;
  categoryId: number;
  area?: string;
}

export interface ProviderUpdateRequest {
  name?: string;
  phone?: string;
  categoryId?: number;
  area?: string;
  availability?: Availability;
}

// ── Review ────────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  stars: number;
  comment: string;
  reviewerName: string;
  reviewerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  stars: number;
  comment?: string;
}
