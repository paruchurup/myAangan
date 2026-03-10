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
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"]
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
