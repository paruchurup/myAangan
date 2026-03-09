import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationPushService } from '@services/notification-push.service';

const TYPE_ICONS: Record<string, string> = {
  VISITOR_ARRIVED:'ðŸšª', DELIVERY_OTP:'ðŸ“¦', COMPLAINT_STATUS:'ðŸ“‹',
  MAINTENANCE_BILL:'ðŸ§¾', MAINTENANCE_PAYMENT:'âœ…', NOTICE_POSTED:'ðŸ“¢',
  POLL_OPENED:'ðŸ—³ï¸', POLL_CLOSED:'ðŸ—³ï¸', EVENT_VOTING_OPENED:'ðŸŽ‰',
  HELPDESK_STATUS:'ðŸ› ï¸', NOC_FULFILLED:'ðŸ“œ', NOC_REJECTED:'âŒ',
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="bell-wrapper">
  <button class="bell-btn" (click)="toggle($event)">
    ðŸ””
    <span class="badge" *ngIf="unread > 0">{{ unread > 99 ? '99+' : unread }}</span>
  </button>

  <div class="dropdown" *ngIf="open" (click)="$event.stopPropagation()">
    <div class="dd-header">
      <span class="dd-title">Notifications</span>
      <button class="mark-all" (click)="markAll()" *ngIf="unread > 0">Mark all read</button>
    </div>
    <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
    <div class="empty" *ngIf="!loading && notifications.length === 0">
      <div>ðŸ””</div><div>No notifications yet</div>
    </div>
    <div class="notif-list">
      <div class="notif-item" *ngFor="let n of notifications"
        [class.unread]="!n.isRead" (click)="onItemClick(n)">
        <div class="ni-icon">{{ typeIcon(n.type) }}</div>
        <div class="ni-content">
          <div class="ni-title">{{ n.title }}</div>
          <div class="ni-body">{{ n.body }}</div>
          <div class="ni-time">{{ timeAgo(n.createdAt) }}</div>
        </div>
        <div class="unread-dot" *ngIf="!n.isRead"></div>
      </div>
    </div>
    <a class="see-all" routerLink="/notifications" (click)="open=false">See all notifications â†’</a>
  </div>
</div>`,
  styles: [`
    .bell-wrapper{position:relative;display:inline-block}
    .bell-btn{background:none;border:none;font-size:20px;cursor:pointer;position:relative;padding:4px 6px;line-height:1}
    .badge{position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;font-size:9px;font-family:'Oswald',sans-serif;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px}
    .dropdown{position:absolute;top:calc(100% + 6px);right:0;width:320px;background:#1e1e1e;border:1px solid #333;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);z-index:1000;overflow:hidden;max-height:480px;display:flex;flex-direction:column;font-family:'IBM Plex Sans',sans-serif}
    .dd-header{padding:12px 14px;border-bottom:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
    .dd-title{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#fff}
    .mark-all{background:none;border:none;color:#6366f1;font-size:11px;cursor:pointer;padding:0}
    .loading{display:flex;justify-content:center;padding:20px}
    .spinner{width:20px;height:20px;border:2px solid #333;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:30px 20px;color:#4b5563;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:6px}
    .empty div:first-child{font-size:28px}
    .notif-list{overflow-y:auto;flex:1}
    .notif-item{display:flex;gap:10px;padding:11px 14px;border-bottom:1px solid #2a2a2a;cursor:pointer;transition:background 0.1s;position:relative}
    .notif-item:hover{background:#252525}.notif-item.unread{background:#1a1a2a}
    .ni-icon{font-size:20px;flex-shrink:0;width:28px;text-align:center;padding-top:1px}
    .ni-content{flex:1;min-width:0}
    .ni-title{font-size:12px;font-weight:600;color:#e8e8e8;margin-bottom:2px}
    .ni-body{font-size:11px;color:#9ca3af;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .ni-time{font-size:10px;color:#4b5563;margin-top:3px}
    .unread-dot{width:7px;height:7px;background:#6366f1;border-radius:50%;flex-shrink:0;margin-top:4px}
    .see-all{display:block;text-align:center;padding:10px;font-size:12px;color:#6366f1;text-decoration:none;border-top:1px solid #2a2a2a;flex-shrink:0}
    .see-all:hover{background:#252525}
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false; unread = 0; notifications: any[] = []; loading = false;
  private sub?: Subscription;

  constructor(private svc: NotificationPushService) {}

  ngOnInit() { this.sub = this.svc.unreadCount$.subscribe(n => this.unread = n); }
  ngOnDestroy() { this.sub?.unsubscribe(); }

  @HostListener('document:click') onDocClick() { this.open = false; }

  toggle(e: Event) {
    e.stopPropagation(); this.open = !this.open;
    if (this.open && !this.notifications.length) this.load();
  }

  load() {
    this.loading = true;
    this.svc.getNotifications(0).subscribe({
      next: (r: any) => { this.notifications = r.data?.notifications || []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  onItemClick(n: any) { if (!n.isRead) { this.svc.markRead(n.id); n.isRead = true; } this.open = false; }
  markAll() { this.svc.markAllRead(); this.notifications.forEach(n => n.isRead = true); }
  typeIcon(t: string): string { return TYPE_ICONS[t] || 'ðŸ””'; }

  timeAgo(d: string): string {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  }
}
