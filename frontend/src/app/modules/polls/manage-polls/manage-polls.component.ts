import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PollService } from '@services/poll.service';
import { Poll, POLL_STATUS_CONFIG, POLL_TYPE_CONFIG } from '@models/poll.model';

@Component({
  selector: 'app-manage-polls',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/polls">← Back</a>
    </div>
    <h1>⚙️ Manage Polls</h1>
    <p>Edit and close polls</p>
  </div>

  <div class="loading" *ngIf="loading"><div class="sp"></div></div>

  <div class="body" *ngIf="!loading">
    <!-- Filter tabs -->
    <div class="tabs">
      <button *ngFor="let f of filters" class="tab" [class.active]="activeFilter===f.v" (click)="activeFilter=f.v">
        {{ f.label }} <span class="tc" *ngIf="count(f.v)">{{ count(f.v) }}</span>
      </button>
    </div>

    <div class="list">
      <div class="mp-card" *ngFor="let p of filtered()">
        <div class="mc-top">
          <span class="st" [style.background]="stBg(p)" [style.color]="stColor(p)">{{ stLabel(p) }}</span>
          <span class="type-chip">{{ typeIcon(p.type) }} {{ typeLabel(p.type) }}</span>
          <span class="anon" *ngIf="p.anonymous">🔒 Anon</span>
          <div class="mc-actions">
            <button class="act pub"   *ngIf="p.status==='DRAFT'"  (click)="publish(p)">▶ Publish</button>
            <button class="act close" *ngIf="p.status==='ACTIVE'" (click)="close(p)">⏹ Close</button>
            <button class="act arch"  *ngIf="p.status==='CLOSED'" (click)="archive(p)">📦</button>
            <button class="act del"   *ngIf="p.status!=='ACTIVE'" (click)="delete(p)">🗑</button>
          </div>
        </div>

        <a class="mc-q" [routerLink]="['/polls', p.id]">{{ p.question }}</a>

        <div class="mc-meta">
          <span>{{ p.totalVoters }} voter{{ p.totalVoters!==1?'s':'' }}</span>
          <span *ngIf="p.endsAt && p.status==='ACTIVE'">· ends {{ p.endsAt | date:'MMM d, h:mm a' }}</span>
          <span *ngIf="p.status==='CLOSED'">· closed {{ p.closedAt | date:'MMM d' }}</span>
          <span *ngIf="p.status==='DRAFT'">· created {{ p.createdAt | date:'MMM d' }}</span>
          <span *ngIf="p.targetBlocks">· Block {{ p.targetBlocks }}</span>
        </div>

        <!-- Mini result preview for closed polls -->
        <div class="preview" *ngIf="p.status==='CLOSED' && p.results && p.type!=='RATING'">
          <div *ngFor="let o of topOpts(p)" class="pb">
            <span class="pbl">{{ o.emoji }} {{ o.text | slice:0:28 }}</span>
            <div class="pbt"><div class="pbf" [style.width.%]="o.percentage"></div></div>
            <span class="pbp">{{ o.percentage|number:'1.0-0' }}%</span>
          </div>
          <div *ngIf="p.type==='YES_NO'" class="yn-prev">
            <span class="yn y">👍 {{ p.results.yesCount }}</span>
            <span class="yn n">👎 {{ p.results.noCount }}</span>
            <span class="yn a">🤷 {{ p.results.abstainCount }}</span>
          </div>
        </div>
        <div class="rating-prev" *ngIf="p.status==='CLOSED' && p.type==='RATING' && p.results?.averageRating">
          ⭐ {{ p.results!.averageRating|number:'1.1-1' }} average rating from {{ p.totalVoters }} voters
        </div>
      </div>

      <div class="empty" *ngIf="!filtered().length">
        <div>📋</div>
        <p>No {{ activeFilter.toLowerCase() }} polls</p>
        <a routerLink="/polls/create" class="empty-cta" *ngIf="activeFilter==='ALL'||activeFilter==='DRAFT'">Create your first poll →</a>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;color:#212121}
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .loading{display:flex;justify-content:center;padding:60px}
    .sp{width:32px;height:32px;border:3px solid rgba(255,255,255,0.1);border-top-color:#7c3aed;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:14px}

    /* Tabs */
    .tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}
    .tab{background:#1f2937;border:1.5px solid #374151;border-radius:20px;color:#6b7280;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px}
    .tab.active{background:rgba(124,58,237,0.2);border-color:#7c3aed;color:#a78bfa}
    .tc{background:#7c3aed;color:#fff;font-size:10px;padding:1px 6px;border-radius:10px}

    /* Cards */
    .list{display:flex;flex-direction:column;gap:12px}
    .mp-card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:14px}
    .mc-top{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
    .st{font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px}
    .type-chip{background:rgba(124,58,237,0.15);color:#a78bfa;font-size:11px;padding:3px 10px;border-radius:10px}
    .anon{background:rgba(124,58,237,0.1);color:#6b7280;font-size:11px;padding:3px 8px;border-radius:8px}
    .mc-actions{display:flex;gap:6px;margin-left:auto}
    .act{border:none;border-radius:8px;font-size:12px;font-weight:600;padding:5px 12px;cursor:pointer}
    .act.pub{background:rgba(34,197,94,0.15);color:#4ade80}
    .act.close{background:rgba(239,68,68,0.15);color:#f87171}
    .act.arch{background:#1f2937;color:#6b7280}
    .act.del{background:rgba(239,68,68,0.08);color:#4b5563}
    .mc-q{display:block;color:#f1f5f9;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:8px;line-height:1.4}
    .mc-q:hover{color:#a78bfa}
    .mc-meta{color:#4b5563;font-size:11px;display:flex;gap:8px;flex-wrap:wrap}

    /* Preview */
    .preview{margin-top:10px;display:flex;flex-direction:column;gap:5px}
    .pb{display:flex;align-items:center;gap:8px}
    .pbl{color:#6b7280;font-size:11px;width:130px;flex-shrink:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .pbt{flex:1;height:6px;background:#1f2937;border-radius:3px;overflow:hidden}
    .pbf{height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:3px;transition:width 0.8s}
    .pbp{color:#6b7280;font-size:11px;width:30px;text-align:right}
    .yn-prev{display:flex;gap:8px;margin-top:6px}
    .yn{font-size:12px;padding:3px 10px;border-radius:8px}
    .yn.y{background:rgba(34,197,94,0.1);color:#4ade80}
    .yn.n{background:rgba(239,68,68,0.1);color:#f87171}
    .yn.a{background:#1f2937;color:#6b7280}
    .rating-prev{color:#fbbf24;font-size:12px;margin-top:8px}

    .empty{text-align:center;padding:50px 20px}
    .empty div{font-size:40px;margin-bottom:8px}
    .empty p{color:#4b5563;font-size:14px;margin-bottom:16px}
    .empty-cta{background:rgba(124,58,237,0.15);border:1.5px dashed #7c3aed;color:#a78bfa;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:600;text-decoration:none;display:inline-block}
  `]
})
export class ManagePollsComponent implements OnInit {
  polls: Poll[] = [];
  loading = true;
  activeFilter = 'ALL';
  filters = [
    { v: 'ALL', label: 'All' },
    { v: 'ACTIVE', label: '▶ Active' },
    { v: 'DRAFT', label: '✏️ Draft' },
    { v: 'CLOSED', label: '✓ Closed' },
    { v: 'ARCHIVED', label: '📦 Archived' },
  ];

  constructor(private svc: PollService) {}

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: r => { this.polls = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  filtered() {
    return this.activeFilter === 'ALL' ? this.polls
      : this.polls.filter(p => p.status === this.activeFilter);
  }

  count(f: string) {
    return f === 'ALL' ? this.polls.length : this.polls.filter(p => p.status === f).length;
  }

  topOpts(p: Poll) {
    return p.type === 'YES_NO' ? [] : [...p.options].sort((a,b)=>b.percentage-a.percentage).slice(0,3);
  }

  publish(p: Poll) { this.svc.publish(p.id).subscribe(r => this.updatePoll(r.data)); }
  close(p: Poll)   { this.svc.close(p.id).subscribe(r => this.updatePoll(r.data)); }
  archive(p: Poll) { this.svc.archive(p.id).subscribe(r => this.updatePoll(r.data)); }
  delete(p: Poll) {
    if (!confirm(`Delete "${p.question.slice(0,50)}…"?`)) return;
    this.svc.delete(p.id).subscribe(() => this.polls = this.polls.filter(x => x.id !== p.id));
  }

  updatePoll(updated: Poll) {
    const i = this.polls.findIndex(p => p.id === updated.id);
    if (i >= 0) this.polls[i] = updated;
  }

  stBg(p: Poll)    { return (POLL_STATUS_CONFIG as any)[p.status]?.bg    || '#f3f4f6'; }
  stColor(p: Poll) { return (POLL_STATUS_CONFIG as any)[p.status]?.color || '#555'; }
  stLabel(p: Poll) { return (POLL_STATUS_CONFIG as any)[p.status]?.label || p.status; }
  typeIcon(t: string)  { return (POLL_TYPE_CONFIG as any)[t]?.icon  || '🗳️'; }
  typeLabel(t: string) { return (POLL_TYPE_CONFIG as any)[t]?.label || t; }
}
