import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DeliveryService } from '@services/delivery.service';

@Component({
  selector: 'app-delivery-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" routerLink="/delivery/my">← Back</button>
        <h1>📋 Delivery Preferences</h1>
        <p>Instructions shown to the guard when your parcel arrives</p>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

      <form [formGroup]="form" (ngSubmit)="save()" *ngIf="!loading">

        <!-- Delivery Note -->
        <div class="section">
          <div class="section-icon">📝</div>
          <div class="section-body">
            <label>Delivery Note</label>
            <p class="hint">Shown to guard whenever a delivery arrives for you</p>
            <textarea formControlName="deliveryNote"
              placeholder="e.g. Leave at door if no answer. Ring bell twice."
              rows="3"></textarea>
            <div class="char-count">{{ form.get('deliveryNote')?.value?.length || 0 }} / 500</div>
          </div>
        </div>

        <!-- Preferred Collector -->
        <div class="section">
          <div class="section-icon">👤</div>
          <div class="section-body">
            <label>Preferred Collector</label>
            <p class="hint">Who the guard should look for / call</p>
            <input type="text" formControlName="preferredCollector"
              placeholder="e.g. Ask for wife - Meena (9876543210)" />
          </div>
        </div>

        <!-- Default Collector for Guard -->
        <div class="section">
          <div class="section-icon">⚡</div>
          <div class="section-body">
            <label>Default Collector Name</label>
            <p class="hint">Pre-fills the guard's "Collected by" field — saves time</p>
            <input type="text" formControlName="defaultCollectorName"
              placeholder="e.g. Meena (wife)" />
          </div>
        </div>

        <!-- DND Window -->
        <div class="section">
          <div class="section-icon">🔕</div>
          <div class="section-body">
            <label>Do-Not-Disturb Window</label>
            <p class="hint">Guard will see a DND warning if delivery arrives in this window</p>
            <div class="time-row">
              <div class="time-field">
                <span>From</span>
                <input type="time" formControlName="dndStart" />
              </div>
              <div class="time-sep">→</div>
              <div class="time-field">
                <span>To</span>
                <input type="time" formControlName="dndEnd" />
              </div>
              <button type="button" class="clear-dnd" (click)="clearDnd()"
                *ngIf="form.get('dndStart')?.value">✕ Clear</button>
            </div>

            <!-- Live DND status -->
            <div class="dnd-active" *ngIf="dndActive">
              🔕 DND is currently active
            </div>
            <div class="dnd-inactive" *ngIf="form.get('dndStart')?.value && !dndActive">
              ✅ DND window set — currently inactive
            </div>
          </div>
        </div>

        <div class="success-banner" *ngIf="saved">✅ Preferences saved!</div>
        <div class="err-banner"     *ngIf="error">{{ error }}</div>

        <button type="submit" class="btn-save" [disabled]="saving">
          {{ saving ? 'Saving...' : '💾 Save Preferences' }}
        </button>

      </form>

      <!-- Preview card — what the guard will see -->
      <div class="preview-section" *ngIf="hasAnyPreference()">
        <h3>👮 Guard will see this on your deliveries:</h3>
        <div class="preview-card">
          <div class="preview-row" *ngIf="form.get('deliveryNote')?.value">
            <span class="preview-lbl">📝 Note</span>
            <span>{{ form.get('deliveryNote')?.value }}</span>
          </div>
          <div class="preview-row" *ngIf="form.get('preferredCollector')?.value">
            <span class="preview-lbl">👤 Ask for</span>
            <span>{{ form.get('preferredCollector')?.value }}</span>
          </div>
          <div class="preview-row" *ngIf="form.get('dndStart')?.value && form.get('dndEnd')?.value">
            <span class="preview-lbl">🔕 DND</span>
            <span>{{ form.get('dndStart')?.value }} – {{ form.get('dndEnd')?.value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #0f3460);
      padding: 16px 16px 24px; color: white;
    }
    .back-btn {
      background: rgba(255,255,255,0.15); border: none; color: white;
      padding: 6px 12px; border-radius: 20px; font-size: 13px;
      cursor: pointer; margin-bottom: 12px; display: inline-block;
    }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; }
    .page-header p  { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .loading { display: flex; justify-content: center; padding: 60px; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #eee;
      border-top-color: #0f3460; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    form { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    .section {
      background: white; border-radius: 14px; padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; gap: 14px;
    }
    .section-icon { font-size: 24px; padding-top: 2px; flex-shrink: 0; }
    .section-body { flex: 1; }
    label { font-size: 15px; font-weight: 700; color: #1a1a2e; display: block; margin-bottom: 4px; }
    .hint { font-size: 12px; color: #999; margin: 0 0 10px; }

    input[type="text"], textarea {
      width: 100%; padding: 10px 12px; border: 1.5px solid #e5e7eb;
      border-radius: 10px; font-size: 14px; outline: none;
      background: #fafafa; box-sizing: border-box; color: #1a1a2e;
      font-family: inherit; resize: vertical;
    }
    input[type="text"]:focus, textarea:focus { border-color: #0f3460; background: white; }
    .char-count { font-size: 11px; color: #ccc; text-align: right; margin-top: 4px; }

    .time-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .time-field { display: flex; align-items: center; gap: 8px; }
    .time-field span { font-size: 13px; color: #888; }
    input[type="time"] {
      padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; outline: none; background: #fafafa; color: #1a1a2e;
    }
    input[type="time"]:focus { border-color: #0f3460; background: white; }
    .time-sep { color: #ccc; font-size: 18px; }
    .clear-dnd {
      background: #fee2e2; border: none; color: #991b1b; border-radius: 20px;
      padding: 6px 12px; font-size: 12px; cursor: pointer;
    }

    .dnd-active   { margin-top: 8px; font-size: 13px; color: #991b1b; background: #fee2e2; padding: 6px 10px; border-radius: 8px; }
    .dnd-inactive { margin-top: 8px; font-size: 13px; color: #166534; background: #dcfce7; padding: 6px 10px; border-radius: 8px; }

    .success-banner { background: #dcfce7; border-radius: 10px; padding: 12px 16px; font-size: 14px; color: #166534; text-align: center; }
    .err-banner     { background: #fee2e2; border-radius: 10px; padding: 12px 16px; font-size: 14px; color: #991b1b; }

    .btn-save {
      width: 100%; background: #0f3460; color: white; border: none;
      padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;
    }
    .btn-save:disabled { background: #ccc; cursor: not-allowed; }

    .preview-section { padding: 0 16px 24px; }
    .preview-section h3 { font-size: 14px; color: #555; margin-bottom: 10px; }
    .preview-card {
      background: #fffbeb; border: 1.5px solid #fcd34d; border-radius: 12px; padding: 14px;
    }
    .preview-row {
      display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid #fef3c7; font-size: 13px;
    }
    .preview-row:last-child { border: none; }
    .preview-lbl { font-weight: 600; color: #92400e; min-width: 80px; }
  `]
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
