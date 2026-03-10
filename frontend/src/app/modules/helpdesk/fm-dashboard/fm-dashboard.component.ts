import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { CATEGORY_CONFIG, STATUS_CONFIG, ServiceRequestStatus } from '@models/helpdesk.model';

@Component({
  selector: 'app-fm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./fm-dashboard.component.html",
  styleUrls: ["./fm-dashboard.component.scss"]
})
export class FmDashboardComponent implements OnInit {
  allRequests: any[] = [];
  counts = { pending: 0, assigned: 0, inProgress: 0, done: 0 };
  loading   = false;
  filterTab: string = 'ALL';

  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stsCfg = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(private svc: HelpdeskService) {}

  ngOnInit() {
    this.loading = true;
    this.svc.getDashboard().subscribe({
      next: r => {
        this.counts = {
          pending:    r.data.pending,
          assigned:   r.data.assigned,
          inProgress: r.data.inProgress,
          done:       r.data.done,
        };
        this.allRequests = r.data.open;
        this.loading = false;
      },
      error: () => this.loading = false
    });
    // Also load all requests for filtering
    this.svc.getAll().subscribe({
      next: r => this.allRequests = r.data
    });
  }

  get filtered() {
    if (this.filterTab === 'ALL') return this.allRequests;
    return this.allRequests.filter(r => r.status === this.filterTab);
  }
}
