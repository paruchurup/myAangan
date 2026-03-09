import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationPushService } from '@services/notification-push.service';

const TYPE_ICONS: Record<string, string> = {
  VISITOR_ARRIVED:'ðŸšª', DELIVERY_OTP:'ðŸ“¦', COMPLAINT_STATUS:'ðŸ“‹',
  MAINTENANCE_BILL:'ðŸ§¾', MAINTENANCE_PAYMENT:'âœ…', NOTICE_POSTED:'ðŸ“¢',
  POLL_OPENED:'ðŸ—³ï¸', POLL_CLOSED:'ðŸ—³ï¸', EVENT_VOTING_OPENED:'ðŸŽ‰',
  HELPDESK_STATUS:'ðŸ› ï¸', NOC_FULFILLED:'ðŸ“œ', NOC_REJECTED:'âŒ',
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <button class="mark-all-btn" (click)="markAll()" *ngIf="unread > 0">
        ✓ Mark all read
      </button>
    </div>
    <h1>🔔 Notifications</h1>
    <p>Your activity notifications</p>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="empty" *ngIf="!loading && notifications.length === 0">
    <div>ðŸ””</div><p>All caught up!</p><small>No notifications yet</small>
  </div>

  <div class="notif-list">
    <div class="notif-item" *ngFor="let n of notifications"
      [class.unread]="!n.isRead" (click)="markRead(n)">
      <div class="ni-stripe" [class.visible]="!n.isRead"></div>
      <div class="ni-icon">{{ typeIcon(n.type) }}</div>
      <div class="ni-content">
        <div class="ni-title">{{ n.title }}</div>
        <div class="ni-body">{{ n.body }}</div>
        <div class="ni-time">{{ n.createdAt | date:'d MMM yyyy, h:mm a' }}</div>
      </div>
    </div>
  </div>

  <!-- Pagination -->
  <div class="pagination" *ngIf="totalPages > 1">
    <button class="page-btn" (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 0">â€¹ Prev</button>
    <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
    <button class="page-btn" (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1">Next â€º</button>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=IBM+Plex+Sans:wght@400;500&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .mark-all-btn{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;padding:7px 12px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:11px;cursor:pointer}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:44px}.empty p{font-family:'Oswald',sans-serif;font-size:18px;margin:0}.empty small{font-size:12px}
    .notif-list{display:flex;flex-direction:column}
    .notif-item{display:flex;gap:12px;padding:13px 14px;border-bottom:1px solid #222;cursor:pointer;transition:background 0.1s;position:relative;overflow:hidden}
    .notif-item:hover{background:#252525}.notif-item.unread{background:#1a1a28}
    .ni-stripe{width:3px;position:absolute;left:0;top:0;bottom:0;background:#6366f1;opacity:0;transition:opacity 0.15s;border-radius:0 2px 2px 0}
    .ni-stripe.visible{opacity:1}
    .ni-icon{font-size:22px;flex-shrink:0;width:30px;text-align:center;padding-top:1px}
    .ni-content{flex:1;min-width:0}
    .ni-title{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#e8e8e8;margin-bottom:3px}
    .ni-body{font-size:12px;color:#9ca3af;line-height:1.5}
    .ni-time{font-size:11px;color:#4b5563;margin-top:4px}
    .pagination{display:flex;align-items:center;justify-content:center;gap:14px;padding:16px}
    .page-btn{background:#252525;border:1px solid #333;color:#9ca3af;padding:8px 16px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;cursor:pointer}
    .page-btn:disabled{opacity:0.4;cursor:not-allowed}
    .page-info{font-size:12px;color:#6b7280}
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  loading    = false;
  unread     = 0;
  currentPage = 0;
  totalPages  = 1;

  constructor(private svc: NotificationPushService) {}

  ngOnInit() {
    this.svc.unreadCount$.subscribe(n => this.unread = n);
    this.loadPage(0);
  }

  loadPage(page: number) {
    this.loading = true;
    this.svc.getNotifications(page).subscribe({
      next: (r: any) => {
        this.notifications = r.data?.notifications || [];
        this.currentPage   = r.data?.currentPage ?? 0;
        this.totalPages    = r.data?.totalPages ?? 1;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  markRead(n: any) { if (!n.isRead) { this.svc.markRead(n.id); n.isRead = true; } }

  markAll() { this.svc.markAllRead(); this.notifications.forEach(n => n.isRead = true); }

  typeIcon(t: string): string { return TYPE_ICONS[t] || 'ðŸ””'; }
}
