import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { environment } from '@env/environment';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

@Injectable({ providedIn: 'root' })
export class NotificationPushService implements OnDestroy {
  private base = `${environment.apiUrl}/notifications`;
  unreadCount$ = new BehaviorSubject<number>(0);
  private pollSub?: Subscription;
  private messaging?: Messaging;
  private currentFcmToken?: string;

  constructor(private http: HttpClient) {
    this.initFirebase();
  }

  private initFirebase() {
    if (!getApps().length) {
      initializeApp(environment.firebaseConfig);
    }
    try {
      this.messaging = getMessaging();
    } catch {
      // Firebase messaging not supported (e.g. non-HTTPS or unsupported browser)
    }
  }

  /** Start polling and request FCM permission */
  startPolling() {
    this.fetchUnreadCount();
    this.pollSub = interval(30000).subscribe(() => this.fetchUnreadCount());
    this.initFcm();
  }

  stopPolling() {
    this.pollSub?.unsubscribe();
  }

  /** Request notification permission, get FCM token and register with backend */
  async initFcm() {
    if (!this.messaging) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const token = await getToken(this.messaging, { vapidKey: environment.vapidKey });
      if (token) {
        this.currentFcmToken = token;
        this.registerFcmToken(token);
      }

      // Handle foreground messages — bump unread count
      onMessage(this.messaging, () => {
        this.fetchUnreadCount();
      });
    } catch {
      // Permission denied or browser not supported — silent fail
    }
  }

  /** Deregister the current device's FCM token (call on logout) */
  deregisterCurrentDevice() {
    if (this.currentFcmToken) {
      this.removeFcmToken(this.currentFcmToken);
      this.currentFcmToken = undefined;
    }
  }

  private fetchUnreadCount() {
    this.http.get<any>(`${this.base}/unread-count`).subscribe({
      next: r => this.unreadCount$.next(r.data?.unreadCount ?? 0),
      error: () => {}
    });
  }

  getNotifications(page = 0) {
    return this.http.get<any>(`${this.base}?page=${page}`);
  }

  markRead(id: number) {
    return this.http.post(`${this.base}/${id}/read`, {}).subscribe({
      next: () => this.fetchUnreadCount()
    });
  }

  markAllRead() {
    return this.http.post(`${this.base}/read-all`, {}).subscribe({
      next: () => this.unreadCount$.next(0)
    });
  }

  registerFcmToken(token: string) {
    this.http.post(`${this.base}/fcm-token`, { token }).subscribe();
  }

  removeFcmToken(token: string) {
    this.http.delete(`${this.base}/fcm-token`, { body: { token } }).subscribe();
  }

  ngOnDestroy() { this.stopPolling(); }
}