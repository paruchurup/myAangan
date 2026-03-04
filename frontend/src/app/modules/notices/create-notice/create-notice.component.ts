import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NoticeService } from '../../../core/services/notice.service';

@Component({
  selector: 'app-create-notice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="page">
  <div class="hdr">
    <button class="back" routerLink="/notices/manage">← Back</button>
    <h1>📢 Post Notice</h1>
    <p>Broadcast an announcement to your society</p>
  </div>

  <div class="form">

    <!-- Type selector -->
    <div class="card">
      <h2>1 · Notice Type</h2>
      <div class="type-grid">
        <button *ngFor="let t of types" class="type-btn"
          [class.sel]="f.type===t.value" (click)="f.type=t.value"
          [style.border-color]="f.type===t.value ? t.accent : 'transparent'"
          [style.background]="f.type===t.value ? t.accent+'18' : '#f9fafb'">
          <span class="ti">{{ t.icon }}</span>
          <span class="tl" [style.color]="f.type===t.value ? t.accent : '#374151'">{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="card">
      <h2>2 · Content</h2>
      <label>Title *</label>
      <input type="text" [(ngModel)]="f.title" placeholder="Clear, concise headline" maxlength="300" />
      <div class="char-count">{{ f.title.length }}/300</div>

      <label>Body *</label>
      <textarea [(ngModel)]="f.content" rows="6"
        placeholder="Write the full notice content here. Be specific — residents will act on this information." maxlength="5000"></textarea>
      <div class="char-count">{{ f.content.length }}/5000</div>
    </div>

    <!-- Priority & settings -->
    <div class="card">
      <h2>3 · Priority &amp; Settings</h2>

      <label>Priority</label>
      <div class="priority-row">
        <button *ngFor="let p of priorities" class="priority-btn"
          [class.sel]="f.priority===p.value"
          [style.border-color]="f.priority===p.value ? p.color : 'transparent'"
          [style.background]="f.priority===p.value ? p.bg : '#f9fafb'"
          [style.color]="f.priority===p.value ? p.color : '#9ca3af'"
          (click)="f.priority=p.value">
          {{ p.label }}
        </button>
      </div>
      <div class="priority-hint">{{ priorityHint() }}</div>

      <div class="toggle-row">
        <div class="tr-label">
          <span>📌 Pin to top</span>
          <small>Always shows at the top of the notice board</small>
        </div>
        <label class="tog"><input type="checkbox" [(ngModel)]="f.pinned"/><span class="sl"></span></label>
      </div>

      <div class="toggle-row">
        <div class="tr-label">
          <span>⚠️ Require acknowledgement</span>
          <small>Residents must confirm they've read this notice</small>
        </div>
        <label class="tog"><input type="checkbox" [(ngModel)]="f.requiresAcknowledgement"/><span class="sl"></span></label>
      </div>

      <label>Target audience</label>
      <select [(ngModel)]="f.targetBlocks">
        <option value="">All residents &amp; staff</option>
        <option *ngFor="let b of blocks" [value]="b">Block {{ b }} only</option>
      </select>
    </div>

    <!-- Scheduling -->
    <div class="card">
      <h2>📅 Scheduling</h2>
      <p class="hint-p">Leave blank to publish manually. Set dates for auto-publish and auto-expire.</p>
      <label>Publish at (auto-publish)</label>
      <input type="datetime-local" [(ngModel)]="f.publishAt"
        style="color-scheme:dark;background:#1f2937;color:#e2e8f0;border:1.5px solid #374151;border-radius:10px;padding:10px;width:100%;box-sizing:border-box" />
      <label style="margin-top:12px">Expires at (auto-archive)</label>
      <input type="datetime-local" [(ngModel)]="f.expiresAt"
        style="color-scheme:dark;background:#1f2937;color:#e2e8f0;border:1.5px solid #374151;border-radius:10px;padding:10px;width:100%;box-sizing:border-box" />
    </div>

    <!-- Attachments -->
    <div class="card">
      <h2>📎 Attachments <span class="opt">optional</span></h2>
      <div class="file-drop" (click)="fileInput.click()">
        <span>📁 Tap to attach files</span>
        <small>Images, PDFs, documents · Max 5MB each</small>
      </div>
      <input #fileInput type="file" multiple style="display:none"
        accept="image/*,.pdf,.doc,.docx" (change)="onFiles($event)" />
      <div class="file-list" *ngIf="selectedFiles.length">
        <div class="file-item" *ngFor="let f of selectedFiles; let i=index">
          <span>{{ fileIcon(f) }} {{ f.name }}</span>
          <span class="file-size">{{ formatSize(f.size) }}</span>
          <button (click)="removeFile(i)">×</button>
        </div>
      </div>
    </div>

    <div class="err" *ngIf="error">{{ error }}</div>

    <div class="actions">
      <button class="draft-btn" (click)="submit(false)" [disabled]="submitting||!isValid()">
        {{ submitting ? 'Saving…' : '💾 Save Draft' }}
      </button>
      <button class="pub-btn" (click)="submit(true)" [disabled]="submitting||!isValid()">
        {{ submitting ? 'Publishing…' : '📢 Publish Now' }}
      </button>
    </div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Serif+4:wght@400;600&display=swap');
    .page{min-height:100vh;background:#faf8f4;padding-bottom:80px;font-family:'Source Serif 4',Georgia,serif}
    .hdr{background:#1a1a1a;padding:20px 20px 24px;color:#faf8f4;border-bottom:3px solid #c9a84c}
    .back{background:rgba(255,255,255,0.1);border:none;color:#c9a84c;padding:6px 14px;border-radius:20px;font-size:12px;cursor:pointer;margin-bottom:12px;display:block;font-family:'Source Serif 4',serif}
    h1{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;margin:0 0 4px}
    .hdr p{font-size:13px;color:rgba(255,255,255,0.5);margin:0}
    .form{padding:14px;display:flex;flex-direction:column;gap:14px}
    .card{background:#fff;border:1px solid #e5e0d8;border-radius:12px;padding:16px}
    h2{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px}
    label{display:block;color:#6b7280;font-size:12px;font-weight:600;margin-bottom:4px;margin-top:12px}
    label:first-of-type{margin-top:0}
    input[type=text],textarea,select{width:100%;background:#faf8f4;border:1.5px solid #e5e0d8;border-radius:8px;color:#1a1a1a;padding:10px 12px;font-size:14px;font-family:'Source Serif 4',serif;outline:none;box-sizing:border-box;resize:vertical}
    input:focus,textarea:focus,select:focus{border-color:#c9a84c}
    .char-count{font-size:11px;color:#d1c9bc;text-align:right;margin-top:3px}
    .hint-p{font-size:12px;color:#9ca3af;margin:0 0 12px;font-style:italic}

    /* Type grid */
    .type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .type-btn{border:1.5px solid transparent;border-radius:10px;padding:10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:all 0.15s}
    .ti{font-size:20px}
    .tl{font-size:11px;font-weight:600;font-family:'Source Serif 4',serif}

    /* Priority */
    .priority-row{display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap}
    .priority-btn{border:1.5px solid transparent;border-radius:20px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:'Source Serif 4',serif}
    .priority-hint{font-size:11px;color:#9ca3af;font-style:italic;margin-bottom:4px}

    /* Toggles */
    .toggle-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid #f3f0ea}
    .tr-label{display:flex;flex-direction:column;gap:3px}
    .tr-label span{color:#374151;font-size:14px}
    .tr-label small{color:#9ca3af;font-size:11px}
    .tog{position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0}
    .tog input{opacity:0;width:0;height:0}
    .sl{position:absolute;inset:0;background:#e5e0d8;border-radius:24px;transition:0.2s;cursor:pointer}
    .sl:before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:0.2s}
    input:checked+.sl{background:#c9a84c}
    input:checked+.sl:before{transform:translateX(20px)}

    /* File upload */
    .file-drop{border:2px dashed #e5e0d8;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:border-color 0.15s}
    .file-drop:hover{border-color:#c9a84c}
    .file-drop span{display:block;font-size:14px;color:#6b7280;margin-bottom:4px}
    .file-drop small{font-size:11px;color:#9ca3af}
    .file-list{display:flex;flex-direction:column;gap:6px;margin-top:10px}
    .file-item{display:flex;align-items:center;gap:8px;background:#faf8f4;border:1px solid #e5e0d8;border-radius:8px;padding:8px 12px;font-size:13px;color:#374151}
    .file-size{color:#9ca3af;font-size:11px;margin-left:auto}
    .file-item button{background:none;border:none;color:#9ca3af;font-size:16px;cursor:pointer}
    .opt{font-size:10px;color:#9ca3af;font-family:'Source Serif 4',serif;font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px}

    .err{background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;padding:12px 16px;border-radius:8px;font-size:13px}
    .actions{display:flex;gap:10px}
    .draft-btn{flex:1;padding:13px;background:#fff;border:1.5px solid #e5e0d8;color:#6b7280;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Source Serif 4',serif}
    .pub-btn{flex:2;padding:13px;background:#1a1a1a;border:none;color:#c9a84c;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Playfair Display',serif}
    .pub-btn:disabled,.draft-btn:disabled{opacity:0.4;cursor:not-allowed}
  `]
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
