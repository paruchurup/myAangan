import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '@services/event.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./create-event.component.html",
  styleUrls: ["./create-event.component.scss"]
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
