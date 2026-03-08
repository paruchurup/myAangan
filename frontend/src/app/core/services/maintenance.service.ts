import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenanceBill, MaintenanceConfig, OutstandingInfo } from '../models/maintenance.model';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private base = `${environment.apiUrl}/maintenance`;
  constructor(private http: HttpClient) {}

  // ── Config ──────────────────────────────────────────────────────────────
  getConfig():                     Observable<ApiResponse<MaintenanceConfig>>  { return this.http.get<ApiResponse<MaintenanceConfig>>(`${this.base}/config`); }
  updateConfig(body: any):         Observable<ApiResponse<MaintenanceConfig>>  { return this.http.put<ApiResponse<MaintenanceConfig>>(`${this.base}/config`, body); }

  // ── Resident ────────────────────────────────────────────────────────────
  getMyBills():                    Observable<ApiResponse<MaintenanceBill[]>>  { return this.http.get<ApiResponse<MaintenanceBill[]>>(`${this.base}/my`); }
  getMyOutstanding():              Observable<ApiResponse<OutstandingInfo>>    { return this.http.get<ApiResponse<OutstandingInfo>>(`${this.base}/my/outstanding`); }
  createOrder(billId: number):     Observable<ApiResponse<any>>                { return this.http.post<ApiResponse<any>>(`${this.base}/bills/${billId}/pay`, {}); }

  // ── Admin ───────────────────────────────────────────────────────────────
  generateBills(year: number, month: number): Observable<ApiResponse<number>> { return this.http.post<ApiResponse<number>>(`${this.base}/generate`, { year, month }); }
  getBillsForMonth(year: number, month: number): Observable<ApiResponse<MaintenanceBill[]>> { return this.http.get<ApiResponse<MaintenanceBill[]>>(`${this.base}/bills?year=${year}&month=${month}`); }
  getDefaulters():                 Observable<ApiResponse<any[]>>              { return this.http.get<ApiResponse<any[]>>(`${this.base}/defaulters`); }
  getMonthlySummary():             Observable<ApiResponse<any[]>>              { return this.http.get<ApiResponse<any[]>>(`${this.base}/summary`); }
  waiveBill(id: number, note: string): Observable<ApiResponse<MaintenanceBill>> { return this.http.post<ApiResponse<MaintenanceBill>>(`${this.base}/bills/${id}/waive`, { note }); }

  // ── Receipt ─────────────────────────────────────────────────────────────
  getReceiptUrl(filename: string): string { return `${this.base}/receipts/${filename}`; }
}
