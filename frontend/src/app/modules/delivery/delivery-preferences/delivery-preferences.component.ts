import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DeliveryService } from '@services/delivery.service';

@Component({
  selector: 'app-delivery-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './delivery-preferences.component.html',
  styleUrls: ['./delivery-preferences.component.scss']
})
export class DeliveryPreferencesComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving  = false;
  saved   = false;
  error   = '';
  dndActive = false;

  constructor(private fb: FormBuilder, private svc: DeliveryService) {}

  ngOnInit() {
    this.form = this.fb.group({
      deliveryNote:         ['', Validators.maxLength(500)],
      preferredCollector:   [''],
      defaultCollectorName: [''],
      dndStart:             [''],
      dndEnd:               ['']
    });

    this.svc.getMyPreferences().subscribe({
      next: r => {
        this.form.patchValue({
          deliveryNote:         r.data.deliveryNote || '',
          preferredCollector:   r.data.preferredCollector || '',
          defaultCollectorName: r.data.defaultCollectorName || '',
          dndStart:             r.data.dndStart || '',
          dndEnd:               r.data.dndEnd || ''
        });
        this.dndActive = r.data.dndActive;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // Update DND active state as user changes times
    this.form.valueChanges.subscribe(v => {
      this.dndActive = this.checkDndActive(v.dndStart, v.dndEnd);
    });
  }

  clearDnd() {
    this.form.patchValue({ dndStart: '', dndEnd: '' });
  }

  hasAnyPreference(): boolean {
    const v = this.form.value;
    return !!(v.deliveryNote || v.preferredCollector || v.dndStart);
  }

  save() {
    this.saving = true;
    this.saved  = false;
    this.error  = '';
    const v = this.form.value;

    this.svc.saveMyPreferences({
      deliveryNote:         v.deliveryNote || null,
      preferredCollector:   v.preferredCollector || null,
      defaultCollectorName: v.defaultCollectorName || null,
      dndStart:             v.dndStart || null,
      dndEnd:               v.dndEnd || null
    }).subscribe({
      next: r => {
        this.saving = false;
        this.saved  = true;
        this.dndActive = r.data.dndActive;
        setTimeout(() => this.saved = false, 3000);
      },
      error: err => {
        this.saving = false;
        this.error  = err.error?.message || 'Failed to save preferences';
      }
    });
  }

  private checkDndActive(start: string, end: string): boolean {
    if (!start || !end) return false;
    try {
      const now  = new Date();
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const nowMins  = now.getHours() * 60 + now.getMinutes();
      const startMins = sh * 60 + sm;
      const endMins   = eh * 60 + em;
      return startMins < endMins
        ? nowMins >= startMins && nowMins < endMins
        : nowMins >= startMins || nowMins < endMins;
    } catch { return false; }
  }
}
