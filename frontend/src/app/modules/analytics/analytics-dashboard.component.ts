import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./analytics-dashboard.component.html",
  styleUrls: ["./analytics-dashboard.component.scss"]
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
