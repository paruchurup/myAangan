import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PollService } from '@services/poll.service';
import { Poll, POLL_STATUS_CONFIG, POLL_TYPE_CONFIG } from '@models/poll.model';

@Component({
  selector: 'app-manage-polls',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./manage-polls.component.html",
  styleUrls: ["./manage-polls.component.scss"]
})
export class ManagePollsComponent implements OnInit {
  polls: Poll[] = [];
  loading = true;
  activeFilter = 'ALL';
  filters = [
    { v: 'ALL', label: 'All' },
    { v: 'ACTIVE', label: '▶ Active' },
    { v: 'DRAFT', label: '✏️ Draft' },
    { v: 'CLOSED', label: '✓ Closed' },
    { v: 'ARCHIVED', label: '📦 Archived' },
  ];

  constructor(private svc: PollService) {}

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: r => { this.polls = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  filtered() {
    return this.activeFilter === 'ALL' ? this.polls
      : this.polls.filter(p => p.status === this.activeFilter);
  }

  count(f: string) {
    return f === 'ALL' ? this.polls.length : this.polls.filter(p => p.status === f).length;
  }

  topOpts(p: Poll) {
    return p.type === 'YES_NO' ? [] : [...p.options].sort((a,b)=>b.percentage-a.percentage).slice(0,3);
  }

  publish(p: Poll) { this.svc.publish(p.id).subscribe(r => this.updatePoll(r.data)); }
  close(p: Poll)   { this.svc.close(p.id).subscribe(r => this.updatePoll(r.data)); }
  archive(p: Poll) { this.svc.archive(p.id).subscribe(r => this.updatePoll(r.data)); }
  delete(p: Poll) {
    if (!confirm(`Delete "${p.question.slice(0,50)}…"?`)) return;
    this.svc.delete(p.id).subscribe(() => this.polls = this.polls.filter(x => x.id !== p.id));
  }

  updatePoll(updated: Poll) {
    const i = this.polls.findIndex(p => p.id === updated.id);
    if (i >= 0) this.polls[i] = updated;
  }

  stBg(p: Poll)    { return (POLL_STATUS_CONFIG as any)[p.status]?.bg    || '#f3f4f6'; }
  stColor(p: Poll) { return (POLL_STATUS_CONFIG as any)[p.status]?.color || '#555'; }
  stLabel(p: Poll) { return (POLL_STATUS_CONFIG as any)[p.status]?.label || p.status; }
  typeIcon(t: string)  { return (POLL_TYPE_CONFIG as any)[t]?.icon  || '🗳️'; }
  typeLabel(t: string) { return (POLL_TYPE_CONFIG as any)[t]?.label || t; }
}
