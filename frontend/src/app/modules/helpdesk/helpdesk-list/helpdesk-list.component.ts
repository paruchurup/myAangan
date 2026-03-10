import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpdeskService } from '@services/helpdesk.service';
import { AuthService } from '@services/auth.service';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@models/helpdesk.model';

@Component({
  selector: 'app-helpdesk-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./helpdesk-list.component.html",
  styleUrls: ["./helpdesk-list.component.scss"]
})
export class HelpdeskListComponent implements OnInit {
  requests: any[] = [];
  loading   = false;
  canManage = false;
  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stsCfg = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(private svc: HelpdeskService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('HELPDESK_MANAGE');
    this.loading = true;
    this.svc.getMyRequests().subscribe({
      next: r => { this.requests = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
