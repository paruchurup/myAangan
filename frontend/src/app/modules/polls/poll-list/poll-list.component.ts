import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PollService } from '@services/poll.service';
import { AuthService } from '@services/auth.service';
import { Poll, POLL_TYPE_CONFIG } from '@models/poll.model';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <a routerLink="/polls/create" class="new-btn" *ngIf="canManage">+ New Poll</a>
    </div>
    <h1>🗳️ Polls &amp; Voting</h1>
    <p>Community polls and decisions</p>
  </div>

  <div class="loading" *ngIf="loading"><div class="sp"></div></div>

  <div class="body" *ngIf="!loading">
    <div class="nudge" *ngIf="stats.pendingVote > 0">
      ⚡ {{ stats.pendingVote }} poll{{ stats.pendingVote>1?'s':'' }} waiting for your vote
    </div>

    <section *ngIf="activePolls.length">
      <div class="sh"><h2>Active</h2><span class="bc">{{ activePolls.length }}</span></div>
      <div class="grid">
        <a class="card ac" *ngFor="let p of activePolls" [routerLink]="['/polls', p.id]">
          <div class="top">
            <span class="tc">{{ typeIcon(p.type) }} {{ typeLabel(p.type) }}</span>
            <span class="vt" *ngIf="p.hasVoted">✓ Voted</span>
            <span class="ut" *ngIf="!p.hasVoted && isUrgent(p)">🔥 Ends soon</span>
          </div>
          <p class="q">{{ p.question }}</p>
          <div class="meta">{{ p.totalVoters }} voter{{ p.totalVoters!==1?'s':'' }}<span *ngIf="p.endsAt"> · {{ timeLeft(p) }}</span></div>

          <!-- Mini result bars (after voting) -->
          <div *ngIf="p.hasVoted && p.resultsVisible && p.type!=='YES_NO' && p.type!=='RATING'" class="bars">
            <div *ngFor="let o of topOpts(p)" class="bar">
              <span class="bl">{{ o.emoji }} {{ o.text | slice:0:20 }}</span>
              <div class="bt"><div class="bf" [style.width.%]="o.percentage"></div></div>
              <span class="bp">{{ o.percentage|number:'1.0-0' }}%</span>
            </div>
          </div>
          <div *ngIf="p.hasVoted && p.resultsVisible && p.type==='YES_NO' && p.results" class="ynrow">
            <span class="yn y">👍 {{ p.results!.yesCount }}</span>
            <span class="yn n">👎 {{ p.results!.noCount }}</span>
            <span class="yn a">🤷 {{ p.results!.abstainCount }}</span>
          </div>
          <div *ngIf="p.hasVoted && p.resultsVisible && p.type==='RATING' && p.results?.averageRating" class="rating-row">
            ⭐ {{ p.results!.averageRating|number:'1.1-1' }} avg · {{ p.totalVoters }} ratings
          </div>
          <div class="cta" *ngIf="!p.hasVoted">Tap to vote →</div>
        </a>
      </div>
    </section>

    <section *ngIf="closedPolls.length" style="margin-top:8px">
      <div class="sh"><h2>Completed</h2><span class="bc dim">{{ closedPolls.length }}</span></div>
      <div class="clist">
        <a class="cc" *ngFor="let p of closedPolls" [routerLink]="['/polls', p.id]">
          <span class="tc dim">{{ typeIcon(p.type) }}</span>
          <span class="cq">{{ p.question }}</span>
          <span class="cv">{{ p.totalVoters }} voters</span>
          <span class="cd">{{ p.closedAt|date:'MMM d' }}</span>
          <span class="arr">›</span>
        </a>
      </div>
    </section>

    <div class="empty" *ngIf="!activePolls.length&&!closedPolls.length">
      <div>🗳️</div><p>No polls yet — check back soon!</p>
    </div>
  </div>
