import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Complaint, AttachmentInfo, CommentInfo } from '@models/complaint.model';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private base = `${environment.apiUrl}/complaints`;

  constructor(private http: HttpClient) {}

  raise(formData: FormData): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(this.base, formData);
  }
  getMy(): Observable<ApiResponse<Complaint[]>> {
    return this.http.get<ApiResponse<Complaint[]>>(`${this.base}/my`);
  }
  getMyComplaints(): Observable<ApiResponse<Complaint[]>> { return this.getMy(); }
  getAll(status?: string): Observable<ApiResponse<Complaint[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<Complaint[]>>(this.base, { params });
  }
  getEscalated(level: string): Observable<ApiResponse<Complaint[]>> {
    return this.http.get<ApiResponse<Complaint[]>>(`${this.base}/escalated`, {
      params: new HttpParams().set('level', level)
    });
  }
  getStats(): Observable<ApiResponse<Record<string, number>>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.base}/stats`);
  }
  getById(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.get<ApiResponse<Complaint>>(`${this.base}/${id}`);
  }
  updateStatus(id: number, payload: any): Observable<ApiResponse<Complaint>> {
    return this.http.patch<ApiResponse<Complaint>>(`${this.base}/${id}/status`, payload);
  }
  assign(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.base}/${id}/assign`, {});
  }
  escalate(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.base}/${id}/escalate`, {});
  }
  addComment(id: number, text: string, internal: boolean): Observable<ApiResponse<CommentInfo>> {
    return this.http.post<ApiResponse<CommentInfo>>(`${this.base}/${id}/comments`, { text, internal });
  }
  addAttachments(id: number, formData: FormData): Observable<ApiResponse<AttachmentInfo[]>> {
    return this.http.post<ApiResponse<AttachmentInfo[]>>(`${this.base}/${id}/attachments`, formData);
  }
  deleteAttachment(attachmentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/attachments/${attachmentId}`);
  }
  downloadPdf(payload: any): Observable<Blob> {
    return this.http.post(`${this.base}/report/pdf`, payload, { responseType: 'blob' });
  }
}
