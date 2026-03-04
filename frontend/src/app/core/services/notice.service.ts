import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notice } from '../models/notice.model';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private base = `${environment.apiUrl}/notices`;

  /** Shared reactive unread count — navbar and feed both use this */
  private _unread = new BehaviorSubject<number>(0);
  unread$ = this._unread.asObservable();

  constructor(private http: HttpClient) {}

  /** Fetch from server and update the shared count */
  refreshUnreadCount(): void {
    this.http.get<ApiResponse<any>>(`${this.base}/unread-count`).subscribe({
      next: r => this._unread.next(r.data?.count ?? 0),
      error: () => {}
    });
  }

  /** Decrement locally when user reads a notice (avoids extra API round-trip) */
  decrementUnread(): void {
    const v = this._unread.value;
    if (v > 0) this._unread.next(v - 1);
  }

  getPublished():               Observable<ApiResponse<Notice[]>>  { return this.http.get<ApiResponse<Notice[]>>(this.base); }
  getAll():                     Observable<ApiResponse<Notice[]>>  { return this.http.get<ApiResponse<Notice[]>>(`${this.base}/manage/all`); }
  getArchived():                Observable<ApiResponse<Notice[]>>  { return this.http.get<ApiResponse<Notice[]>>(`${this.base}/manage/archived`); }
  getUnreadCount():             Observable<ApiResponse<any>>       { return this.http.get<ApiResponse<any>>(`${this.base}/unread-count`); }
  getById(id: number):          Observable<ApiResponse<Notice>>    { return this.http.get<ApiResponse<Notice>>(`${this.base}/${id}`); }
  getReaders(id: number):       Observable<ApiResponse<any[]>>     { return this.http.get<ApiResponse<any[]>>(`${this.base}/${id}/readers`); }
  markRead(id: number):         Observable<ApiResponse<Notice>>    { return this.http.post<ApiResponse<Notice>>(`${this.base}/${id}/read`, {}); }
  acknowledge(id: number):      Observable<ApiResponse<Notice>>    { return this.http.post<ApiResponse<Notice>>(`${this.base}/${id}/acknowledge`, {}); }
  publish(id: number):          Observable<ApiResponse<Notice>>    { return this.http.post<ApiResponse<Notice>>(`${this.base}/${id}/publish`, {}); }
  archive(id: number):          Observable<ApiResponse<Notice>>    { return this.http.post<ApiResponse<Notice>>(`${this.base}/${id}/archive`, {}); }
  togglePin(id: number):        Observable<ApiResponse<Notice>>    { return this.http.post<ApiResponse<Notice>>(`${this.base}/${id}/pin`, {}); }
  delete(id: number):           Observable<ApiResponse<void>>      { return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`); }
  addComment(id: number, text: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/${id}/comments`, { text });
  }
  deleteComment(cid: number):   Observable<ApiResponse<void>>      { return this.http.delete<ApiResponse<void>>(`${this.base}/comments/${cid}`); }

  create(formData: FormData):   Observable<ApiResponse<Notice>>    { return this.http.post<ApiResponse<Notice>>(this.base, formData); }
  update(id: number, fd: FormData): Observable<ApiResponse<Notice>>{ return this.http.put<ApiResponse<Notice>>(`${this.base}/${id}`, fd); }
}
