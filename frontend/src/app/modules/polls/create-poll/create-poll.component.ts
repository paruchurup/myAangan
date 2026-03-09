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
  template: `
<div class="page">
  <div class="page-header">
    <div class="header-row">
      <a class="back-btn" routerLink="/polls">← Back</a>
    </div>
    <h1>🗳️ Create Poll</h1>
    <p>Start a new community vote</p>
  </div>

  <div class="form">
    <!-- Step 1: Basic -->
    <div class="card">
      <h2>1 · The Question</h2>
      <label>Question *</label>
      <textarea [(ngModel)]="q.question" rows="2" placeholder="What would you like to ask residents?" maxlength="300"></textarea>
      <span class="hint">{{ q.question.length }}/300</span>

      <label>Background / Context</label>
      <textarea [(ngModel)]="q.description" rows="3" placeholder="Optional: provide context to help residents vote informedly…" maxlength="1000"></textarea>
    </div>

    <!-- Step 2: Type -->
    <div class="card">
      <h2>2 · Poll Type</h2>
      <div class="type-grid">
        <button *ngFor="let t of types" class="type-btn"
          [class.sel]="q.type===t.value" (click)="q.type=t.value; resetOptions()">
          <span class="ti">{{ t.icon }}</span>
          <span class="tl">{{ t.label }}</span>
          <span class="td">{{ t.desc }}</span>
        </button>
      </div>
    </div>

    <!-- Options (for choice polls) -->
    <div class="card" *ngIf="q.type==='SINGLE_CHOICE'||q.type==='MULTIPLE_CHOICE'">
      <h2>3 · Options</h2>
      <div class="opts-list">
        <div class="opt-row" *ngFor="let o of options; let i=index">
          <input class="emoji-in" [(ngModel)]="o.emoji" placeholder="😊" maxlength="2" />
          <input class="text-in" [(ngModel)]="o.text" [placeholder]="'Option '+(i+1)" maxlength="300" />
          <button class="rm" (click)="rmOption(i)" [disabled]="options.length<=2">×</button>
        </div>
      </div>
      <button class="add-opt" (click)="addOption()" [disabled]="options.length>=10">+ Add Option</button>
      <div *ngIf="q.type==='MULTIPLE_CHOICE'" class="max-row">
        <label>Max choices per voter</label>
        <select [(ngModel)]="q.maxChoices">
          <option [value]="0">Unlimited</option>
          <option *ngFor="let n of [2,3,4,5]" [value]="n">{{ n }}</option>
        </select>
      </div>
    </div>

    <!-- Step: Settings -->
    <div class="card">
      <h2>⚙️ Settings</h2>

      <div class="setting-row">
        <div class="sr-label">
          <span>🔒 Anonymous voting</span>
          <small>Voter names hidden from results</small>
        </div>
        <label class="tog">
          <input type="checkbox" [(ngModel)]="q.anonymous" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-row">
        <div class="sr-label">
          <span>🔄 Allow vote change</span>
          <small>Voters can update their vote before close</small>
        </div>
        <label class="tog">
          <input type="checkbox" [(ngModel)]="q.allowVoteChange" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-row">
        <div class="sr-label">
          <span>💬 Allow comments</span>
          <small>Residents can discuss the poll</small>
        </div>
        <label class="tog">
          <input type="checkbox" [(ngModel)]="q.allowComments" />
          <span class="slider"></span>
        </label>
      </div>

      <label>Result visibility</label>
      <select [(ngModel)]="q.resultVisibility">
        <option value="AFTER_VOTE">After voting — voter sees results immediately</option>
        <option value="AFTER_CLOSE">After poll closes — hidden until closed</option>
        <option value="ADMIN_ONLY">Organisers only — never visible to voters</option>
      </select>

      <label>Target audience</label>
      <select [(ngModel)]="q.targetBlocks">
        <option value="">All residents</option>
        <option *ngFor="let b of blocks" [value]="b">Block {{ b }} only</option>
      </select>
    </div>

    <!-- Scheduling -->
    <div class="card">
      <h2>📅 Scheduling</h2>
      <p class="hint-p">Leave blank to publish manually. Set dates for auto-publish and auto-close.</p>
      <div class="date-row">
        <div class="df">
          <label>Opens at</label>
          <input type="datetime-local" [(ngModel)]="q.startsAt" />
        </div>
        <div class="df">
          <label>Closes at</label>
          <input type="datetime-local" [(ngModel)]="q.endsAt" />
        </div>
      </div>
    </div>

    <!-- Errors -->
    <div class="err" *ngIf="error">{{ error }}</div>

    <!-- Actions -->
    <div class="actions">
      <button class="save-draft" (click)="submit(false)" [disabled]="submitting">
        {{ submitting ? 'Saving…' : '💾 Save as Draft' }}
      </button>
      <button class="publish" (click)="submit(true)" [disabled]="submitting||!isValid()">
        {{ submitting ? 'Publishing…' : '▶ Publish Now' }}
      </button>
    </div>
  </div>
</div>`,
  styles: [`
    .page{min-height:100vh;background:#f5f6fa;padding-bottom:80px;color:#212121}
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .form{padding:14px;display:flex;flex-direction:column;gap:14px}
    .card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px}
    h2{color:#e2e8f0;font-size:14px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px}
    label{display:block;color:#9ca3af;font-size:12px;font-weight:600;margin-bottom:4px;margin-top:12px}
    label:first-of-type{margin-top:0}
    textarea,input[type=text],select{width:100%;background:#1f2937;border:1.5px solid #374151;border-radius:10px;color:#e2e8f0;padding:10px 12px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;resize:vertical}
    input[type=datetime-local]{width:100%;background:#1f2937;border:1.5px solid #374151;border-radius:10px;color:#e2e8f0;padding:10px 12px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;color-scheme:dark}
    input[type=datetime-local]::-webkit-calendar-picker-indicator{opacity:0.9;cursor:pointer}
    textarea:focus,input:focus,select:focus{border-color:#7c3aed}
    select option{background:#1f2937}
    .hint{font-size:11px;color:#4b5563;display:block;text-align:right;margin-top:3px}
    .hint-p{font-size:12px;color:#4b5563;margin:0 0 12px}

    /* Type grid */
    .type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .type-btn{background:#1f2937;border:1.5px solid #374151;border-radius:12px;padding:12px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:4px;transition:all 0.15s}
    .type-btn.sel{background:rgba(124,58,237,0.15);border-color:#7c3aed}
    .ti{font-size:20px}.tl{color:#e2e8f0;font-size:13px;font-weight:700}.td{color:#6b7280;font-size:11px}

    /* Options */
    .opts-list{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
    .opt-row{display:flex;gap:8px;align-items:center}
    .emoji-in{width:48px;flex-shrink:0;text-align:center;font-size:18px;padding:8px 4px}
    .text-in{flex:1}
    .rm{background:rgba(239,68,68,0.15);border:none;color:#f87171;width:32px;height:40px;border-radius:8px;font-size:18px;cursor:pointer;flex-shrink:0}
    .rm:disabled{opacity:0.3;cursor:not-allowed}
    .add-opt{background:rgba(124,58,237,0.15);border:1.5px dashed #7c3aed;color:#a78bfa;padding:8px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;width:100%}
    .add-opt:disabled{opacity:0.4}
    .max-row{display:flex;align-items:center;gap:12px;margin-top:12px}
    .max-row label{margin:0;white-space:nowrap}
    .max-row select{width:auto;flex-shrink:0}

    /* Settings toggles */
    .setting-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #1f2937}
    .setting-row:last-of-type{border-bottom:none}
    .sr-label{display:flex;flex-direction:column;gap:3px}
    .sr-label span{color:#e2e8f0;font-size:14px}
    .sr-label small{color:#4b5563;font-size:11px}
    .tog{position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0}
    .tog input{opacity:0;width:0;height:0}
    .slider{position:absolute;inset:0;background:#374151;border-radius:24px;transition:0.2s;cursor:pointer}
    .slider:before{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:0.2s}
    input:checked+.slider{background:#7c3aed}
    input:checked+.slider:before{transform:translateX(20px)}

    /* Scheduling */
    .date-row{display:grid;grid-template-columns:1fr;gap:12px}
    .df{display:flex;flex-direction:column;gap:4px}
    .df label{margin:0}

    /* Actions */
    .err{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:12px;border-radius:10px;font-size:13px}
    .actions{display:flex;gap:10px}
    .save-draft{flex:1;padding:13px;background:#1f2937;border:1.5px solid #374151;color:#9ca3af;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer}
    .publish{flex:2;padding:13px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;color:#fff;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer}
    .publish:disabled{opacity:0.4;cursor:not-allowed}
  `]
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
