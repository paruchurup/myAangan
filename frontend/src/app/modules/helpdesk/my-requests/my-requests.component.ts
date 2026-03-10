// my-requests.component.ts
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
  templateUrl: "./my-requests.component.html",
  styleUrls: ["./my-requests.component.scss"]
})
export class MyRequestsComponent implements OnInit {
  requests: any[] = [];
  loading = true;
  catCfg = CATEGORY_CONFIG as Record<string, { label: string; icon: string; color: string }>;
  stCfg  = STATUS_CONFIG  as Record<string, { label: string; color: string; bg: string; icon: string }>;
  constructor(private svc: HelpdeskService, private auth: AuthService) {}
  ngOnInit() {
    this.svc.getMyRequests().subscribe({ next: r => { this.requests = r.data; this.loading = false; }, error: () => this.loading = false });
  }
}
