import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PollService } from '@services/poll.service';

interface OptionDraft { text: string; emoji: string; }

@Component({
  selector: 'app-cr' +
      '' +
      '' +
      '' +
      '' +
      '' +
      '' +
      'eate-poll',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./create-poll.component.html",
  styleUrls: ["./create-poll.component.scss"]
})
export class CreatePollComponent {
  q = {
    question: '', description: '', type: 'SINGLE_CHOICE',
    anonymous: false, allowVoteChange: true, allowComments: true,
    maxChoices: 0, resultVisibility: 'AFTER_VOTE',
    targetBlocks: '', startsAt: '', endsAt: ''
  };
  options: OptionDraft[] = [{ text: '', emoji: '' }, { text: '', emoji: '' }];
  submitting = false;
  error = '';
  blocks = ['A','B','C','D','E','F'];

  types = [
    { value: 'SINGLE_CHOICE',   icon: '⭕', label: 'Single Choice',   desc: 'Pick one option' },
    { value: 'MULTIPLE_CHOICE', icon: '☑️', label: 'Multiple Choice', desc: 'Pick several' },
    { value: 'YES_NO',          icon: '👍', label: 'Yes / No',        desc: 'Simple agreement' },
    { value: 'RATING',          icon: '⭐', label: 'Star Rating',     desc: '1–5 stars' },
  ];

  constructor(private svc: PollService, private router: Router) {}

  resetOptions() {
    this.options = [{ text: '', emoji: '' }, { text: '', emoji: '' }];
    this.q.maxChoices = 0;
  }
  addOption() { if (this.options.length < 10) this.options.push({ text: '', emoji: '' }); }
  rmOption(i: number) { if (this.options.length > 2) this.options.splice(i, 1); }

  isValid(): boolean {
    if (!this.q.question.trim()) return false;
    if ((this.q.type === 'SINGLE_CHOICE' || this.q.type === 'MULTIPLE_CHOICE')) {
      return this.options.filter(o => o.text.trim()).length >= 2;
    }
    return true;
  }

  submit(publishNow: boolean) {
    if (!this.isValid()) { this.error = 'Please fill in the question and at least 2 options.'; return; }
    this.submitting = true; this.error = '';

    const body: any = {
      question: this.q.question.trim(),
      description: this.q.description.trim() || null,
      type: this.q.type,
      anonymous: this.q.anonymous,
      allowVoteChange: this.q.allowVoteChange,
      allowComments: this.q.allowComments,
      maxChoices: +this.q.maxChoices,
      resultVisibility: this.q.resultVisibility,
      targetBlocks: this.q.targetBlocks || null,
      startsAt: this.q.startsAt || null,
      endsAt: this.q.endsAt || null,
    };

    if (this.q.type === 'SINGLE_CHOICE' || this.q.type === 'MULTIPLE_CHOICE') {
      body.options = this.options
        .filter(o => o.text.trim())
        .map((o, i) => ({ text: o.text.trim(), emoji: o.emoji || null, displayOrder: i }));
    }

    this.svc.create(body).subscribe({
      next: r => {
        if (publishNow) {
          this.svc.publish(r.data.id).subscribe({
            next: () => this.router.navigate(['/polls', r.data.id]),
            error: () => this.router.navigate(['/polls/manage'])
          });
        } else {
          this.router.navigate(['/polls/manage']);
        }
      },
      error: e => { this.error = e.error?.message || 'Failed to create poll.'; this.submitting = false; }
    });
  }
}
