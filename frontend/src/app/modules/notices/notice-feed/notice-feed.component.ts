import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoticeService } from '@services/notice.service';
import { AuthService } from '@services/auth.service';
import { Notice, NOTICE_TYPE_CONFIG } from '@models/notice.model';

@Component({
  selector: 'app-notice-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./notice-feed.component.html",
  styleUrls: ["./notice-feed.component.scss"]
})
export class NoticeFeedComponent implements OnInit {
  notices: Notice[] = [];
  loading = true;
  canManage = false;
  unreadCount = 0;
  activeFilter = 'ALL';

  // IDs dismissed this session — resets on next login (intentional for important notices)
  private dismissedIds = new Set<number>();

  get alertNotices(): Notice[] {
    return this.notices.filter(n =>
      !n.read &&
      (n.priority === 'URGENT' || n.priority === 'HIGH') &&
      !this.dismissedIds.has(n.id)
    );
  }

  dismiss(n: Notice) { this.dismissedIds.add(n.id); }
  dismissAll()       { this.alertNotices.forEach(n => this.dismissedIds.add(n.id)); }
  markReadAndDismiss(n: Notice) { this.dismissedIds.add(n.id); this.markRead(n); }

  filters = [
    { v: 'ALL',        label: 'All' },
    { v: 'EMERGENCY',  label: '🚨 Emergency' },
    { v: 'MAINTENANCE',label: '🔧 Maintenance' },
    { v: 'EVENT',      label: '🎉 Events' },
    { v: 'FINANCIAL',  label: '💰 Financial' },
    { v: 'RULE_CHANGE',label: '📜 Rules' },
    { v: 'GENERAL',    label: '📋 General' },
  ];

  constructor(private svc: NoticeService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('NOTICE_MANAGE');
    this.svc.getUnreadCount().subscribe(r => this.unreadCount = r.data?.count || 0);
    this.svc.getPublished().subscribe({
      next: r => { this.notices = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get urgentNotices()  { return this.notices.filter(n => n.priority === 'URGENT'); }
  get pinnedNormal()   { return this.notices.filter(n => n.pinned && n.priority !== 'URGENT'); }
  get filteredNotices(){ return this.notices.filter(n => n.type === this.activeFilter); }

  get groupedNotices() {
    const order = ['EMERGENCY','MAINTENANCE','EVENT','FINANCIAL','RULE_CHANGE','GENERAL'];
    const map = new Map<string, Notice[]>();
    for (const n of this.notices) {
      if (n.pinned || n.priority === 'URGENT') continue;
      if (!map.has(n.type)) map.set(n.type, []);
      map.get(n.type)!.push(n);
    }
    return order.filter(t => map.has(t)).map(t => ({ type: t, notices: map.get(t)! }));
  }

  markRead(n: Notice) {
    if (!n.read) {
      this.svc.markRead(n.id).subscribe(() => {
        n.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.svc.decrementUnread(); // update shared navbar count instantly
      });
    }
  }

  typeIcon(t: string)   { return (NOTICE_TYPE_CONFIG as any)[t]?.icon   || '📋'; }
  typeLabel(t: string)  { return (NOTICE_TYPE_CONFIG as any)[t]?.label  || t; }
  typeAccent(t: string) { return (NOTICE_TYPE_CONFIG as any)[t]?.accent || '#6b7280'; }
}
