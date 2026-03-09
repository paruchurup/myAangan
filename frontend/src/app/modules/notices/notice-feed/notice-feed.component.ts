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
  template: `
<div class="page">

  <!-- ── Alert shelf: unread HIGH + URGENT notices ── -->
  <div class="alert-shelf" *ngIf="alertNotices.length">
    <div class="shelf-header">
      <span class="shelf-label">🔔 Requires your attention</span>
      <button class="shelf-dismiss-all" (click)="dismissAll()">Dismiss all</button>
    </div>
    <div class="alert-card" *ngFor="let n of alertNotices"
         [class.urgent]="n.priority==='URGENT'"
         [class.high]="n.priority==='HIGH'">
      <div class="ac-stripe" [style.background]="typeAccent(n.type)"></div>
      <div class="ac-body">
        <div class="ac-top">
          <span class="ac-type" [style.color]="typeAccent(n.type)">{{ typeIcon(n.type) }} {{ typeLabel(n.type) }}</span>
          <span class="ac-priority urgent-tag" *ngIf="n.priority==='URGENT'">🚨 URGENT</span>
          <span class="ac-priority high-tag"   *ngIf="n.priority==='HIGH'">HIGH</span>
          <span class="ac-new" *ngIf="n['new']">NEW</span>
        </div>
        <p class="ac-title">{{ n.title }}</p>
        <p class="ac-preview">{{ n.content | slice:0:100 }}{{ n.content.length > 100 ? '…' : '' }}</p>
        <div class="ac-foot">
          <span class="ac-ack-warn" *ngIf="n.requiresAcknowledgement && !n.acknowledged">⚠️ Acknowledgement required</span>
          <a class="ac-view" [routerLink]="['/notices', n.id]" (click)="markReadAndDismiss(n)">View full notice →</a>
        </div>
      </div>
      <button class="ac-close" (click)="dismiss(n)" aria-label="Dismiss">✕</button>
    </div>
  </div>

  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <a routerLink="/notices/manage" class="post-btn" *ngIf="canManage">+ Post</a>
    </div>
    <h1>📢 Notices</h1>
    <p>Community announcements and updates</p>
  </div>

  <div class="filter-strip">
    <button *ngFor="let f of filters" class="fc" [class.active]="activeFilter===f.v"
      (click)="activeFilter=f.v">{{ f.label }}</button>
  </div>

  <div class="loading" *ngIf="loading"><div class="sp"></div></div>

  <div class="feed" *ngIf="!loading">

    <!-- URGENT banners -->
    <div class="urgent-banner" *ngFor="let n of urgentNotices"
         [routerLink]="['/notices', n.id]" (click)="markRead(n)">
      <div class="ub-stripe"></div>
      <div class="ub-body">
        <div class="ub-top">
          <span class="ub-tag">🚨 URGENT</span>
          <span class="ub-pin" *ngIf="n.pinned">📌 Pinned</span>
          <span class="ub-new" *ngIf="n['new']">NEW</span>
        </div>
        <h2 class="ub-title">{{ n.title }}</h2>
        <p class="ub-preview">{{ n.content | slice:0:120 }}{{ n.content.length > 120 ? '…' : '' }}</p>
        <div class="ub-meta">
          <span>{{ n.createdByName }}</span>
          <span>{{ n.publishedAt | date:'MMM d, h:mm a' }}</span>
          <span class="ub-ack"  *ngIf="n.requiresAcknowledgement && !n.acknowledged">⚠️ Requires acknowledgement</span>
          <span class="ub-ackd" *ngIf="n.requiresAcknowledgement && n.acknowledged">✓ Acknowledged</span>
        </div>
      </div>
    </div>

    <!-- Pinned non-urgent -->
    <div class="section-label" *ngIf="pinnedNormal.length && activeFilter==='ALL'">📌 Pinned</div>
    <ng-container *ngIf="activeFilter==='ALL'">
      <a class="notice-card pinned-card" *ngFor="let n of pinnedNormal"
         [routerLink]="['/notices', n.id]" (click)="markRead(n)"
         [class.unread]="!n.read" [class.has-ack]="n.requiresAcknowledgement && !n.acknowledged"
         [style.border-left-color]="typeAccent(n.type)">
        <div class="card-body">
          <div class="card-top">
            <span class="type-pill" [style.color]="typeAccent(n.type)">{{ typeIcon(n.type) }} {{ typeLabel(n.type) }}</span>
            <span class="new-dot" *ngIf="n['new']">NEW</span>
            <span class="read-tag" *ngIf="n.read">✓</span>
          </div>
          <h3 class="card-title">{{ n.title }}</h3>
          <p class="card-preview">{{ n.content | slice:0:100 }}{{ n.content.length > 100 ? '…' : '' }}</p>
          <div class="card-foot">
            <span class="card-author">{{ n.createdByName }}</span>
            <span class="card-date">{{ n.publishedAt | date:'MMM d' }}</span>
            <span class="ack-pill" *ngIf="n.requiresAcknowledgement && !n.acknowledged">⚠ Acknowledge</span>
            <span class="attach-pill" *ngIf="n.attachments?.length">📎 {{ n.attachments.length }}</span>
          </div>
        </div>
      </a>
    </ng-container>

    <!-- Grouped by type (ALL view) -->
    <ng-container *ngIf="activeFilter==='ALL'">
      <ng-container *ngFor="let group of groupedNotices">
        <div class="section-label" [style.color]="typeAccent(group.type)">
          {{ typeIcon(group.type) }} {{ typeLabel(group.type) }}
          <span class="group-count">{{ group.notices.length }}</span>
        </div>
        <a class="notice-card" *ngFor="let n of group.notices"
           [routerLink]="['/notices', n.id]" (click)="markRead(n)"
           [class.unread]="!n.read" [class.has-ack]="n.requiresAcknowledgement && !n.acknowledged"
           [style.border-left-color]="typeAccent(n.type)">
          <div class="card-body">
            <div class="card-top">
              <span class="type-pill" [style.color]="typeAccent(n.type)">{{ typeIcon(n.type) }} {{ typeLabel(n.type) }}</span>
              <span class="new-dot" *ngIf="n['new']">NEW</span>
              <span class="high-tag" *ngIf="n.priority==='HIGH'">HIGH</span>
              <span class="read-tag" *ngIf="n.read">✓</span>
            </div>
            <h3 class="card-title">{{ n.title }}</h3>
            <p class="card-preview">{{ n.content | slice:0:100 }}{{ n.content.length > 100 ? '…' : '' }}</p>
            <div class="card-foot">
              <span class="card-author">{{ n.createdByName }}</span>
              <span class="card-date">{{ n.publishedAt | date:'MMM d' }}</span>
              <span class="ack-pill" *ngIf="n.requiresAcknowledgement && !n.acknowledged">⚠ Acknowledge</span>
              <span class="attach-pill" *ngIf="n.attachments?.length">📎 {{ n.attachments.length }}</span>
            </div>
          </div>
        </a>
      </ng-container>
    </ng-container>

    <!-- Filtered view -->
    <ng-container *ngIf="activeFilter!=='ALL'">
      <a class="notice-card" *ngFor="let n of filteredNotices"
         [routerLink]="['/notices', n.id]" (click)="markRead(n)"
         [class.unread]="!n.read" [class.has-ack]="n.requiresAcknowledgement && !n.acknowledged"
         [style.border-left-color]="typeAccent(n.type)">
        <div class="card-body">
          <div class="card-top">
            <span class="type-pill" [style.color]="typeAccent(n.type)">{{ typeIcon(n.type) }} {{ typeLabel(n.type) }}</span>
            <span class="new-dot" *ngIf="n['new']">NEW</span>
            <span class="high-tag" *ngIf="n.priority==='HIGH'">HIGH</span>
            <span class="read-tag" *ngIf="n.read">✓</span>
          </div>
          <h3 class="card-title">{{ n.title }}</h3>
          <p class="card-preview">{{ n.content | slice:0:100 }}{{ n.content.length > 100 ? '…' : '' }}</p>
          <div class="card-foot">
            <span class="card-author">{{ n.createdByName }}</span>
            <span class="card-date">{{ n.publishedAt | date:'MMM d' }}</span>
            <span class="ack-pill" *ngIf="n.requiresAcknowledgement && !n.acknowledged">⚠ Acknowledge</span>
            <span class="attach-pill" *ngIf="n.attachments?.length">📎 {{ n.attachments.length }}</span>
          </div>
        </div>
      </a>
      <div class="empty-filter" *ngIf="!filteredNotices.length">No notices of this type right now</div>
    </ng-container>

    <div class="empty-state" *ngIf="notices.length === 0">
      <div class="empty-icon">📋</div>
      <p>No notices yet</p>
      <small>Check back soon for society announcements</small>
    </div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
    .page{min-height:100vh;background:#faf8f4;padding-bottom:80px;font-family:'Source Serif 4',Georgia,serif}

    /* ── Alert shelf ─────────────────────────────────────────────────────── */
    .alert-shelf{background:#1a1a1a;padding:12px 16px;display:flex;flex-direction:column;gap:10px;border-bottom:2px solid #c9a84c}
    .shelf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
    .shelf-label{font-size:11px;color:#c9a84c;font-weight:700;letter-spacing:1px;text-transform:uppercase}
    .shelf-dismiss-all{background:none;border:1px solid #444;color:#888;font-size:11px;padding:4px 10px;border-radius:12px;cursor:pointer;font-family:'Source Serif 4',serif;transition:all 0.15s}
    .shelf-dismiss-all:hover{border-color:#c9a84c;color:#c9a84c}

    .alert-card{display:flex;border-radius:10px;overflow:hidden;position:relative;animation:slideDown 0.3s ease-out}
    .alert-card.urgent{background:#fff5f5;border:1.5px solid #fca5a5;animation:slideDown 0.3s ease-out,urgentPulse 3s 0.3s ease-in-out infinite}
    .alert-card.high{background:#fffbeb;border:1.5px solid #fcd34d}
    @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes urgentPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 0 4px rgba(239,68,68,0.2)}}

    .ac-stripe{width:5px;flex-shrink:0}
    .ac-body{padding:11px 12px;flex:1;min-width:0}
    .ac-top{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}
    .ac-type{font-size:11px;font-weight:700}
    .ac-priority{font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;letter-spacing:0.5px}
    .urgent-tag{background:#fee2e2;color:#dc2626}
    .high-tag{background:#fef3c7;color:#92400e}
    .ac-new{background:#ef4444;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;letter-spacing:0.5px}
    .ac-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 4px;line-height:1.3}
    .ac-preview{font-size:12px;color:#6b7280;margin:0 0 8px;line-height:1.4}
    .ac-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}
    .ac-ack-warn{font-size:11px;color:#92400e;font-weight:600}
    .ac-view{font-size:12px;font-weight:700;color:#c9a84c;text-decoration:none;font-family:'Source Serif 4',serif;border-bottom:1px solid transparent;transition:border-color 0.15s}
    .ac-view:hover{border-bottom-color:#c9a84c}
    .ac-close{position:absolute;top:8px;right:8px;background:none;border:none;color:#9ca3af;font-size:14px;cursor:pointer;padding:2px 6px;border-radius:4px;transition:color 0.15s;line-height:1}
    .ac-close:hover{color:#374151}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .post-btn{background:rgba(255,255,255,0.15);color:white;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none}
    .filter-strip{display:flex;gap:0;overflow-x:auto;background:#1a1a1a;border-bottom:2px solid #333;padding:0 12px}
    .fc{background:none;border:none;color:#666;padding:10px 12px;font-size:11px;letter-spacing:0.5px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;font-family:'Source Serif 4',serif}
    .fc.active{color:#c9a84c;border-bottom-color:#c9a84c}
    .loading{display:flex;justify-content:center;padding:60px}
    .sp{width:28px;height:28px;border:2px solid #e5e0d8;border-top-color:#c9a84c;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .feed{padding:16px;display:flex;flex-direction:column}
    .urgent-banner{display:flex;margin-bottom:14px;border-radius:8px;overflow:hidden;background:#fff5f5;border:1.5px solid #fca5a5;box-shadow:0 2px 12px rgba(239,68,68,0.15);cursor:pointer;animation:urgentPulse 3s ease-in-out infinite}
    @keyframes urgentPulse{0%,100%{box-shadow:0 2px 12px rgba(239,68,68,0.15)}50%{box-shadow:0 4px 20px rgba(239,68,68,0.3)}}
    .ub-stripe{width:6px;background:linear-gradient(180deg,#ef4444,#dc2626);flex-shrink:0}
    .ub-body{padding:14px 14px 12px;flex:1}
    .ub-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
    .ub-tag{font-size:11px;font-weight:700;color:#dc2626;letter-spacing:1px}
    .ub-pin{font-size:11px;color:#6b7280}
    .ub-new{background:#dc2626;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;letter-spacing:1px}
    .ub-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 6px;line-height:1.3}
    .ub-preview{font-size:13px;color:#4b5563;margin:0 0 10px;line-height:1.5}
    .ub-meta{display:flex;gap:10px;font-size:11px;color:#9ca3af;flex-wrap:wrap}
    .ub-ack{color:#dc2626;font-weight:600}
    .ub-ackd{color:#16a34a}
    .section-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;padding:14px 0 8px;display:flex;align-items:center;gap:6px;border-top:1px solid #e5e0d8;margin-top:4px}
    .group-count{background:#e5e0d8;color:#6b7280;font-size:10px;padding:1px 6px;border-radius:8px}
    .notice-card{display:flex;background:#fff;border:1px solid #e5e0d8;border-radius:8px;margin-bottom:10px;text-decoration:none;overflow:hidden;border-left:4px solid #e5e0d8;transition:transform 0.15s,box-shadow 0.15s}
    .notice-card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.08)}
    .notice-card.unread{background:#fffef9}
    .notice-card.unread .card-title{font-weight:800}
    .notice-card.has-ack{border-right:3px solid #f59e0b}
    .notice-card.pinned-card{border:1.5px solid #c9a84c;border-left:4px solid #c9a84c}
    .card-body{padding:12px 14px;flex:1;min-width:0}
    .card-top{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}
    .type-pill{font-size:11px;font-weight:600}
    .new-dot{background:#ef4444;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;letter-spacing:0.5px}
    .high-tag{background:#fef3c7;color:#92400e;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px}
    .read-tag{color:#d1c9bc;font-size:12px;margin-left:auto}
    .card-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#1a1a1a;margin:0 0 4px;line-height:1.3}
    .card-preview{font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.4}
    .card-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .card-author{font-size:11px;color:#9ca3af;font-style:italic}
    .card-date{font-size:11px;color:#d1c9bc}
    .ack-pill{font-size:10px;color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:8px;font-weight:600;margin-left:auto}
    .attach-pill{font-size:11px;color:#9ca3af}
    .empty-state{text-align:center;padding:60px 20px}
    .empty-icon{font-size:48px;margin-bottom:12px}
    .empty-state p{font-family:'Playfair Display',serif;font-size:18px;color:#4b5563;margin:0 0 6px}
    .empty-state small{font-size:13px;color:#9ca3af}
    .empty-filter{text-align:center;padding:30px;font-size:13px;color:#9ca3af;font-style:italic}
  `]
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
