import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '@services/event.service';
import { AuthService } from '@services/auth.service';
import { EVENT_STATUS_CONFIG } from '@models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./event-list.component.html",
  styleUrls: ["./event-list.component.scss"]
})
export class EventListComponent implements OnInit {
  events:     any[] = [];
  allEvents:  any[] = [];
  tab = 'ACTIVE';
  loading  = false;
  canCreate = false;
  statusCfg = EVENT_STATUS_CONFIG as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(private svc: EventService, private auth: AuthService) {}

  ngOnInit() {
    this.canCreate = this.auth.can('EVENT_CREATE');
    this.loadActive();
  }

  get displayEvents() { return this.tab === 'ACTIVE' ? this.events : this.allEvents; }

  loadActive() {
    this.loading = true;
    this.svc.getEvents().subscribe({
      next: r => { this.events = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadAll() {
    this.loading = true;
    this.svc.getAllEvents().subscribe({
      next: r => { this.allEvents = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