</div>`,
  styles:[`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;color:#212121}
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .new-btn{display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none;}
    .loading{display:flex;justify-content:center;padding:60px}
    .sp{width:32px;height:32px;border:3px solid rgba(255,255,255,0.1);border-top-color:#7c3aed;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:16px}
    .nudge{background:linear-gradient(135deg,#78350f,#92400e);color:#fef3c7;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:600;margin-bottom:16px;border:1px solid rgba(251,191,36,0.2)}
    .sh{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .sh h2{color:#e2e8f0;font-size:15px;font-weight:700;margin:0}
    .bc{background:#7c3aed;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
    .bc.dim{background:#374151}
    .grid{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
    .card{background:linear-gradient(135deg,#1e1e3f,#16213e);border:1px solid rgba(124,58,237,0.25);border-left:3px solid #7c3aed;border-radius:16px;padding:16px;text-decoration:none;display:block}
    .top{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .tc{background:rgba(124,58,237,0.2);color:#a78bfa;font-size:11px;font-weight:600;padding:3px 10px;border-radius:10px}
    .tc.dim{background:#1f2937;color:#4b5563}
    .vt{background:rgba(34,197,94,0.15);color:#4ade80;font-size:11px;font-weight:600;padding:3px 8px;border-radius:8px;margin-left:auto}
    .ut{background:rgba(245,158,11,0.15);color:#fbbf24;font-size:11px;font-weight:600;padding:3px 8px;border-radius:8px;margin-left:auto}
    .q{color:#f1f5f9;font-size:15px;font-weight:600;margin:0 0 8px;line-height:1.4}
    .meta{color:rgba(255,255,255,0.35);font-size:12px;margin-bottom:10px}
    .cta{color:#a78bfa;font-size:13px;font-weight:600;margin-top:4px}
    /* mini bars */
    .bars{display:flex;flex-direction:column;gap:5px}
    .bar{display:flex;align-items:center;gap:8px}
    .bl{color:rgba(255,255,255,0.55);font-size:11px;width:110px;flex-shrink:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .bt{flex:1;height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden}
    .bf{height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:3px;transition:width 0.8s}
    .bp{color:#a78bfa;font-size:11px;font-weight:600;width:32px;text-align:right}
    .ynrow{display:flex;gap:10px;margin-top:8px}
    .yn{font-size:12px;padding:3px 8px;border-radius:8px}
    .yn.y{background:rgba(34,197,94,0.15);color:#4ade80}
    .yn.n{background:rgba(239,68,68,0.15);color:#f87171}
    .yn.a{background:rgba(156,163,175,0.15);color:#9ca3af}
    .rating-row{color:#fbbf24;font-size:12px;margin-top:8px}
    /* closed list */
    .clist{display:flex;flex-direction:column;gap:8px}
    .cc{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:12px 14px;text-decoration:none;display:flex;align-items:center;gap:10px}
    .cq{color:#6b7280;font-size:13px;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .cv{color:#374151;font-size:11px;flex-shrink:0}.cd{color:#374151;font-size:11px}.arr{color:#374151;font-size:18px}
    .empty{text-align:center;padding:60px 20px;color:#4b5563;font-size:15px}
    .empty div{font-size:48px;margin-bottom:12px}
  `]
})
export class PollListComponent implements OnInit {
  polls: Poll[] = [];
  stats: any = {};
  loading = true;
  canManage = false;

  constructor(private svc: PollService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('POLL_MANAGE');
    this.svc.getStats().subscribe(r => this.stats = r.data);
    this.svc.getActive().subscribe({ next: r => { this.polls = r.data; this.loading = false; }, error: () => this.loading = false });
  }

  get activePolls() { return this.polls.filter(p => p.status === 'ACTIVE'); }
  get closedPolls() { return this.polls.filter(p => p.status === 'CLOSED'); }
  typeIcon(t: string)  { return (POLL_TYPE_CONFIG as any)[t]?.icon  || '🗳️'; }
  typeLabel(t: string) { return (POLL_TYPE_CONFIG as any)[t]?.label || t; }
  topOpts(p: Poll)     { return [...p.options].sort((a,b)=>b.percentage-a.percentage).slice(0,3); }
  isUrgent(p: Poll)    { return !!p.secondsRemaining && p.secondsRemaining < 86400; }
  timeLeft(p: Poll): string {
    const s = p.secondsRemaining;
    if (!s && s !== 0) return '';
    if (s <= 0)   return 'Ended';
    if (s < 3600) return Math.floor(s/60)+'m left';
    if (s < 86400)return Math.floor(s/3600)+'h left';
    return Math.floor(s/86400)+'d left';
  }
}
