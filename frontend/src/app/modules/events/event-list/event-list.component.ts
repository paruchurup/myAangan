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
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/dashboard">← Back</a>
      <button class="create-btn" *ngIf="canCreate" routerLink="/events/create">+ New Event</button>
    </div>
    <h1>🎉 Events</h1>
    <p>Society events and gatherings</p>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab" [class.active]="tab==='ACTIVE'" (click)="tab='ACTIVE'">Active</button>
    <button class="tab" [class.active]="tab==='ALL'"    (click)="tab='ALL'; loadAll()">All Events</button>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
  <div class="empty" *ngIf="!loading && displayEvents.length === 0">
    <div>🎊</div><p>No events yet</p>
    <small *ngIf="canCreate">Tap "+ New Event" to create the first one</small>
  </div>

  <div class="events-list">
    <a class="event-card" [routerLink]="['/events', e.id]" *ngFor="let e of displayEvents">
      <div class="event-stripe" [style.background]="statusCfg[e.status]?.color"></div>
      <div class="event-body">
        <div class="event-top">
          <div class="event-name">{{ e.name }}</div>
          <div class="status-pill"
            [style.background]="statusCfg[e.status]?.bg"
            [style.color]="statusCfg[e.status]?.color">
            {{ statusCfg[e.status]?.icon }} {{ statusCfg[e.status]?.label }}
          </div>
        </div>
        <div class="event-meta">
          <span>📅 {{ e.eventDate | date:'d MMM yyyy, h:mm a' }}</span>
          <span *ngIf="e.venue">📍 {{ e.venue }}</span>
        </div>
        <div class="event-desc" *ngIf="e.description">{{ e.description | slice:0:100 }}{{ e.description.length > 100 ? '…' : '' }}</div>
        <div class="event-footer">
          <span class="budget">Est. Budget: ₹{{ e.estimatedBudget | number:'1.0-0' }}</span>
          <span class="by">by {{ e.createdBy?.firstName }} {{ e.createdBy?.lastName }}</span>
        </div>
        <div class="vote-badge" *ngIf="e.status === 'VOTING'">
          🗳️ Voting closes {{ e.voteDeadline | date:'d MMM, h:mm a' }}
        </div>
      </div>
    </a>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#212121}
    .page-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:16px 16px 24px;color:white}
    .header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .back-btn{background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .page-header h1{font-size:22px;margin:0 0 4px;font-weight:700}
    .page-header p{font-size:13px;color:rgba(255,255,255,0.7);margin:0}
    .create-btn{background:#f59e0b;border:none;color:#111;padding:9px 14px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;cursor:pointer;white-space:nowrap}

    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:11px 4px;font-size:12px;font-family:'Oswald',sans-serif;letter-spacing:0.5px;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s}
    .tab.active{color:#f59e0b;border-bottom-color:#f59e0b}

    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:28px;height:28px;border:3px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#4b5563}
    .empty div{font-size:42px}.empty p{font-family:'Oswald',sans-serif;font-size:18px}.empty small{font-size:12px}

    .events-list{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .event-card{background:#252525;border:1px solid #333;border-radius:12px;display:flex;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.15s;cursor:pointer}
    .event-card:hover{border-color:#f59e0b}
    .event-stripe{width:5px;flex-shrink:0}
    .event-body{flex:1;padding:12px 14px;display:flex;flex-direction:column;gap:7px}
    .event-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
    .event-name{font-family:'Oswald',sans-serif;font-size:17px;font-weight:700;color:#fff;letter-spacing:0.5px;line-height:1.2}
    .status-pill{font-size:10px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:10px;font-weight:700;white-space:nowrap}
    .event-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:#6b7280}
    .event-desc{font-size:12px;color:#9ca3af;line-height:1.5}
    .event-footer{display:flex;justify-content:space-between;align-items:center}
    .budget{font-size:12px;color:#f59e0b;font-weight:600}
    .by{font-size:11px;color:#4b5563}
    .vote-badge{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;font-size:11px;padding:5px 10px;border-radius:6px;text-align:center}
  `]
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
