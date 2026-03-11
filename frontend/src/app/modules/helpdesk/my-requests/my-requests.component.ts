import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { AuthService } from '@services/auth.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.scss']
})
export class MyRequestsComponent implements OnInit {
  requests:         any[] = [];
  filteredRequests: any[] = [];
  loading = true;

  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stCfg  = STATUS_CONFIG   as Record<string, { label: string; color: string; bg: string; icon: string }>;

  activeFilter = 'ALL';

  filters = [
    { key: 'ALL',         label: 'All'         },
    { key: 'PENDING',     label: 'Pending'     },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'DONE',        label: 'Done'        },
    { key: 'CANCELLED',   label: 'Cancelled'   },
  ];

  constructor(private svc: HelpdeskService, private auth: AuthService) {}

  ngOnInit() {
    this.svc.getMyRequests().subscribe({
      next:  r => { this.requests = r.data; this.applyFilter('ALL'); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(key: string) {
    this.activeFilter      = key;
    this.filteredRequests  = key === 'ALL'
      ? this.requests
      : this.requests.filter(r => r.status === key);
  }

  countFor(key: string): number {
    return key === 'ALL'
      ? this.requests.length
      : this.requests.filter(r => r.status === key).length;
  }

  get totalCount()   { return this.requests.length; }
  get pendingCount() { return this.requests.filter(r => r.status === 'PENDING').length; }
  get doneCount()    { return this.requests.filter(r => r.status === 'DONE').length; }
}
