import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  Delivery, DeliveryRequest, DeliveryStatusUpdateRequest,
  DeliveryPreferences, OtpGenerateResponse
} from '../models/delivery.model';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private base = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  // Guard
  logDelivery(req: DeliveryRequest): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(this.base, req);
  }
  getTodaysDeliveries(): Observable<ApiResponse<Delivery[]>> {
    return this.http.get<ApiResponse<Delivery[]>>(`${this.base}/today`);
  }
  searchFlats(query: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/flats/search`,
      { params: new HttpParams().set('query', query) });
  }

  // Resident
  getMyPending(): Observable<ApiResponse<Delivery[]>> {
    return this.http.get<ApiResponse<Delivery[]>>(`${this.base}/my-pending`);
  }
  getPendingCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.base}/my-pending/count`);
  }
  getMyHistory(): Observable<ApiResponse<Delivery[]>> {
    return this.http.get<ApiResponse<Delivery[]>>(`${this.base}/my-history`);
  }

  // Admin
  getAllDeliveries(status?: string): Observable<ApiResponse<Delivery[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<Delivery[]>>(this.base, { params });
  }

  // Shared
  getById(id: number): Observable<ApiResponse<Delivery>> {
    return this.http.get<ApiResponse<Delivery>>(`${this.base}/${id}`);
  }
  updateStatus(id: number, req: DeliveryStatusUpdateRequest): Observable<ApiResponse<Delivery>> {
    return this.http.patch<ApiResponse<Delivery>>(`${this.base}/${id}/status`, req);
  }

  // OTP
  generateGuardOtp(id: number): Observable<ApiResponse<OtpGenerateResponse>> {
    return this.http.post<ApiResponse<OtpGenerateResponse>>(`${this.base}/${id}/otp/generate-guard`, {});
  }
  generateResidentOtp(id: number): Observable<ApiResponse<OtpGenerateResponse>> {
    return this.http.post<ApiResponse<OtpGenerateResponse>>(`${this.base}/${id}/otp/generate-resident`, {});
  }
  verifyOtp(id: number, otp: string): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(`${this.base}/${id}/otp/verify`, { otp });
  }

  // Delivery Preferences
  getMyPreferences(): Observable<ApiResponse<DeliveryPreferences>> {
    return this.http.get<ApiResponse<DeliveryPreferences>>(`${environment.apiUrl}/users/me/delivery-preferences`);
  }
  saveMyPreferences(prefs: Partial<DeliveryPreferences>): Observable<ApiResponse<DeliveryPreferences>> {
    return this.http.put<ApiResponse<DeliveryPreferences>>(`${environment.apiUrl}/users/me/delivery-preferences`, prefs);
  }
}
