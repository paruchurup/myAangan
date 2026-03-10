import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NoticeService } from '@services/notice.service';

@Component({
  selector: 'app-create-notice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./create-notice.component.html",
  styleUrls: ["./create-notice.component.scss"]
})
export class CreateNoticeComponent {
  f = {
    title: '', content: '', type: 'GENERAL', priority: 'NORMAL',
    pinned: false, requiresAcknowledgement: false,
    targetBlocks: '', publishAt: '', expiresAt: ''
  };
  selectedFiles: File[] = [];
  submitting = false;
  error = '';
  blocks = ['A','B','C','D','E','F'];

  types = [
    { value:'GENERAL',     icon:'📋', label:'General',     accent:'#3b82f6' },
    { value:'MAINTENANCE', icon:'🔧', label:'Maintenance', accent:'#f59e0b' },
    { value:'EVENT',       icon:'🎉', label:'Event',       accent:'#8b5cf6' },
    { value:'EMERGENCY',   icon:'🚨', label:'Emergency',   accent:'#ef4444' },
    { value:'RULE_CHANGE', icon:'📜', label:'Rule Change', accent:'#06b6d4' },
    { value:'FINANCIAL',   icon:'💰', label:'Financial',   accent:'#10b981' },
  ];

  priorities = [
    { value:'LOW',    label:'Low',    color:'#6b7280', bg:'#f3f4f6' },
    { value:'NORMAL', label:'Normal', color:'#374151', bg:'#f9fafb' },
    { value:'HIGH',   label:'High',   color:'#92400e', bg:'#fef3c7' },
    { value:'URGENT', label:'🚨 Urgent',color:'#7f1d1d',bg:'#fee2e2' },
  ];

  constructor(private svc: NoticeService, private router: Router) {}

  priorityHint(): string {
    const hints: Record<string,string> = {
      LOW: 'Informational — low visibility',
      NORMAL: 'Standard notice in the feed',
      HIGH: 'Highlighted — residents attention needed',
      URGENT: 'Pinned at top with pulsing alert — use sparingly',
    };
    return hints[this.f.priority] || '';
  }

  onFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.selectedFiles.push(...Array.from(input.files));
  }
  removeFile(i: number) { this.selectedFiles.splice(i, 1); }
  fileIcon(f: File) { return f.type.startsWith('image/') ? '🖼️' : f.name.endsWith('.pdf') ? '📄' : '📎'; }
  formatSize(b: number) { return b < 1024*1024 ? (b/1024).toFixed(0)+'KB' : (b/1024/1024).toFixed(1)+'MB'; }
  isValid() { return this.f.title.trim() && this.f.content.trim(); }

  submit(publishNow: boolean) {
    if (!this.isValid()) { this.error = 'Title and content are required.'; return; }
    this.submitting = true; this.error = '';

    const data = {
      title: this.f.title.trim(),
      content: this.f.content.trim(),
      type: this.f.type,
      priority: this.f.priority,
      pinned: this.f.pinned,
      requiresAcknowledgement: this.f.requiresAcknowledgement,
      targetBlocks: this.f.targetBlocks || null,
      publishAt: this.f.publishAt || null,
      expiresAt: this.f.expiresAt || null,
    };

    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    for (const file of this.selectedFiles) fd.append('files', file);

    this.svc.create(fd).subscribe({
      next: r => {
        if (publishNow) {
          this.svc.publish(r.data.id).subscribe({
            next: () => this.router.navigate(['/notices', r.data.id]),
            error: () => this.router.navigate(['/notices/manage'])
          });
        } else {
          this.router.navigate(['/notices/manage']);
        }
      },
      error: e => { this.error = e.error?.message || 'Failed to create notice.'; this.submitting = false; }
    });
  }
}
