import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class VaultService {
  private base = `${environment.apiUrl}/vault`;
  constructor(private http: HttpClient) {}

  // Resident
  getMyVault():                           Observable<ApiResponse<any>>    { return this.http.get<ApiResponse<any>>(`${this.base}/my`); }
  requestNoc(body: any):                  Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/noc-requests`, body); }

  // Admin
  getAdminVault():                        Observable<ApiResponse<any>>    { return this.http.get<ApiResponse<any>>(`${this.base}/admin`); }
  getPendingNocs():                       Observable<ApiResponse<any[]>>  { return this.http.get<ApiResponse<any[]>>(`${this.base}/noc-requests/pending`); }
  upload(fd: FormData):                   Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/documents`, fd); }
  deleteDoc(id: number):                  Observable<ApiResponse<any>>    { return this.http.delete<ApiResponse<any>>(`${this.base}/documents/${id}`); }
  rejectNoc(id: number, reason: string):  Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/noc-requests/${id}/reject`, { reason }); }

  downloadUrl(id: number): string { return `${this.base}/documents/${id}/download`; }
}
