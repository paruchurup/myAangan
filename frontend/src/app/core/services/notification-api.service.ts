import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AppNotification } from '@models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private base = `${environment.apiUrl}/notifications`;
  unreadCount = signal<number>(0);

  private pollInterval: any = null;

  constructor(private http: HttpClient) {}

  /** Start polling unread count every 30s after login */
  startPolling() {
    this.fetchUnreadCount();
    this.pollInterval = setInterval(() => this.fetchUnreadCount(), 30_000);
  }

  stopPolling() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
    this.unreadCount.set(0);
  }

  fetchUnreadCount() {
    this.http.get<any>(`${this.base}/unread-count`).subscribe({
      next: r => this.unreadCount.set(r.data?.count ?? 0),
      error: () => {}
    });
  }

  getAll() { return this.http.get<any>(this.base); }

  markRead(id: number) {
    this.http.post(`${this.base}/${id}/read`, {}).subscribe(() => this.fetchUnreadCount());
  }

  markAllRead() {
    return this.http.post(`${this.base}/mark-all-read`, {});
  }

  registerFcmToken(token: string) {
    return this.http.post(`${this.base}/token`, { token });
  }

  removeFcmToken(token: string) {
    return this.http.delete(`${this.base}/token`, { body: { token } });
  }
}
