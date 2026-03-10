import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PollService } from '@services/poll.service';
import { AuthService } from '@services/auth.service';
import { Poll, POLL_TYPE_CONFIG } from '@models/poll.model';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./poll-list.component.html",
  styleUrls: ["./poll-list.component.scss"]
})
export class PollListComponent implements OnInit {
  polls: Poll[] = [];
  stats: any = {};
  loading = true;
  canManage = false;

  constructor(private svc: PollService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('POLL_MANAGE');
    this.svc.getStats().subscribe(r => this.stats = r.data);
    this.svc.getActive().subscribe({ next: r => { this.polls = r.data; this.loading = false; }, error: () => this.loading = false });
  }

  get activePolls() { return this.polls.filter(p => p.status === 'ACTIVE'); }
  get closedPolls() { return this.polls.filter(p => p.status === 'CLOSED'); }
  typeIcon(t: string)  { return (POLL_TYPE_CONFIG as any)[t]?.icon  || '🗳️'; }
  typeLabel(t: string) { return (POLL_TYPE_CONFIG as any)[t]?.label || t; }
  topOpts(p: Poll)     { return [...p.options].sort((a,b)=>b.percentage-a.percentage).slice(0,3); }
  isUrgent(p: Poll)    { return !!p.secondsRemaining && p.secondsRemaining < 86400; }
  timeLeft(p: Poll): string {
    const s = p.secondsRemaining;
    if (!s && s !== 0) return '';
    if (s <= 0)   return 'Ended';
    if (s < 3600) return Math.floor(s/60)+'m left';
    if (s < 86400)return Math.floor(s/3600)+'h left';
    return Math.floor(s/86400)+'d left';
  }
}
