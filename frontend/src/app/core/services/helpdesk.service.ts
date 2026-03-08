import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class HelpdeskService {
  private base = `${environment.apiUrl}/helpdesk`;
  constructor(private http: HttpClient) {}

  create(fd: FormData):                     Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(this.base, fd); }
  getMyRequests():                           Observable<ApiResponse<any[]>>  { return this.http.get<ApiResponse<any[]>>(`${this.base}/my`); }
  getAll():                                  Observable<ApiResponse<any[]>>  { return this.http.get<ApiResponse<any[]>>(`${this.base}/all`); }
  getCounts():                               Observable<ApiResponse<Record<string, number>>> { return this.http.get<ApiResponse<Record<string, number>>>(`${this.base}/counts`); }
  getAllRequests(status?: string, category?: string): Observable<ApiResponse<any[]>> {
    const params: any = {};
    if (status)   params['status']   = status;
    if (category) params['category'] = category;
    return this.http.get<ApiResponse<any[]>>(`${this.base}/all`, { params });
  }
  getDashboard():                            Observable<ApiResponse<any>>    { return this.http.get<ApiResponse<any>>(`${this.base}/dashboard`); }
  getDetail(id: number):                     Observable<ApiResponse<any>>    { return this.http.get<ApiResponse<any>>(`${this.base}/${id}`); }
  assign(id: number, body: any):             Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/assign`, body); }
  updateStatus(id: number, body: any):       Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/status`, body); }
  cancel(id: number):                        Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/cancel`, {}); }

  photoUrl(path: string): string {
    const filename = path.replace('photos/', '');
    return `${this.base}/media/photos/${filename}`;
  }
}
