import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-manage-helpdesk',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./manage-helpdesk.component.html",
  styleUrls: ["./manage-helpdesk.component.scss"]
})
export class ManageHelpdeskComponent implements OnInit {
  requests:     any[]            = [];
  counts:       Record<string,number> = {};
  loading      = false;
  statusFilter = '';
  catFilter    = '';

  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stCfg  = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;
  statusKeys = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DONE'] as const;
  catKeys    = ['PLUMBING', 'ELECTRICAL', 'HOUSEKEEPING'] as const;

  constructor(private svc: HelpdeskService) {}

  ngOnInit() { this.loadCounts(); this.loadRequests(); }

  get totalCount() { return Object.values(this.counts).reduce((a, b) => a + b, 0); }

  loadCounts() {
    this.svc.getCounts().subscribe({ next: r => this.counts = r.data, error: () => {} });
  }

  loadRequests() {
    this.loading = true;
    this.svc.getAllRequests(this.statusFilter || undefined, this.catFilter || undefined).subscribe({
      next: r => { this.requests = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  setStatusFilter(s: string) { this.statusFilter = s; this.loadRequests(); }
  setCatFilter(c: string)    { this.catFilter    = c; this.loadRequests(); }
}
