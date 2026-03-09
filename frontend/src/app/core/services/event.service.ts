import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class EventService {
  private base = `${environment.apiUrl}/events`;
  constructor(private http: HttpClient) {}

  // Events
  getEvents():                         Observable<ApiResponse<any[]>>  { return this.http.get<ApiResponse<any[]>>(this.base); }
  getAllEvents():                       Observable<ApiResponse<any[]>>  { return this.http.get<ApiResponse<any[]>>(`${this.base}/all`); }
  getEventDetail(id: number):          Observable<ApiResponse<any>>    { return this.http.get<ApiResponse<any>>(`${this.base}/${id}`); }
  createEvent(body: any):              Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(this.base, body); }
  openVoting(id: number):              Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/open-voting`, {}); }
  activateEvent(id: number):           Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/activate`, {}); }
  completeEvent(id: number):           Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/complete`, {}); }
  cancelEvent(id: number):             Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/cancel`, {}); }

  // Voting
  castVote(id: number, choice: string): Observable<ApiResponse<any>>   { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/vote`, { choice }); }

  // Volunteers
  signUp(slotId: number):              Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/slots/${slotId}/signup`, {}); }
  withdraw(slotId: number):            Observable<ApiResponse<any>>    { return this.http.delete<ApiResponse<any>>(`${this.base}/slots/${slotId}/signup`); }
  saveRecognition(id: number, json: string): Observable<ApiResponse<any>> { return this.http.put<ApiResponse<any>>(`${this.base}/${id}/recognition`, { recognitionJson: json }); }

  // Contributions
  createContributionOrder(id: number, amount: number): Observable<ApiResponse<any>> { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/contribute`, { amount }); }
  logInKind(id: number, body: any):    Observable<ApiResponse<any>>    { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/inkind`, body); }

  // Expenses
  logExpense(id: number, fd: FormData): Observable<ApiResponse<any>>   { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/expenses`, fd); }

  // Balance sheet & surplus
  getBalanceSheet(id: number):         Observable<ApiResponse<any>>    { return this.http.get<ApiResponse<any>>(`${this.base}/${id}/balance-sheet`); }
  castSurplusVote(id: number, choice: string): Observable<ApiResponse<any>> { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/surplus-vote`, { choice }); }

  // Photos
  uploadPhoto(id: number, fd: FormData): Observable<ApiResponse<any>>  { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/photos`, fd); }
  getPhotos(id: number):               Observable<ApiResponse<any[]>>  { return this.http.get<ApiResponse<any[]>>(`${this.base}/${id}/photos`); }

  mediaUrl(path: string): string {
    const parts = path.split('/');
    return `${this.base}/media/${parts[0]}/${parts.slice(1).join('/')}`;
  }
}
