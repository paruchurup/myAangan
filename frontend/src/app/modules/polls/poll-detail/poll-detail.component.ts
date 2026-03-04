import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PollService } from '../../../core/services/poll.service';
import { AuthService } from '../../../core/services/auth.service';
import { Poll, POLL_TYPE_CONFIG, POLL_STATUS_CONFIG } from '../../../core/models/poll.model';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="page" *ngIf="poll">
  <div class="header">
    <button class="back" onclick="history.back()">← Back</button>
    <div class="status-row">
      <span class="st" [style.background]="stBg()" [style.color]="stColor()">{{ stLabel() }}</span>
      <span class="type">{{ typeIcon() }} {{ typeLabel() }}</span>
      <span class="anon" *ngIf="poll.anonymous">🔒 Anonymous</span>
    </div>
    <h1>{{ poll.question }}</h1>
    <p class="desc" *ngIf="poll.description">{{ poll.description }}</p>
    <div class="meta-row">
      <span>By {{ poll.createdByName }}</span>
      <span *ngIf="poll.endsAt && poll.status==='ACTIVE'" [class.urgent]="isUrgent()">⏱ {{ timeLeft() }}</span>
      <span *ngIf="poll.status==='CLOSED'">Closed {{ poll.closedAt|date:'MMM d, y' }}</span>
    </div>
    <div class="participation">{{ poll.totalVoters }} voter{{ poll.totalVoters!==1?'s':'' }} participated</div>
  </div>

  <!-- ── VOTING AREA ──────────────────────────────────────────────────────── -->
  <div class="body">

    <!-- Already voted + no change allowed -->
    <div class="voted-notice" *ngIf="poll.hasVoted && !poll.allowVoteChange && poll.status==='ACTIVE'">
      ✓ You have voted. Vote changes are not allowed for this poll.
    </div>

    <!-- Voting form -->
    <div class="vote-card" *ngIf="poll.status==='ACTIVE' && (!poll.hasVoted || poll.allowVoteChange)">
      <h2 *ngIf="!poll.hasVoted">Cast Your Vote</h2>
      <h2 *ngIf="poll.hasVoted">Change Your Vote</h2>

      <!-- SINGLE CHOICE -->
      <div *ngIf="poll.type==='SINGLE_CHOICE'" class="opts">
        <label class="opt" *ngFor="let o of poll.options"
          [class.sel]="selectedOptions.includes(o.id)"
          (click)="selectSingle(o.id)">
          <span class="opt-em">{{ o.emoji || '◦' }}</span>
          <span class="opt-text">{{ o.text }}</span>
          <span class="opt-check" *ngIf="selectedOptions.includes(o.id)">✓</span>
        </label>
      </div>

      <!-- MULTIPLE CHOICE -->
      <div *ngIf="poll.type==='MULTIPLE_CHOICE'" class="opts">
        <div class="max-hint" *ngIf="poll.maxChoices>0">Select up to {{ poll.maxChoices }} options</div>
        <label class="opt" *ngFor="let o of poll.options"
          [class.sel]="selectedOptions.includes(o.id)"
          [class.disabled]="poll.maxChoices>0 && selectedOptions.length>=poll.maxChoices && !selectedOptions.includes(o.id)"
          (click)="toggleOption(o.id)">
          <span class="opt-em">{{ o.emoji || '☐' }}</span>
          <span class="opt-text">{{ o.text }}</span>
          <span class="opt-check" *ngIf="selectedOptions.includes(o.id)">✓</span>
        </label>
      </div>

      <!-- YES / NO -->
      <div *ngIf="poll.type==='YES_NO'" class="yn-opts">
        <button class="yn-btn yes" [class.sel]="yesNoVal==='YES'" (click)="yesNoVal='YES'">👍 Yes</button>
        <button class="yn-btn no"  [class.sel]="yesNoVal==='NO'"  (click)="yesNoVal='NO'">👎 No</button>
        <button class="yn-btn abs" [class.sel]="yesNoVal==='ABSTAIN'" (click)="yesNoVal='ABSTAIN'">🤷 Abstain</button>
      </div>

      <!-- RATING -->
      <div *ngIf="poll.type==='RATING'" class="stars">
        <button class="star" *ngFor="let s of [1,2,3,4,5]"
          [class.lit]="ratingVal >= s" (click)="ratingVal=s">★</button>
        <span class="star-label" *ngIf="ratingVal">{{ ratingLabel() }}</span>
      </div>

      <button class="submit-btn" (click)="submitVote()" [disabled]="!canSubmit() || voting">
        {{ voting ? 'Submitting…' : (poll.hasVoted ? 'Update Vote' : 'Submit Vote') }}
      </button>
      <div class="err" *ngIf="voteErr">{{ voteErr }}</div>
    </div>

    <!-- ── RESULTS ──────────────────────────────────────────────────────── -->
    <div *ngIf="poll.resultsVisible && poll.results" class="results-card">
      <h2>Results <span class="live" *ngIf="poll.status==='ACTIVE'">live</span></h2>

      <!-- Choice results -->
      <div *ngIf="poll.type==='SINGLE_CHOICE'||poll.type==='MULTIPLE_CHOICE'" class="result-bars">
        <div *ngFor="let o of poll.options" class="rb">
          <div class="rb-top">
            <span class="rb-lbl" [class.my]="poll.myOptionIds?.includes(o.id)">
              {{ o.emoji }} {{ o.text }}
              <span class="my-tag" *ngIf="poll.myOptionIds?.includes(o.id)">← your vote</span>
            </span>
            <span class="rb-n">{{ o.voteCount }}</span>
          </div>
          <div class="rb-track">
            <div class="rb-fill" [style.width.%]="o.percentage" [class.winner]="isWinner(o)"></div>
          </div>
          <span class="rb-pct">{{ o.percentage|number:'1.0-0' }}%</span>
        </div>
      </div>

      <!-- Yes/No results -->
      <div *ngIf="poll.type==='YES_NO'" class="yn-results">
        <div class="yn-bar">
          <div class="yb yes" [style.flex]="poll.results.yesCount||1">
            👍 Yes <strong>{{ poll.results.yesCount }}</strong>
            <span>{{ ynPct('yes') }}%</span>
          </div>
          <div class="yb no" [style.flex]="poll.results.noCount||1">
            👎 No <strong>{{ poll.results.noCount }}</strong>
            <span>{{ ynPct('no') }}%</span>
          </div>
          <div class="yb abs" [style.flex]="poll.results.abstainCount||0.2">
            🤷 Abstain <strong>{{ poll.results.abstainCount }}</strong>
          </div>
        </div>
        <div class="my-yn" *ngIf="poll.myYesNoValue">Your vote: <strong>{{ poll.myYesNoValue }}</strong></div>
      </div>

      <!-- Rating results -->
      <div *ngIf="poll.type==='RATING'" class="rating-results">
        <div class="avg-rating">
          <span class="big-star">⭐</span>
          <span class="avg-n">{{ poll.results.averageRating|number:'1.1-1' }}</span>
          <span class="avg-sub">average · {{ poll.totalVoters }} ratings</span>
        </div>
        <div class="star-dist">
          <div *ngFor="let s of [5,4,3,2,1]" class="sd-row">
            <span class="sd-star">{{ s }}★</span>
            <div class="sd-track">
              <div class="sd-fill" [style.width.%]="starPct(s)"></div>
            </div>
            <span class="sd-n">{{ poll.results.ratingDistribution[s]||0 }}</span>
          </div>
        </div>
        <div class="my-yn" *ngIf="poll.myRatingValue">Your rating: <strong>{{ poll.myRatingValue }}★</strong></div>
      </div>
    </div>

    <!-- Results hidden notice -->
    <div class="hidden-results" *ngIf="!poll.resultsVisible && poll.hasVoted">
      🔒 Results will be visible {{ poll.resultVisibility==='AFTER_CLOSE' ? 'after the poll closes' : 'to organisers only' }}
    </div>

    <!-- ── VOTER LIST (admin) ───────────────────────────────────────────── -->
    <div class="voters-card" *ngIf="poll.results?.voters?.length">
      <h2>Voter Details <span class="vc">{{ poll.results!.voters!.length }}</span></h2>
      <div class="vt">
        <div class="vrow" *ngFor="let v of poll.results!.voters">
          <div class="vname">{{ v.name }}</div>
          <div class="vrole">{{ v.role }}</div>
          <div class="vflat">{{ v.flat||'—' }}</div>
          <div class="vfor">{{ v.votedFor }}</div>
          <div class="vdate">{{ v.votedAt|date:'MMM d, h:mm a' }}</div>
        </div>
      </div>
    </div>

    <!-- ── COMMENTS ─────────────────────────────────────────────────────── -->
    <div class="comments-card" *ngIf="poll.allowComments">
      <h2>Discussion <span class="cc">{{ poll.comments.length }}</span></h2>
      <div class="clist">
        <div class="cm" *ngFor="let c of poll.comments">
          <div class="cm-head">
            <strong>{{ c.authorName }}</strong>
            <span class="cm-role">{{ c.authorRole }}</span>
            <span class="cm-time">{{ c.createdAt|date:'MMM d, h:mm a' }}</span>
            <button class="cm-del" *ngIf="c.canDelete || canManage" (click)="delComment(c.id)">×</button>
          </div>
          <p class="cm-body">{{ c.text }}</p>
        </div>
        <div class="no-cm" *ngIf="!poll.comments.length">No comments yet — start the discussion!</div>
      </div>
      <div class="add-cm" *ngIf="poll.status!=='ARCHIVED'">
        <textarea [(ngModel)]="newComment" placeholder="Share your thoughts…" rows="2"></textarea>
        <button (click)="submitComment()" [disabled]="!newComment.trim()">Post</button>
      </div>
    </div>

    <!-- ── ADMIN ACTIONS ─────────────────────────────────────────────────── -->
    <div class="mgmt" *ngIf="canManage">
      <h2>Manage</h2>
      <div class="mgmt-row">
        <a [routerLink]="['/polls/manage']" class="mb edit">✏️ All Polls</a>
        <button class="mb pub" *ngIf="poll.status==='DRAFT'" (click)="doPublish()">▶ Publish</button>
        <button class="mb close" *ngIf="poll.status==='ACTIVE'" (click)="doClose()">⏹ Close</button>
        <button class="mb arch" *ngIf="poll.status==='CLOSED'" (click)="doArchive()">📦 Archive</button>
      </div>
    </div>
  </div>
