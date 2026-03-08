import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page">
  <div class="header">
    <div>
      <div class="eyebrow">ADMIN · SOCIETY</div>
      <h1>📊 Analytics Dashboard</h1>
    </div>
    <div class="refresh-info" *ngIf="generatedAt">
      Updated {{ generatedAt | date:'h:mm a' }}
      <button class="refresh-btn" (click)="load()" [disabled]="loading">↻</button>
    </div>
  </div>

  <div class="loading-full" *ngIf="loading && !data">
    <div class="spinner"></div>
    <div class="loading-label">Loading society data…</div>
  </div>

  <div class="content" *ngIf="data">

    <!-- ── SECTION 1: SOCIETY OVERVIEW ─────────────────────────────── -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">🏘️</span>
        <span class="section-title">SOCIETY OVERVIEW</span>
      </div>
      <div class="card-grid-4">
        <div class="stat-card">
          <div class="sc-value">{{ s.totalUsers }}</div>
          <div class="sc-label">Total Members</div>
        </div>
        <div class="stat-card green">
          <div class="sc-value">{{ s.activeUsers }}</div>
          <div class="sc-label">Active</div>
        </div>
        <div class="stat-card amber" [class.pulse]="s.pendingApproval > 0">
          <div class="sc-value">{{ s.pendingApproval }}</div>
          <div class="sc-label">Pending Approval</div>
        </div>
        <div class="stat-card blue">
          <div class="sc-value">{{ s.occupiedFlats }}</div>
          <div class="sc-label">Occupied Flats</div>
        </div>
      </div>

      <!-- Role breakdown -->
      <div class="breakdown-card" *ngIf="roleEntries.length">
        <div class="breakdown-title">Members by Role</div>
        <div class="role-row" *ngFor="let r of roleEntries">
          <div class="role-name">{{ formatRole(r[0]) }}</div>
          <div class="role-bar-wrap">
            <div class="role-bar" [style.width.%]="barPct(r[1], s.activeUsers)"></div>
          </div>
          <div class="role-count">{{ r[1] }}</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION 2: MAINTENANCE ───────────────────────────────────── -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">💰</span>
        <span class="section-title">MAINTENANCE — {{ m.currentMonth }}</span>
      </div>

      <!-- Collection rate progress bar -->
      <div class="rate-card">
        <div class="rate-top">
          <span class="rate-label">Collection Rate</span>
          <span class="rate-value" [class.good]="m.collectionRate>=80" [class.warn]="m.collectionRate>=50&&m.collectionRate<80" [class.bad]="m.collectionRate<50">
            {{ m.collectionRate }}%
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="m.collectionRate"
            [class.fill-green]="m.collectionRate>=80"
            [class.fill-amber]="m.collectionRate>=50&&m.collectionRate<80"
            [class.fill-red]="m.collectionRate<50"></div>
        </div>
        <div class="rate-sub">{{ m.paidBills }} of {{ m.totalBills }} flats paid</div>
      </div>

      <div class="card-grid-3">
        <div class="stat-card green">
          <div class="sc-value mono">₹{{ formatAmount(m.collected) }}</div>
          <div class="sc-label">Collected</div>
        </div>
        <div class="stat-card red">
          <div class="sc-value mono">₹{{ formatAmount(m.outstanding) }}</div>
          <div class="sc-label">Outstanding</div>
        </div>
        <div class="stat-card" [class.red]="m.defaulterCount>0">
          <div class="sc-value">{{ m.defaulterCount }}</div>
          <div class="sc-label">Defaulters (2+ months)</div>
        </div>
      </div>

      <!-- 6-month trend -->
      <div class="breakdown-card" *ngIf="m.trend?.length">
        <div class="breakdown-title">6-Month Collection Trend</div>
        <div class="trend-row" *ngFor="let t of m.trend">
          <div class="trend-month">{{ t.month }}</div>
          <div class="trend-bar-wrap">
            <div class="trend-bar" [style.width.%]="t.rate"
              [class.fill-green]="t.rate>=80"
              [class.fill-amber]="t.rate>=50&&t.rate<80"
              [class.fill-red]="t.rate<50 && t.total > 0"></div>
          </div>
          <div class="trend-stat">
            <span class="trend-rate" [class.good]="t.rate>=80" [class.warn]="t.rate>=50&&t.rate<80" [class.bad]="t.rate<50&&t.total>0">
              {{ t.total > 0 ? t.rate + '%' : '—' }}
            </span>
            <span class="trend-amount" *ngIf="t.total>0">₹{{ formatAmount(t.collected) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION 3: COMPLAINTS ────────────────────────────────────── -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📣</span>
        <span class="section-title">COMPLAINTS</span>
      </div>
      <div class="card-grid-4">
        <div class="stat-card red" [class.pulse]="c.open>0">
          <div class="sc-value">{{ c.open }}</div>
          <div class="sc-label">Open</div>
        </div>
        <div class="stat-card amber">
          <div class="sc-value">{{ c.inProgress }}</div>
          <div class="sc-label">In Progress</div>
        </div>
        <div class="stat-card green">
          <div class="sc-value">{{ c.resolvedThisMonth }}</div>
          <div class="sc-label">Resolved This Month</div>
        </div>
        <div class="stat-card" [class.red]="c.slaBreached>0" [class.pulse]="c.slaBreached>0">
          <div class="sc-value">{{ c.slaBreached }}</div>
          <div class="sc-label">SLA Breached</div>
        </div>
      </div>

      <div class="card-grid-2">
        <div class="stat-card blue">
          <div class="sc-value">{{ c.totalResolved }}</div>
          <div class="sc-label">Total Resolved (All Time)</div>
        </div>
        <div class="stat-card">
          <div class="sc-value">{{ c.avgResolutionDays }}<span class="sc-unit"> days</span></div>
          <div class="sc-label">Avg Resolution Time</div>
        </div>
      </div>

      <!-- By category -->
      <div class="breakdown-card" *ngIf="categoryEntries.length">
        <div class="breakdown-title">Open Complaints by Category</div>
        <div class="role-row" *ngFor="let cat of categoryEntries">
          <div class="role-name">{{ formatCategory(cat[0]) }}</div>
          <div class="role-bar-wrap">
            <div class="role-bar red-bar" [style.width.%]="barPct(cat[1], c.open + c.inProgress)"></div>
          </div>
          <div class="role-count">{{ cat[1] }}</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION 4: NOTICES & POLLS ──────────────────────────────── -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📰</span>
        <span class="section-title">NOTICES & POLLS</span>
      </div>

      <!-- Notice read rate -->
      <div class="rate-card">
        <div class="rate-top">
          <span class="rate-label">Average Notice Read Rate</span>
          <span class="rate-value" [class.good]="np.avgReadRate>=60" [class.warn]="np.avgReadRate>=30&&np.avgReadRate<60" [class.bad]="np.avgReadRate<30">
            {{ np.avgReadRate }}%
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="np.avgReadRate"
            [class.fill-green]="np.avgReadRate>=60"
            [class.fill-amber]="np.avgReadRate>=30&&np.avgReadRate<60"
            [class.fill-red]="np.avgReadRate<30"></div>
        </div>
        <div class="rate-sub">{{ np.totalReads }} total reads across {{ np.publishedNotices }} published notices</div>
      </div>

      <div class="card-grid-4">
        <div class="stat-card blue">
          <div class="sc-value">{{ np.publishedNotices }}</div>
          <div class="sc-label">Published Notices</div>
        </div>
        <div class="stat-card">
          <div class="sc-value">{{ np.noticesThisMonth }}</div>
          <div class="sc-label">Posted This Month</div>
        </div>
        <div class="stat-card green" [class.amber]="np.activePolls===0">
          <div class="sc-value">{{ np.activePolls }}</div>
          <div class="sc-label">Active Polls</div>
        </div>
        <div class="stat-card">
          <div class="sc-value">{{ np.votesThisMonth }}</div>
          <div class="sc-label">Votes This Month</div>
        </div>
      </div>

      <div class="card-grid-2">
        <div class="stat-card">
          <div class="sc-value">{{ np.totalPolls }}</div>
          <div class="sc-label">Total Polls (All Time)</div>
        </div>
        <div class="stat-card">
          <div class="sc-value">{{ np.totalVotes }}</div>
          <div class="sc-label">Total Votes Cast</div>
        </div>
      </div>
    </div>

  </div><!-- /content -->

  <div class="err" *ngIf="error">{{ error }}</div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}
    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #6366f1;padding:16px 16px 12px;display:flex;justify-content:space-between;align-items:flex-start}
    .eyebrow{font-size:10px;color:#6366f1;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;margin:0;letter-spacing:1px}
    .refresh-info{font-size:11px;color:#6b7280;display:flex;align-items:center;gap:6px;margin-top:4px}
    .refresh-btn{background:none;border:1px solid #333;color:#6b7280;padding:3px 8px;border-radius:5px;font-size:13px;cursor:pointer}
    .refresh-btn:disabled{opacity:0.4}

    .loading-full{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;gap:14px}
    .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite}
    .loading-label{font-size:13px;color:#6b7280;font-family:'Oswald',sans-serif;letter-spacing:1px}
    @keyframes spin{to{transform:rotate(360deg)}}

    .content{padding:12px 14px;display:flex;flex-direction:column;gap:16px}
    .err{color:#f87171;font-size:12px;text-align:center;padding:20px}

    /* Sections */
    .section{display:flex;flex-direction:column;gap:10px}
    .section-header{display:flex;align-items:center;gap:8px;border-bottom:1px solid #2a2a2a;padding-bottom:8px}
    .section-icon{font-size:18px}
    .section-title{font-family:'Oswald',sans-serif;font-size:12px;color:#9ca3af;letter-spacing:2px;font-weight:600}

    /* Stat cards */
    .card-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .card-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .card-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}

    .stat-card{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;transition:border-color 0.2s}
    .stat-card.green{border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.07)}
    .stat-card.red{border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.07)}
    .stat-card.amber{border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.07)}
    .stat-card.blue{border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.07)}
    .stat-card.pulse{animation:cardPulse 2s ease-in-out infinite}
    @keyframes cardPulse{0%,100%{box-shadow:none}50%{box-shadow:0 0 12px rgba(239,68,68,0.3)}}

    .sc-value{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;line-height:1}
    .sc-value.mono{font-family:'IBM Plex Mono',monospace;font-size:16px}
    .sc-unit{font-size:13px;color:#9ca3af;font-weight:400}
    .sc-label{font-size:10px;color:#6b7280;letter-spacing:0.5px;line-height:1.3;text-align:center}

    /* Rate / progress bar */
    .rate-card{background:#252525;border:1px solid #333;border-radius:10px;padding:13px 14px;display:flex;flex-direction:column;gap:8px}
    .rate-top{display:flex;justify-content:space-between;align-items:center}
    .rate-label{font-size:12px;color:#9ca3af;font-family:'Oswald',sans-serif;letter-spacing:1px}
    .rate-value{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700}
    .rate-value.good{color:#10b981}.rate-value.warn{color:#f59e0b}.rate-value.bad{color:#ef4444}
    .rate-sub{font-size:11px;color:#4b5563}
    .progress-track{background:#1c1c1c;border-radius:4px;height:8px;overflow:hidden}
    .progress-fill{height:100%;border-radius:4px;transition:width 0.6s ease}
    .fill-green{background:#10b981}.fill-amber{background:#f59e0b}.fill-red{background:#ef4444}

    /* Breakdown */
    .breakdown-card{background:#1c1c1c;border:1px solid #2a2a2a;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
    .breakdown-title{font-size:10px;color:#6b7280;letter-spacing:1.5px;font-family:'Oswald',sans-serif;text-transform:uppercase}
    .role-row{display:flex;align-items:center;gap:8px}
    .role-name{font-size:11px;color:#9ca3af;min-width:100px;font-family:'Oswald',sans-serif;letter-spacing:0.3px}
    .role-bar-wrap{flex:1;background:#252525;border-radius:3px;height:6px;overflow:hidden}
    .role-bar{height:100%;background:#6366f1;border-radius:3px;transition:width 0.5s ease;min-width:2px}
    .role-bar.red-bar{background:#ef4444}
    .role-count{font-size:11px;color:#e8e8e8;font-family:'IBM Plex Mono',monospace;min-width:24px;text-align:right}

    /* Trend */
    .trend-row{display:flex;align-items:center;gap:8px}
    .trend-month{font-size:11px;color:#6b7280;min-width:56px;font-family:'Oswald',sans-serif}
    .trend-bar-wrap{flex:1;background:#252525;border-radius:3px;height:6px;overflow:hidden}
    .trend-bar{height:100%;border-radius:3px;transition:width 0.5s ease;min-width:2px}
    .trend-stat{display:flex;flex-direction:column;align-items:flex-end;min-width:72px}
    .trend-rate{font-size:11px;font-family:'Oswald',sans-serif;font-weight:600}
    .trend-rate.good{color:#10b981}.trend-rate.warn{color:#f59e0b}.trend-rate.bad{color:#ef4444}
    .trend-amount{font-size:9px;color:#4b5563;font-family:'IBM Plex Mono',monospace}

    /* Color helpers */
    .good{color:#10b981}.warn{color:#f59e0b}.bad{color:#ef4444}
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  data: any     = null;
  loading       = false;
  error         = '';
  generatedAt: Date | null = null;

  // Shorthand getters
  get s()  { return this.data?.society      || {}; }
  get m()  { return this.data?.maintenance  || {}; }
  get c()  { return this.data?.complaints   || {}; }
  get np() { return this.data?.noticesPolls || {}; }

  get roleEntries():     [string, number][] { return Object.entries(this.s.roleBreakdown || {}); }
  get categoryEntries(): [string, number][] { return Object.entries(this.c.byCategory   || {}); }

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error   = '';
    this.http.get<any>(`${environment.apiUrl}/analytics/summary`).subscribe({
      next: r => {
        this.data        = r.data;
        this.generatedAt = new Date();
        this.loading     = false;
      },
      error: e => {
        this.error   = e.error?.message || 'Failed to load analytics.';
        this.loading = false;
      }
    });
  }

  barPct(val: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((val / total) * 100));
  }

  formatAmount(val: number): string {
    if (!val) return '0';
    if (val >= 100000) return (val / 100000).toFixed(1) + 'L';
    if (val >= 1000)   return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  }

  formatRole(role: string): string {
    const map: Record<string, string> = {
      RESIDENT: 'Resident', SECURITY_GUARD: 'Guard', FACILITY_MANAGER: 'FM',
      BUILDER_MANAGER: 'Builder Mgr', BDA_ENGINEER: 'BDA Eng',
      PRESIDENT: 'President', SECRETARY: 'Secretary', VOLUNTEER: 'Volunteer'
    };
    return map[role] || role;
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
