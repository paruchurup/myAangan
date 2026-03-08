import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="header">
    <button class="back-btn" (click)="router.navigate(['/events'])">← Back</button>
    <div class="title-wrap">
      <div class="eyebrow">CREATE EVENT</div>
      <h1>🎉 New Event</h1>
    </div>
  </div>

  <div class="form-body">
    <div class="section-label">EVENT DETAILS</div>
    <div class="field"><label>Event Name *</label><input [(ngModel)]="form.name" placeholder="e.g. Diwali Celebration 2025" /></div>
    <div class="field"><label>Description</label><textarea [(ngModel)]="form.description" rows="3" placeholder="Tell residents what to expect…"></textarea></div>
    <div class="field-row">
      <div class="field"><label>Event Date & Time *</label><input type="datetime-local" [(ngModel)]="form.eventDate" /></div>
      <div class="field"><label>Venue</label><input [(ngModel)]="form.venue" placeholder="e.g. Clubhouse" /></div>
    </div>
    <div class="field"><label>Estimated Budget (₹) *</label><input type="number" [(ngModel)]="form.estimatedBudget" placeholder="e.g. 15000" /></div>

    <div class="section-label">APPROVAL SETTINGS</div>
    <div class="field-row">
      <div class="field">
        <label>Quorum % (min residents who must vote) *</label>
        <input type="number" [(ngModel)]="form.quorumPct" min="10" max="100" placeholder="e.g. 50" />
        <small>Event approved if ≥ this % vote AND majority says YES</small>
      </div>
      <div class="field">
        <label>Voting Deadline *</label>
        <input type="datetime-local" [(ngModel)]="form.voteDeadline" />
      </div>
    </div>

    <div class="section-label">VOLUNTEER ROLES <span class="optional">(optional)</span></div>
    <div class="slot-list">
      <div class="slot-row" *ngFor="let slot of slots; let i = index">
        <div class="slot-fields">
          <input [(ngModel)]="slot.roleName" placeholder="Role name (e.g. Decoration)" class="slot-name" />
          <input [(ngModel)]="slot.roleDescription" placeholder="Description" class="slot-desc" />
          <div class="slot-max">
            <label>Max</label>
            <input type="number" [(ngModel)]="slot.maxVolunteers" min="1" max="50" class="slot-num" />
          </div>
        </div>
        <button class="remove-btn" (click)="removeSlot(i)">✕</button>
      </div>
    </div>
    <button class="add-slot-btn" (click)="addSlot()">+ Add Volunteer Role</button>

    <div class="error" *ngIf="error">{{ error }}</div>
    <button class="submit-btn" (click)="submit()" [disabled]="saving">
      {{ saving ? 'Creating…' : '🎉 Create Event (as Draft)' }}
    </button>
    <div class="note">Event will be saved as Draft. You can open voting when ready.</div>
  </div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8}
    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #f59e0b;padding:12px 16px;display:flex;align-items:center;gap:12px}
    .back-btn{background:none;border:1px solid #333;color:#9ca3af;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer}
    .eyebrow{font-size:10px;color:#f59e0b;letter-spacing:3px;font-family:'Oswald',sans-serif}
    h1{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#fff;margin:0}
    .form-body{padding:14px;display:flex;flex-direction:column;gap:12px}
    .section-label{font-family:'Oswald',sans-serif;font-size:10px;color:#f59e0b;letter-spacing:2px;border-bottom:1px solid #2a2a2a;padding-bottom:4px;margin-top:6px}
    .optional{color:#4b5563;font-size:9px}
    .field{display:flex;flex-direction:column;gap:4px}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    label{font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-family:'Oswald',sans-serif}
    input,textarea{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:9px 11px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;width:100%;box-sizing:border-box}
    input:focus,textarea:focus{border-color:#f59e0b}
    textarea{resize:vertical}
    small{font-size:10px;color:#4b5563}

    .slot-list{display:flex;flex-direction:column;gap:8px}
    .slot-row{display:flex;gap:8px;align-items:center;background:#252525;border:1px solid #333;border-radius:8px;padding:8px}
    .slot-fields{flex:1;display:flex;gap:8px;flex-wrap:wrap}
    .slot-name{flex:2;min-width:120px}
    .slot-desc{flex:3;min-width:140px}
    .slot-max{display:flex;align-items:center;gap:4px}
    .slot-max label{white-space:nowrap;font-size:10px;color:#6b7280}
    .slot-num{width:52px;text-align:center}
    .remove-btn{background:none;border:none;color:#4b5563;font-size:16px;cursor:pointer;padding:4px 6px;flex-shrink:0}
    .remove-btn:hover{color:#ef4444}
    .add-slot-btn{background:rgba(245,158,11,0.1);border:1px dashed rgba(245,158,11,0.4);color:#f59e0b;padding:10px;border-radius:7px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.5px}

    .error{background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#f87171;padding:8px 12px;border-radius:6px;font-size:12px}
    .submit-btn{background:#f59e0b;border:none;color:#111;padding:13px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;cursor:pointer}
    .submit-btn:disabled{opacity:0.4}
    .note{font-size:11px;color:#4b5563;text-align:center}
  `]
})
export class CreateEventComponent {
  form = { name: '', description: '', eventDate: '', venue: '', estimatedBudget: '', quorumPct: 50, voteDeadline: '' };
  slots: { roleName: string; roleDescription: string; maxVolunteers: number }[] = [];
  saving = false;
  error  = '';

  constructor(private svc: EventService, public router: Router) {}

  addSlot()        { this.slots.push({ roleName: '', roleDescription: '', maxVolunteers: 5 }); }
  removeSlot(i: number) { this.slots.splice(i, 1); }

  submit() {
    if (!this.form.name || !this.form.eventDate || !this.form.estimatedBudget || !this.form.voteDeadline) {
      this.error = 'Please fill in all required fields.'; return;
    }
    this.saving = true; this.error = '';
    const body = {
      ...this.form,
      estimatedBudget: this.form.estimatedBudget,
      quorumPct: this.form.quorumPct.toString(),
      volunteerSlots: this.slots.filter(s => s.roleName.trim())
    };
    this.svc.createEvent(body).subscribe({
      next: r => this.router.navigate(['/events', r.data.id]),
      error: e => { this.error = e.error?.message || 'Creation failed.'; this.saving = false; }
    });
  }
}
