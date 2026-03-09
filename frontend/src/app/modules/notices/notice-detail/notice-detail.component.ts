import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NoticeService } from '@services/notice.service';
import { AuthService } from '@services/auth.service';
import { Notice, NOTICE_TYPE_CONFIG, NOTICE_PRIORITY_CONFIG } from '@models/notice.model';

@Component({
  selector: 'app-notice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="page" *ngIf="notice">

  <!-- Header -->
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/notices">← Back</a>
    </div>
    <h1>{{ notice.title }}</h1>
    <p>{{ typeLabel() }}</p>
    <div class="badges">
      <span class="type-badge" [style.background]="typeAccentFaint()" [style.color]="typeAccent()">
        {{ typeIcon() }} {{ typeLabel() }}
      </span>
      <span class="priority-badge"
        [style.background]="priorityBg()" [style.color]="priorityColor()"
        *ngIf="notice.priority !== 'NORMAL'">{{ notice.priority }}</span>
      <span class="pinned-badge" *ngIf="notice.pinned">📌 Pinned</span>
    </div>
    <div class="byline">
      <span>By {{ notice.createdByName }}</span>
      <span class="dot">·</span>
      <span>{{ notice.publishedAt | date:'MMMM d, y, h:mm a' }}</span>
      <span class="dot" *ngIf="notice.expiresAt">·</span>
      <span class="expires" *ngIf="notice.expiresAt">Expires {{ notice.expiresAt | date:'MMM d' }}</span>
    </div>
    <div class="read-stat" *ngIf="canManage">
      <span class="rs-item">👁 {{ notice.readCount }} read</span>
      <span class="rs-item" *ngIf="notice.requiresAcknowledgement">✓ {{ notice.acknowledgedCount }} acknowledged</span>
    </div>
  </div>

  <div class="body">

    <!-- URGENT callout -->
    <div class="urgent-callout" *ngIf="notice.priority === 'URGENT'">
      🚨 This is an urgent notice requiring your immediate attention.
    </div>

    <!-- Acknowledgement required (not yet done) -->
    <div class="ack-required" *ngIf="notice.requiresAcknowledgement && !notice.acknowledged">
      <div class="ack-req-text">
        <strong>⚠️ Acknowledgement Required</strong>
        <span>Please read and confirm you have received this notice</span>
      </div>
      <button class="ack-btn" (click)="doAcknowledge()" [disabled]="acking">
        {{ acking ? 'Confirming…' : '✓ I Acknowledge' }}
      </button>
    </div>

    <!-- Acknowledged confirmation -->
    <div class="ack-done" *ngIf="notice.requiresAcknowledgement && notice.acknowledged">
      ✅ You acknowledged this notice
    </div>

    <!-- Notice content -->
    <div class="content-card">
      <div class="content-body">{{ notice.content }}</div>
    </div>

    <!-- Attachments -->
    <div class="attachments-card" *ngIf="notice.attachments?.length">
      <h2>📎 Attachments</h2>
      <div class="attach-list">
        <a *ngFor="let a of notice.attachments" [href]="a.downloadUrl"
           target="_blank" class="attach-item">
          <span class="attach-icon">{{ fileIcon(a.fileType) }}</span>
          <div class="attach-info">
            <span class="attach-name">{{ a.originalName }}</span>
            <span class="attach-size">{{ formatSize(a.fileSize) }}</span>
          </div>
          <span class="attach-arrow">↓</span>
        </a>
      </div>
    </div>

    <!-- Reader analytics (managers only) -->
    <div class="readers-card" *ngIf="canManage && readers.length">
      <div class="readers-head" (click)="showReaders=!showReaders">
        <h2>👥 Read By <span class="rc">{{ readers.length }}</span></h2>
        <span class="toggle-arr">{{ showReaders ? '▲' : '▼' }}</span>
      </div>
      <div class="readers-list" *ngIf="showReaders">
        <div class="reader-row" *ngFor="let r of readers">
          <div class="rr-name">{{ r.name }}</div>
          <div class="rr-role">{{ r.role }}</div>
          <div class="rr-flat">{{ r.flat || '—' }}</div>
          <div class="rr-ack">
            <span class="ack-yes" *ngIf="r.acknowledged">✓ Acked</span>
            <span class="ack-no"  *ngIf="!r.acknowledged && notice.requiresAcknowledgement">Pending</span>
          </div>
          <div class="rr-time">{{ r.readAt | date:'MMM d, h:mm a' }}</div>
        </div>
        <div class="no-readers" *ngIf="!readers.length">No one has read this yet</div>
      </div>
    </div>

    <!-- Comments -->
    <div class="comments-card">
      <h2>💬 Discussion <span class="cc">{{ notice.comments?.length || 0 }}</span></h2>
      <div class="comment-list">
        <div class="comment" *ngFor="let c of notice.comments">
          <div class="cm-head">
            <strong>{{ c.authorName }}</strong>
            <span class="cm-role">{{ c.authorRole }}</span>
            <span *ngIf="c.authorFlat" class="cm-flat">{{ c.authorFlat }}</span>
            <span class="cm-time">{{ c.createdAt | date:'MMM d, h:mm a' }}</span>
            <button class="cm-del" *ngIf="c.canDelete || canManage" (click)="delComment(c.id)">×</button>
          </div>
          <p class="cm-body">{{ c.text }}</p>
        </div>
        <div class="no-comments" *ngIf="!notice.comments?.length">Be the first to comment</div>
      </div>
      <div class="add-comment" *ngIf="notice.status !== 'ARCHIVED'">
        <textarea [(ngModel)]="newComment" placeholder="Add your comment…" rows="2"></textarea>
        <button (click)="submitComment()" [disabled]="!newComment.trim()">Post</button>
      </div>
    </div>

    <!-- Manage actions -->
    <div class="manage-card" *ngIf="canManage">
      <h2>⚙️ Manage</h2>
      <div class="manage-row">
        <button class="mb pin" (click)="doPin()">
          {{ notice.pinned ? '📌 Unpin' : '📌 Pin' }}
        </button>
        <button class="mb pub" *ngIf="notice.status==='DRAFT'" (click)="doPublish()">▶ Publish</button>
        <button class="mb arch" *ngIf="notice.status==='PUBLISHED'" (click)="doArchive()">📦 Archive</button>
        <button class="mb del" *ngIf="notice.status!=='PUBLISHED'" (click)="doDelete()">🗑 Delete</button>
        <a class="mb edit" routerLink="/notices/manage">All Notices</a>
      </div>
    </div>
  </div>
</div>

<div class="loading" *ngIf="!notice && loading"><div class="sp"></div></div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
    .page{min-height:100vh;background:#faf8f4;padding-bottom:80px;font-family:'Source Serif 4',Georgia,serif}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 10px}
    .badges{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
    .type-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
    .priority-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px}
    .pinned-badge{font-size:11px;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:20px}
    .byline{display:flex;gap:6px;font-size:12px;color:rgba(255,255,255,0.7);flex-wrap:wrap;align-items:center;margin-top:8px}
    .dot{color:rgba(255,255,255,0.4)}
    .expires{color:#fbbf24}
    .read-stat{display:flex;gap:14px;margin-top:10px}
    .rs-item{font-size:12px;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:8px}
    .loading{display:flex;justify-content:center;padding:60px}
    .sp{width:28px;height:28px;border:2px solid #e5e0d8;border-top-color:#c9a84c;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:14px;display:flex;flex-direction:column;gap:12px}

    .urgent-callout{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 16px;font-size:13px;color:#dc2626;font-weight:600}

    .ack-required{background:#fffbeb;border:1.5px solid #fbbf24;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .ack-req-text{display:flex;flex-direction:column;gap:3px}
    .ack-req-text strong{color:#92400e;font-size:14px}
    .ack-req-text span{color:#6b7280;font-size:12px}
    .ack-btn{background:#f59e0b;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'Source Serif 4',serif}
    .ack-btn:disabled{opacity:0.5}
    .ack-done{background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 16px;font-size:13px;color:#16a34a;font-weight:600}

    .content-card{background:#fff;border:1px solid #e5e0d8;border-radius:10px;padding:20px}
    .content-body{font-size:15px;color:#374151;line-height:1.8;white-space:pre-wrap;font-family:'Source Serif 4',serif}

    .attachments-card,.readers-card,.comments-card,.manage-card{background:#fff;border:1px solid #e5e0d8;border-radius:10px;padding:16px}
    h2{font-family:'Playfair Display',serif;font-size:15px;color:#1a1a1a;margin:0 0 12px;display:flex;align-items:center;gap:8px}
    .cc{background:#e5e0d8;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:10px}
    .rc{background:#e5e0d8;color:#6b7280;font-size:11px;padding:2px 8px;border-radius:10px}

    .attach-list{display:flex;flex-direction:column;gap:8px}
    .attach-item{display:flex;align-items:center;gap:10px;background:#faf8f4;border:1px solid #e5e0d8;border-radius:8px;padding:10px 12px;text-decoration:none;transition:background 0.15s}
    .attach-item:hover{background:#f3f0ea}
    .attach-icon{font-size:20px;flex-shrink:0}
    .attach-info{flex:1;min-width:0}
    .attach-name{display:block;font-size:13px;color:#374151;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .attach-size{font-size:11px;color:#9ca3af}
    .attach-arrow{color:#9ca3af;font-size:16px}

    .readers-head{display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:0}
    .readers-head h2{margin-bottom:0}
    .toggle-arr{color:#9ca3af;font-size:14px}
    .readers-list{margin-top:12px;display:flex;flex-direction:column;gap:6px;max-height:250px;overflow-y:auto}
    .reader-row{display:grid;grid-template-columns:1.5fr 1fr 0.6fr 0.8fr 1.2fr;gap:6px;padding:7px 0;border-bottom:1px solid #f3f0ea;font-size:12px;align-items:center}
    .rr-name{color:#374151;font-weight:600}
    .rr-role,.rr-flat,.rr-time{color:#9ca3af}
    .ack-yes{color:#16a34a;font-weight:600}
    .ack-no{color:#f59e0b;font-size:11px}

    .comment-list{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:320px;overflow-y:auto}
    .comment{background:#faf8f4;border-radius:8px;padding:12px}
    .cm-head{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}
    .cm-head strong{color:#1a1a1a;font-size:13px}
    .cm-role{font-size:10px;color:#9ca3af;background:#e5e0d8;padding:1px 6px;border-radius:6px}
    .cm-flat{font-size:10px;color:#9ca3af}
    .cm-time{font-size:11px;color:#d1c9bc;margin-left:auto}
    .cm-del{background:none;border:none;color:#d1c9bc;font-size:16px;cursor:pointer;padding:0 4px}
    .cm-body{font-size:13px;color:#4b5563;margin:0;line-height:1.5}
    .no-comments{color:#9ca3af;font-size:13px;text-align:center;padding:20px;font-style:italic}
    .add-comment{display:flex;flex-direction:column;gap:8px}
    .add-comment textarea{width:100%;padding:10px;background:#faf8f4;border:1.5px solid #e5e0d8;border-radius:8px;color:#374151;font-size:13px;outline:none;font-family:'Source Serif 4',serif;resize:vertical;box-sizing:border-box}
    .add-comment textarea:focus{border-color:#c9a84c}
    .add-comment button{align-self:flex-end;background:#1a1a1a;color:#faf8f4;border:none;padding:9px 22px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Source Serif 4',serif}
    .add-comment button:disabled{opacity:0.4}

    .manage-row{display:flex;gap:8px;flex-wrap:wrap}
    .mb{padding:9px 16px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;font-family:'Source Serif 4',serif}
    .mb.pin{background:#fef3c7;color:#92400e}
    .mb.pub{background:#dcfce7;color:#166534}
    .mb.arch{background:#f3f4f6;color:#374151}
    .mb.del{background:#fee2e2;color:#dc2626}
    .mb.edit{background:#f3f4f6;color:#6b7280}
  `]
})
export class NoticeDetailComponent implements OnInit {
  notice: Notice | null = null;
  readers: any[] = [];
  loading = true;
  canManage = false;
  acking = false;
  newComment = '';
  showReaders = false;

  constructor(
    private route: ActivatedRoute,
    private svc: NoticeService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.canManage = this.auth.can('NOTICE_MANAGE');
    this.load();
  }

  load() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: r => {
        this.notice = r.data;
        this.loading = false;
        if (!this.notice.read) this.svc.markRead(id).subscribe();
        if (this.canManage) this.svc.getReaders(id).subscribe(res => this.readers = res.data);
      },
      error: () => this.loading = false
    });
  }

  doAcknowledge() {
    this.acking = true;
    this.svc.acknowledge(this.notice!.id).subscribe({
      next: r => { this.notice = r.data; this.acking = false; },
      error: () => this.acking = false
    });
  }

  submitComment() {
    if (!this.notice || !this.newComment.trim()) return;
    this.svc.addComment(this.notice.id, this.newComment).subscribe({
      next: () => { this.newComment = ''; this.load(); }
    });
  }

  delComment(id: number) {
    this.svc.deleteComment(id).subscribe({ next: () => this.load() });
  }

  doPublish() { this.svc.publish(this.notice!.id).subscribe(r => this.notice = r.data); }
  doArchive() { this.svc.archive(this.notice!.id).subscribe(r => this.notice = r.data); }
  doPin()     { this.svc.togglePin(this.notice!.id).subscribe(r => this.notice = r.data); }
  doDelete()  {
    if (!confirm('Delete this notice permanently?')) return;
    this.svc.delete(this.notice!.id).subscribe(() => history.back());
  }

  typeIcon()       { return (NOTICE_TYPE_CONFIG as any)[this.notice!.type]?.icon   || '📋'; }
  typeLabel()      { return (NOTICE_TYPE_CONFIG as any)[this.notice!.type]?.label  || this.notice!.type; }
  typeAccent()     { return (NOTICE_TYPE_CONFIG as any)[this.notice!.type]?.accent || '#6b7280'; }
  typeAccentFaint(){ const c = this.typeAccent(); return c + '18'; }
  priorityBg()     { return (NOTICE_PRIORITY_CONFIG as any)[this.notice!.priority]?.bg    || '#f3f4f6'; }
  priorityColor()  { return (NOTICE_PRIORITY_CONFIG as any)[this.notice!.priority]?.color || '#374151'; }
  fileIcon(t: string) { return t === 'IMAGE' ? '🖼️' : t === 'PDF' ? '📄' : '📎'; }
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1024/1024).toFixed(1) + ' MB';
  }
}
