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
  templateUrl: "./notice-detail.component.html",
  styleUrls: ["./notice-detail.component.scss"]
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
