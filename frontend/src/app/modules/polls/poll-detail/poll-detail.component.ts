import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PollService } from '@services/poll.service';
import { AuthService } from '@services/auth.service';
import { Poll, POLL_TYPE_CONFIG, POLL_STATUS_CONFIG } from '@models/poll.model';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./poll-detail.component.html",
  styleUrls: ["./poll-detail.component.scss"]
})
export class PollDetailComponent implements OnInit {
  poll: Poll | null = null;
  loading = true;
  canManage = false;
  selectedOptions: number[] = [];
  yesNoVal = '';
  ratingVal = 0;
  newComment = '';
  voting = false;
  voteErr = '';

  constructor(private route: ActivatedRoute, private svc: PollService, private auth: AuthService) {}

  ngOnInit() {
    this.canManage = this.auth.can('POLL_MANAGE');
    this.load();
  }

  load() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: r => {
        this.poll = r.data;
        this.loading = false;
        // Pre-fill my previous votes
        if (this.poll.hasVoted) {
          this.selectedOptions = [...(this.poll.myOptionIds || [])];
          this.yesNoVal = this.poll.myYesNoValue || '';
          this.ratingVal = this.poll.myRatingValue || 0;
        }
      },
      error: () => this.loading = false
    });
  }

  selectSingle(id: number)  { this.selectedOptions = [id]; }
  toggleOption(id: number) {
    const idx = this.selectedOptions.indexOf(id);
    const max = this.poll?.maxChoices || 0;
    if (idx >= 0) { this.selectedOptions.splice(idx, 1); }
    else if (max === 0 || this.selectedOptions.length < max) { this.selectedOptions.push(id); }
  }

  canSubmit(): boolean {
    if (!this.poll) return false;
    switch (this.poll.type) {
      case 'SINGLE_CHOICE':   return this.selectedOptions.length === 1;
      case 'MULTIPLE_CHOICE': return this.selectedOptions.length >= 1;
      case 'YES_NO':          return !!this.yesNoVal;
      case 'RATING':          return this.ratingVal >= 1;
    }
  }

  submitVote() {
    if (!this.poll || !this.canSubmit()) return;
    this.voting = true;
    this.voteErr = '';
    const body: any = {};
    if (this.poll.type === 'SINGLE_CHOICE' || this.poll.type === 'MULTIPLE_CHOICE') body.optionIds = this.selectedOptions;
    if (this.poll.type === 'YES_NO')   body.yesNoValue  = this.yesNoVal;
    if (this.poll.type === 'RATING')   body.ratingValue = this.ratingVal;
    this.svc.vote(this.poll.id, body).subscribe({
      next: r => { this.poll = r.data; this.voting = false; },
      error: e => { this.voteErr = e.error?.message || 'Vote failed. Please try again.'; this.voting = false; }
    });
  }

  submitComment() {
    if (!this.poll || !this.newComment.trim()) return;
    this.svc.addComment(this.poll.id, this.newComment).subscribe({
      next: () => { this.newComment = ''; this.load(); }
    });
  }

  delComment(id: number) {
    this.svc.deleteComment(id).subscribe({ next: () => this.load() });
  }

  doPublish() { this.svc.publish(this.poll!.id).subscribe({ next: r => this.poll = r.data }); }
  doClose()   { this.svc.close(this.poll!.id).subscribe({ next: r => this.poll = r.data }); }
  doArchive() { this.svc.archive(this.poll!.id).subscribe({ next: r => this.poll = r.data }); }

  typeIcon()  { return (POLL_TYPE_CONFIG as any)[this.poll!.type]?.icon  || '🗳️'; }
  typeLabel() { return (POLL_TYPE_CONFIG as any)[this.poll!.type]?.label || this.poll!.type; }
  stBg()    { return (POLL_STATUS_CONFIG as any)[this.poll!.status]?.bg    || '#f3f4f6'; }
  stColor() { return (POLL_STATUS_CONFIG as any)[this.poll!.status]?.color || '#555'; }
  stLabel() { return (POLL_STATUS_CONFIG as any)[this.poll!.status]?.label || this.poll!.status; }

  isUrgent() { return !!this.poll?.secondsRemaining && this.poll.secondsRemaining < 86400; }
  timeLeft(): string {
    const s = this.poll?.secondsRemaining;
    if (!s && s !== 0) return '';
    if (s <= 0)   return 'Ended';
    if (s < 3600) return Math.floor(s/60)+'m left';
    if (s < 86400)return Math.floor(s/3600)+'h left';
    return Math.floor(s/86400)+'d left';
  }

  isWinner(o: any): boolean {
    const max = Math.max(...this.poll!.options.map(x => x.voteCount));
    return o.voteCount === max && max > 0;
  }

  ynPct(which: 'yes'|'no'|'abs'): string {
    const r = this.poll!.results!;
    const t = r.yesCount + r.noCount + r.abstainCount;
    if (!t) return '0';
    const v = which === 'yes' ? r.yesCount : which === 'no' ? r.noCount : r.abstainCount;
    return (v / t * 100).toFixed(0);
  }

  starPct(s: number): number {
    const dist = this.poll!.results!.ratingDistribution;
    const total = Object.values(dist).reduce((a,b) => a+b, 0);
    return total ? (dist[s] || 0) / total * 100 : 0;
  }

  ratingLabel(): string {
    const labels = ['','Terrible','Poor','Average','Good','Excellent'];
    return labels[this.ratingVal] || '';
  }
}