</div>

<div class="loading" *ngIf="!poll && loading"><div class="sp"></div></div>`,
  styles: [`
    .page{min-height:100vh;background:#0f0f1a;font-family:'Segoe UI',sans-serif;padding-bottom:80px}
    .header{background:linear-gradient(135deg,#1a0533,#0f3460 70%,#1a1a2e);padding:20px 20px 28px;color:#fff}
    .back{background:rgba(255,255,255,0.1);border:none;color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;cursor:pointer;margin-bottom:14px;display:block}
    .status-row{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
    .st{font-size:12px;font-weight:700;padding:3px 10px;border-radius:10px}
    .type{font-size:12px;color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.1);padding:3px 10px;border-radius:10px}
    .anon{font-size:12px;color:#a78bfa;background:rgba(124,58,237,0.2);padding:3px 10px;border-radius:10px}
    h1{font-size:20px;font-weight:800;margin:0 0 8px;line-height:1.3}
    .desc{font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 10px;line-height:1.5}
    .meta-row{display:flex;gap:12px;font-size:12px;color:rgba(255,255,255,0.4);flex-wrap:wrap;margin-bottom:6px}
    .urgent{color:#fbbf24!important;font-weight:700}
    .participation{font-size:12px;color:rgba(255,255,255,0.35)}
    .loading{display:flex;justify-content:center;padding:60px}
    .sp{width:32px;height:32px;border:3px solid rgba(255,255,255,0.1);border-top-color:#7c3aed;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .body{padding:14px;display:flex;flex-direction:column;gap:14px}

    /* Cards */
    .voted-notice{background:#1a2e1a;border:1px solid #166534;color:#4ade80;padding:12px 16px;border-radius:12px;font-size:13px}
    .vote-card,.results-card,.voters-card,.comments-card,.mgmt{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px}
    h2{color:#e2e8f0;font-size:15px;font-weight:700;margin:0 0 14px;display:flex;align-items:center;gap:8px}
    .live{background:#166534;color:#4ade80;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}

    /* Vote options */
    .opts{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
    .opt{display:flex;align-items:center;gap:10px;background:#1f2937;border:1.5px solid #374151;border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s}
    .opt.sel{background:rgba(124,58,237,0.15);border-color:#7c3aed}
    .opt.disabled{opacity:0.4;cursor:not-allowed}
    .opt-em{font-size:18px;width:24px;flex-shrink:0}
    .opt-text{color:#e2e8f0;font-size:14px;flex:1}
    .opt-check{color:#7c3aed;font-size:16px;font-weight:700;margin-left:auto}
    .max-hint{color:#6b7280;font-size:12px;margin-bottom:8px}

    /* Yes/No */
    .yn-opts{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
    .yn-btn{flex:1;padding:14px 8px;border:1.5px solid #374151;border-radius:12px;background:#1f2937;color:#9ca3af;font-size:15px;font-weight:700;cursor:pointer;min-width:80px;transition:all 0.15s}
    .yn-btn.sel.yes{background:rgba(34,197,94,0.15);border-color:#22c55e;color:#4ade80}
    .yn-btn.sel.no{background:rgba(239,68,68,0.15);border-color:#ef4444;color:#f87171}
    .yn-btn.sel.abs{background:rgba(156,163,175,0.15);border-color:#6b7280;color:#9ca3af}

    /* Stars */
    .stars{display:flex;align-items:center;gap:8px;margin-bottom:14px}
    .star{background:none;border:none;font-size:36px;cursor:pointer;color:#374151;transition:all 0.1s;padding:0}
    .star.lit{color:#fbbf24;text-shadow:0 0 10px rgba(251,191,36,0.5)}
    .star-label{color:#fbbf24;font-size:13px;font-weight:600;margin-left:4px}

    .submit-btn{width:100%;padding:13px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer}
    .submit-btn:disabled{opacity:0.4;cursor:not-allowed}
    .err{color:#f87171;font-size:13px;margin-top:8px}

    /* Result bars */
    .result-bars{display:flex;flex-direction:column;gap:12px}
    .rb{display:flex;flex-direction:column;gap:4px}
    .rb-top{display:flex;justify-content:space-between;align-items:flex-end}
    .rb-lbl{font-size:13px;color:#e2e8f0;font-weight:500}
    .rb-lbl.my{color:#a78bfa;font-weight:700}
    .my-tag{font-size:10px;color:#7c3aed;background:rgba(124,58,237,0.15);padding:1px 6px;border-radius:6px;margin-left:6px}
    .rb-n{font-size:12px;color:#6b7280}
    .rb-track{height:10px;background:#1f2937;border-radius:5px;overflow:hidden}
    .rb-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:5px;transition:width 1s ease}
    .rb-fill.winner{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
    .rb-pct{font-size:12px;color:#6b7280}

    /* Yes/No results */
    .yn-bar{display:flex;height:50px;border-radius:12px;overflow:hidden;gap:2px;margin-bottom:12px}
    .yb{display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:13px;font-weight:600;gap:2px;min-width:40px;transition:flex 0.8s}
    .yb.yes{background:rgba(34,197,94,0.2);color:#4ade80}
    .yb.no{background:rgba(239,68,68,0.2);color:#f87171}
    .yb.abs{background:rgba(156,163,175,0.1);color:#6b7280}
    .yb strong{font-size:16px}
    .yb span{font-size:10px;opacity:0.8}
    .my-yn{font-size:12px;color:#6b7280;margin-top:8px}
    .my-yn strong{color:#a78bfa}

    /* Rating results */
    .rating-results{display:flex;flex-direction:column;gap:14px}
    .avg-rating{display:flex;align-items:center;gap:10px}
    .big-star{font-size:36px}
    .avg-n{font-size:36px;font-weight:800;color:#fbbf24}
    .avg-sub{font-size:12px;color:#6b7280}
    .star-dist{display:flex;flex-direction:column;gap:6px}
    .sd-row{display:flex;align-items:center;gap:8px}
    .sd-star{color:#fbbf24;font-size:12px;width:20px;text-align:right;flex-shrink:0}
    .sd-track{flex:1;height:8px;background:#1f2937;border-radius:4px;overflow:hidden}
    .sd-fill{height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;transition:width 0.8s}
    .sd-n{font-size:12px;color:#6b7280;width:20px}

    /* Voter table */
    .vc{background:#374151;color:#9ca3af;font-size:11px;padding:2px 8px;border-radius:10px}
    .vt{display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto}
    .vrow{display:grid;grid-template-columns:1.5fr 1fr 0.7fr 1.5fr 1fr;gap:6px;padding:8px 0;border-bottom:1px solid #1f2937;font-size:12px}
    .vname{color:#e2e8f0;font-weight:600}.vrole{color:#6b7280}.vflat{color:#6b7280}
    .vfor{color:#a78bfa;font-weight:600}.vdate{color:#4b5563}

    /* Comments */
    .cc{background:#374151;color:#9ca3af;font-size:11px;padding:2px 8px;border-radius:10px}
    .clist{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:320px;overflow-y:auto}
    .cm{background:#1f2937;border-radius:10px;padding:12px}
    .cm-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
    .cm-head strong{color:#e2e8f0;font-size:13px}
    .cm-role{font-size:10px;color:#6b7280;background:#111827;padding:1px 6px;border-radius:6px}
    .cm-time{font-size:11px;color:#4b5563;margin-left:auto}
    .cm-del{background:none;border:none;color:#4b5563;font-size:16px;cursor:pointer;padding:0 4px}
    .cm-body{font-size:13px;color:#9ca3af;margin:0;line-height:1.5}
    .no-cm{color:#4b5563;font-size:13px;text-align:center;padding:20px}
    .add-cm{display:flex;flex-direction:column;gap:8px}
    .add-cm textarea{width:100%;padding:10px;background:#1f2937;border:1.5px solid #374151;border-radius:10px;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box}
    .add-cm textarea:focus{border-color:#7c3aed}
    .add-cm button{align-self:flex-end;background:#7c3aed;color:#fff;border:none;padding:9px 22px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer}
    .add-cm button:disabled{opacity:0.4}

    /* Mgmt */
    .mgmt-row{display:flex;gap:8px;flex-wrap:wrap}
    .mb{padding:9px 16px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
    .mb.edit{background:#1f2937;color:#9ca3af}
    .mb.pub{background:rgba(34,197,94,0.15);color:#4ade80}
    .mb.close{background:rgba(239,68,68,0.15);color:#f87171}
    .mb.arch{background:#1f2937;color:#6b7280}
    .hidden-results{background:#1f2937;border:1px dashed #374151;border-radius:12px;padding:16px;color:#6b7280;font-size:13px;text-align:center}
  `]
})
export class PollDetailComponent implements OnInit {
  poll: Poll | null = null;
  loading = true;
  canManage = false;
  selectedOptions: number[] = [];
  yesNoVal = '';
  ratingVal = 0;
  newComment = '';
  voting = false;
  voteErr = '';

  constructor(private route: ActivatedRoute, private svc: PollService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('POLL_MANAGE');
    this.load();
  }

  load() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: r => {
        this.poll = r.data;
        this.loading = false;
        // Pre-fill my previous votes
        if (this.poll.hasVoted) {
          this.selectedOptions = [...(this.poll.myOptionIds || [])];
          this.yesNoVal = this.poll.myYesNoValue || '';
          this.ratingVal = this.poll.myRatingValue || 0;
        }
      },
      error: () => this.loading = false
    });
  }

  selectSingle(id: number)  { this.selectedOptions = [id]; }
  toggleOption(id: number) {
    const idx = this.selectedOptions.indexOf(id);
    const max = this.poll?.maxChoices || 0;
    if (idx >= 0) { this.selectedOptions.splice(idx, 1); }
    else if (max === 0 || this.selectedOptions.length < max) { this.selectedOptions.push(id); }
  }

  canSubmit(): boolean {
    if (!this.poll) return false;
    switch (this.poll.type) {
      case 'SINGLE_CHOICE':   return this.selectedOptions.length === 1;
      case 'MULTIPLE_CHOICE': return this.selectedOptions.length >= 1;
      case 'YES_NO':          return !!this.yesNoVal;
      case 'RATING':          return this.ratingVal >= 1;
    }
  }

  submitVote() {
    if (!this.poll || !this.canSubmit()) return;
    this.voting = true;
    this.voteErr = '';
    const body: any = {};
    if (this.poll.type === 'SINGLE_CHOICE' || this.poll.type === 'MULTIPLE_CHOICE') body.optionIds = this.selectedOptions;
    if (this.poll.type === 'YES_NO')   body.yesNoValue  = this.yesNoVal;
    if (this.poll.type === 'RATING')   body.ratingValue = this.ratingVal;
    this.svc.vote(this.poll.id, body).subscribe({
      next: r => { this.poll = r.data; this.voting = false; },
      error: e => { this.voteErr = e.error?.message || 'Vote failed. Please try again.'; this.voting = false; }
    });
  }

  submitComment() {
    if (!this.poll || !this.newComment.trim()) return;
    this.svc.addComment(this.poll.id, this.newComment).subscribe({
      next: () => { this.newComment = ''; this.load(); }
    });
  }

  delComment(id: number) {
    this.svc.deleteComment(id).subscribe({ next: () => this.load() });
  }

  doPublish() { this.svc.publish(this.poll!.id).subscribe({ next: r => this.poll = r.data }); }
  doClose()   { this.svc.close(this.poll!.id).subscribe({ next: r => this.poll = r.data }); }
  doArchive() { this.svc.archive(this.poll!.id).subscribe({ next: r => this.poll = r.data }); }

  typeIcon()  { return (POLL_TYPE_CONFIG as any)[this.poll!.type]?.icon  || '🗳️'; }
  typeLabel() { return (POLL_TYPE_CONFIG as any)[this.poll!.type]?.label || this.poll!.type; }
  stBg()    { return (POLL_STATUS_CONFIG as any)[this.poll!.status]?.bg    || '#f3f4f6'; }
  stColor() { return (POLL_STATUS_CONFIG as any)[this.poll!.status]?.color || '#555'; }
  stLabel() { return (POLL_STATUS_CONFIG as any)[this.poll!.status]?.label || this.poll!.status; }

  isUrgent() { return !!this.poll?.secondsRemaining && this.poll.secondsRemaining < 86400; }
  timeLeft(): string {
    const s = this.poll?.secondsRemaining;
    if (!s && s !== 0) return '';
    if (s <= 0)   return 'Ended';
    if (s < 3600) return Math.floor(s/60)+'m left';
    if (s < 86400)return Math.floor(s/3600)+'h left';
    return Math.floor(s/86400)+'d left';
  }

  isWinner(o: any): boolean {
    const max = Math.max(...this.poll!.options.map(x => x.voteCount));
    return o.voteCount === max && max > 0;
  }

  ynPct(which: 'yes'|'no'|'abs'): string {
    const r = this.poll!.results!;
    const t = r.yesCount + r.noCount + r.abstainCount;
    if (!t) return '0';
    const v = which === 'yes' ? r.yesCount : which === 'no' ? r.noCount : r.abstainCount;
    return (v / t * 100).toFixed(0);
  }

  starPct(s: number): number {
    const dist = this.poll!.results!.ratingDistribution;
    const total = Object.values(dist).reduce((a,b) => a+b, 0);
    return total ? (dist[s] || 0) / total * 100 : 0;
  }

  ratingLabel(): string {
    const labels = ['','Terrible','Poor','Average','Good','Excellent'];
    return labels[this.ratingVal] || '';
  }
}
