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
  templateUrl: "./notification-bell.component.html",
  styleUrls: ["./notification-bell.component.scss"]
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
