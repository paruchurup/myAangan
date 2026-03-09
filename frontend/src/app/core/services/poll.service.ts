import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Poll } from '@models/poll.model';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class PollService {
  private base = `${environment.apiUrl}/polls`;
  constructor(private http: HttpClient) {}

  getActive():               Observable<ApiResponse<Poll[]>>   { return this.http.get<ApiResponse<Poll[]>>(this.base); }
  getAll():                  Observable<ApiResponse<Poll[]>>   { return this.http.get<ApiResponse<Poll[]>>(`${this.base}/all`); }
  getStats():                Observable<ApiResponse<any>>      { return this.http.get<ApiResponse<any>>(`${this.base}/stats`); }
  getById(id: number):       Observable<ApiResponse<Poll>>     { return this.http.get<ApiResponse<Poll>>(`${this.base}/${id}`); }
  create(body: any):         Observable<ApiResponse<Poll>>     { return this.http.post<ApiResponse<Poll>>(this.base, body); }
  update(id: number, b: any):Observable<ApiResponse<Poll>>     { return this.http.put<ApiResponse<Poll>>(`${this.base}/${id}`, b); }
  vote(id: number, body: any):Observable<ApiResponse<Poll>>    { return this.http.post<ApiResponse<Poll>>(`${this.base}/${id}/vote`, body); }
  publish(id: number):       Observable<ApiResponse<Poll>>     { return this.http.post<ApiResponse<Poll>>(`${this.base}/${id}/publish`, {}); }
  close(id: number):         Observable<ApiResponse<Poll>>     { return this.http.post<ApiResponse<Poll>>(`${this.base}/${id}/close`, {}); }
  archive(id: number):       Observable<ApiResponse<Poll>>     { return this.http.post<ApiResponse<Poll>>(`${this.base}/${id}/archive`, {}); }
  delete(id: number):        Observable<ApiResponse<void>>     { return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`); }
  addComment(id: number, text: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/${id}/comments`, { text });
  }
  deleteComment(commentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/comments/${commentId}`);
  }
}
