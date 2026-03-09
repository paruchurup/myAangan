import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoticeService } from '@services/notice.service';
import { Notice, NOTICE_TYPE_CONFIG, NOTICE_PRIORITY_CONFIG } from '@models/notice.model';

@Component({
  selector: 'app-manage-notices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/notices">← Back</a>
      <a routerLink="/notices/create" class="new-btn">+ New Notice</a>
    </div>
    <h1>⚙️ Manage Notices</h1>
    <p>Edit and remove notices</p>

    <!-- Stats row -->
    <div class="stats-row" *ngIf="!loading">
      <div class="stat">
        <span class="sn">{{ count('PUBLISHED') }}</span>
        <span class="sl">Live</span>
      </div>
      <div class="stat-div"></div>
      <div class="stat">
        <span class="sn">{{ count('DRAFT') }}</span>
        <span class="sl">Drafts</span>
      </div>
      <div class="stat-div"></div>
      <div class="stat">
        <span class="sn">{{ totalReads }}</span>
        <span class="sl">Total Reads</span>
      </div>
    </div>
  </div>

  <div class="loading" *ngIf="loading"><div class="sp"></div></div>

  <div class="body" *ngIf="!loading">
    <!-- Tabs -->
    <div class="tabs">
      <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab===t.v" (click)="activeTab=t.v">
        {{ t.label }} <span class="tc" *ngIf="count(t.v)">{{ count(t.v) }}</span>
      </button>
    </div>

    <!-- Notice list -->
    <div class="list">
      <div class="mn-card" *ngFor="let n of filtered()">
        <div class="mn-top">
          <span class="type-tag" [style.color]="typeAccent(n.type)" [style.background]="typeAccent(n.type)+'15'">
            {{ typeIcon(n.type) }} {{ typeLabel(n.type) }}
          </span>
          <span class="priority-tag"
            [style.background]="priorityBg(n)" [style.color]="priorityColor(n)"
            *ngIf="n.priority!=='NORMAL'">{{ n.priority }}</span>
          <span class="pin-tag" *ngIf="n.pinned">📌</span>
          <span class="status-tag" [class.pub]="n.status==='PUBLISHED'" [class.draft]="n.status==='DRAFT'" [class.arch]="n.status==='ARCHIVED'">
            {{ n.status }}
          </span>
          <div class="mn-actions">
            <button class="act pub"  *ngIf="n.status==='DRAFT'"     (click)="publish(n)">▶ Publish</button>
            <button class="act arch" *ngIf="n.status==='PUBLISHED'" (click)="archive(n)">📦 Archive</button>
            <button class="act pin"  (click)="pin(n)">{{ n.pinned ? 'Unpin' : '📌' }}</button>
            <button class="act del"  *ngIf="n.status!=='PUBLISHED'" (click)="del(n)">🗑</button>
          </div>
        </div>

        <a class="mn-title" [routerLink]="['/notices', n.id]">{{ n.title }}</a>

        <p class="mn-preview">{{ n.content | slice:0:80 }}{{ n.content.length > 80 ? '…' : '' }}</p>

        <div class="mn-meta">
          <span>{{ n.createdByName }}</span>
          <span *ngIf="n.publishedAt">· Published {{ n.publishedAt | date:'MMM d' }}</span>
          <span *ngIf="n.expiresAt">· Expires {{ n.expiresAt | date:'MMM d' }}</span>
          <span *ngIf="n.targetBlocks">· Block {{ n.targetBlocks }}</span>
          <span *ngIf="n.requiresAcknowledgement">· ⚠ Ack required</span>
        </div>

        <!-- Read analytics for published notices -->
        <div class="mn-analytics" *ngIf="n.status==='PUBLISHED'">
          <div class="an-item">
            <span class="an-n">{{ n.readCount }}</span>
            <span class="an-l">reads</span>
          </div>
          <div class="an-item" *ngIf="n.requiresAcknowledgement">
            <span class="an-n ack">{{ n.acknowledgedCount }}</span>
            <span class="an-l">acknowledged</span>
          </div>
          <div class="an-bar" *ngIf="n.readCount > 0">
            <div class="an-fill" [style.width.%]="readPct(n)"></div>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="!filtered().length">
        <div>{{ activeTab==='ARCHIVED' ? '📦' : '📋' }}</div>
        <p>No {{ activeTab.toLowerCase() }} notices</p>
        <a routerLink="/notices/create" class="empty-cta" *ngIf="activeTab==='DRAFT'||activeTab==='ALL'">
          Create your first notice →
        </a>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Serif+4:wght@400;600&display=swap');
    .page{min-height:100vh;background:#faf8f4;padding-bottom:80px;font-family:'Source Serif 4',Georgia,serif}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .new-btn{background:rgba(255,255,255,0.15);color:white;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap}
    .stats-row{display:flex;align-items:center;gap:12px;padding-top:12px}
    .stat{display:flex;flex-direction:column;align-items:center}
    .sn{font-size:20px;font-weight:800;color:white;line-height:1}
    .sl{font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px}
    .stat-div{width:1px;height:28px;background:rgba(255,255,255,0.2)}
    .loading{display:flex;justify-content:center;padding:60px}
    .sp{width:28px;height:28px;border:2px solid #e5e0d8;border-top-color:#c9a84c;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:14px}
    .tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}
    .tab{background:#fff;border:1.5px solid #e5e0d8;border-radius:20px;color:#6b7280;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;font-family:'Source Serif 4',serif;transition:all 0.15s}
    .tab.active{background:#1a1a1a;border-color:#1a1a1a;color:#c9a84c}
    .tc{background:#c9a84c;color:#1a1a1a;font-size:10px;padding:1px 6px;border-radius:10px}
    .list{display:flex;flex-direction:column;gap:10px}
    .mn-card{background:#fff;border:1px solid #e5e0d8;border-radius:10px;padding:14px}
    .mn-top{display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap}
    .type-tag{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
    .priority-tag{font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;letter-spacing:0.5px}
    .pin-tag{font-size:13px}
    .status-tag{font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;letter-spacing:0.5px}
    .status-tag.pub{background:#dcfce7;color:#166534}
    .status-tag.draft{background:#fef3c7;color:#92400e}
    .status-tag.arch{background:#f3f4f6;color:#6b7280}
    .mn-actions{display:flex;gap:6px;margin-left:auto}
    .act{border:none;border-radius:8px;font-size:12px;font-weight:600;padding:5px 10px;cursor:pointer;font-family:'Source Serif 4',serif}
    .act.pub{background:#dcfce7;color:#166534}
    .act.arch{background:#f3f4f6;color:#374151}
    .act.pin{background:#fef3c7;color:#92400e}
    .act.del{background:#fee2e2;color:#dc2626}
    .mn-title{display:block;font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:#1a1a1a;text-decoration:none;margin-bottom:6px;line-height:1.3}
    .mn-title:hover{color:#c9a84c}
    .mn-preview{font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.4}
    .mn-meta{display:flex;gap:8px;font-size:11px;color:#9ca3af;flex-wrap:wrap;margin-bottom:8px}
    .mn-analytics{display:flex;align-items:center;gap:12px;padding-top:8px;border-top:1px solid #f3f0ea}
    .an-item{display:flex;flex-direction:column;align-items:center}
    .an-n{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#374151;line-height:1}
    .an-n.ack{color:#c9a84c}
    .an-l{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px}
    .an-bar{flex:1;height:6px;background:#f3f0ea;border-radius:3px;overflow:hidden}
    .an-fill{height:100%;background:linear-gradient(90deg,#c9a84c,#f59e0b);border-radius:3px;transition:width 0.8s}
    .empty{text-align:center;padding:50px 20px}
    .empty div{font-size:40px;margin-bottom:8px}
    .empty p{font-family:'Playfair Display',serif;font-size:17px;color:#6b7280;margin:0 0 16px}
    .empty-cta{background:#1a1a1a;color:#c9a84c;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;display:inline-block;font-family:'Source Serif 4',serif}
  `]
})
export class ManageNoticesComponent implements OnInit {
  notices: Notice[] = [];
  loading = true;
  activeTab = 'ALL';

  tabs = [
    { v:'ALL',       label:'All' },
    { v:'PUBLISHED', label:'▶ Live' },
    { v:'DRAFT',     label:'✏️ Drafts' },
    { v:'ARCHIVED',  label:'📦 Archived' },
  ];

  constructor(private svc: NoticeService) {}

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: r => { this.notices = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  filtered() {
    return this.activeTab === 'ALL' ? this.notices
      : this.notices.filter(n => n.status === this.activeTab);
  }
  count(s: string) { return s === 'ALL' ? this.notices.length : this.notices.filter(n => n.status === s).length; }
  get totalReads() { return this.notices.reduce((a,n) => a + (n.readCount||0), 0); }
  readPct(n: Notice) { return n.readCount > 0 ? Math.min(100, n.readCount / Math.max(1, n.readCount) * 100) : 0; }

  publish(n: Notice) { this.svc.publish(n.id).subscribe(r => this.update(r.data)); }
  archive(n: Notice) { this.svc.archive(n.id).subscribe(r => this.update(r.data)); }
  pin(n: Notice)     { this.svc.togglePin(n.id).subscribe(r => this.update(r.data)); }
  del(n: Notice) {
    if (!confirm(`Delete "${n.title.slice(0,50)}"?`)) return;
    this.svc.delete(n.id).subscribe(() => this.notices = this.notices.filter(x => x.id !== n.id));
  }
  update(updated: Notice) {
    const i = this.notices.findIndex(n => n.id === updated.id);
    if (i >= 0) this.notices[i] = updated;
  }

  typeIcon(t: string)    { return (NOTICE_TYPE_CONFIG as any)[t]?.icon   || '📋'; }
  typeLabel(t: string)   { return (NOTICE_TYPE_CONFIG as any)[t]?.label  || t; }
  typeAccent(t: string)  { return (NOTICE_TYPE_CONFIG as any)[t]?.accent || '#6b7280'; }
  priorityBg(n: Notice)  { return (NOTICE_PRIORITY_CONFIG as any)[n.priority]?.bg    || '#f3f4f6'; }
  priorityColor(n: Notice){ return (NOTICE_PRIORITY_CONFIG as any)[n.priority]?.color || '#374151'; }
}
