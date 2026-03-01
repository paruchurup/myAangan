import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  Category, CategoryRequest,
  ProviderSummary, ProviderDetail,
  ProviderRequest, ProviderUpdateRequest,
  Review, ReviewRequest, SortOption
} from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceDirectoryService {
  private base = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  // ── Categories ──────────────────────────────────────────────────────────────
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.base}/categories`);
  }
  getAllCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.base}/categories/all`);
  }
  createCategory(req: CategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.base}/categories`, req);
  }
  updateCategory(id: number, req: CategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.base}/categories/${id}`, req);
  }
  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`);
  }

  // ── Providers ────────────────────────────────────────────────────────────────
  getProviders(categoryId?: number, search?: string, sort: SortOption = 'highest_rated'): Observable<ApiResponse<ProviderSummary[]>> {
    let params = new HttpParams().set('sort', sort);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (search)     params = params.set('search', search);
    return this.http.get<ApiResponse<ProviderSummary[]>>(`${this.base}/providers`, { params });
  }

  getMyProviders(): Observable<ApiResponse<ProviderSummary[]>> {
    return this.http.get<ApiResponse<ProviderSummary[]>>(`${this.base}/providers/mine`);
  }

  getProvider(id: number): Observable<ApiResponse<ProviderDetail>> {
    return this.http.get<ApiResponse<ProviderDetail>>(`${this.base}/providers/${id}`);
  }

  createProvider(req: ProviderRequest): Observable<ApiResponse<ProviderSummary>> {
    return this.http.post<ApiResponse<ProviderSummary>>(`${this.base}/providers`, req);
  }

  updateProvider(id: number, req: ProviderUpdateRequest): Observable<ApiResponse<ProviderSummary>> {
    return this.http.put<ApiResponse<ProviderSummary>>(`${this.base}/providers/${id}`, req);
  }

  uploadPhoto(id: number, file: File): Observable<ApiResponse<ProviderSummary>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<ProviderSummary>>(`${this.base}/providers/${id}/photo`, form);
  }

  deleteProvider(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/providers/${id}`);
  }

  // ── Reviews ──────────────────────────────────────────────────────────────────
  submitReview(providerId: number, req: ReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.base}/providers/${providerId}/reviews`, req);
  }
  deleteReview(providerId: number, reviewId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/providers/${providerId}/reviews/${reviewId}`);
  }
}
