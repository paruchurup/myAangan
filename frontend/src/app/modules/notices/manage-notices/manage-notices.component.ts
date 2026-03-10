import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoticeService } from '@services/notice.service';
import { Notice, NOTICE_TYPE_CONFIG, NOTICE_PRIORITY_CONFIG } from '@models/notice.model';

@Component({
  selector: 'app-manage-notices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./manage-notices.component.html",
  styleUrls: ["./manage-notices.component.scss"]
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
