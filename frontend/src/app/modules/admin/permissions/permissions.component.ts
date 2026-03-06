import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Matrix { [role: string]: { [perm: string]: boolean } }

const PERMISSION_GROUPS: { label: string; perms: string[] }[] = [
  { label: 'Delivery',   perms: ['DELIVERY_LOG','DELIVERY_VIEW_ALL','DELIVERY_VIEW_OWN','DELIVERY_OTP_RESIDENT','DELIVERY_PREFERENCES'] },
  { label: 'Complaints', perms: ['COMPLAINT_RAISE','COMPLAINT_VIEW_OWN','COMPLAINT_VIEW_ALL','COMPLAINT_MANAGE','COMPLAINT_INTERNAL_NOTE','COMPLAINT_ESCALATE','COMPLAINT_PDF'] },
  { label: 'Services',   perms: ['SERVICE_VIEW','SERVICE_ADD','SERVICE_REVIEW','SERVICE_MANAGE'] },
  { label: 'Polls',      perms: ['POLL_VIEW','POLL_VOTE','POLL_MANAGE'] },
  { label: 'Notices',    perms: ['NOTICE_VIEW','NOTICE_MANAGE'] },
  { label: 'Vehicles',   perms: ['VEHICLE_REGISTER','VEHICLE_VIEW_ALL','VEHICLE_MANAGE','PARKING_MANAGE','VISITOR_VEHICLE_LOG'] },
  { label: 'Users',      perms: ['USER_MANAGE'] },
];

const ROLE_LABELS: Record<string, string> = {
  SECURITY_GUARD: '👮 Guard', RESIDENT: '🏠 Resident', VISITOR: '🧳 Visitor',
  FACILITY_MANAGER: '🔧 Facility Mgr', BUILDER_MANAGER: '🏗️ Builder Mgr',
  BDA_ENGINEER: '🏛️ BDA Eng', PRESIDENT: '🎖️ President',
  SECRETARY: '📋 Secretary', VOLUNTEER: '🤝 Volunteer',
};

const PERM_LABELS: Record<string, string> = {
  DELIVERY_LOG: 'Log delivery', DELIVERY_VIEW_ALL: 'View all deliveries',
  DELIVERY_VIEW_OWN: 'View own deliveries', DELIVERY_OTP_RESIDENT: 'OTP (resident)',
  DELIVERY_PREFERENCES: 'Delivery prefs',
  COMPLAINT_RAISE: 'Raise complaint', COMPLAINT_VIEW_OWN: 'View own complaints',
  COMPLAINT_VIEW_ALL: 'View all complaints', COMPLAINT_MANAGE: 'Manage/resolve',
  COMPLAINT_INTERNAL_NOTE: 'Internal notes', COMPLAINT_ESCALATE: 'Escalate',
  COMPLAINT_PDF: 'Download PDF report',
  SERVICE_VIEW: 'Browse services', SERVICE_ADD: 'Add/edit providers',
  SERVICE_REVIEW: 'Leave reviews', SERVICE_MANAGE: 'Approve/delete',
  POLL_VIEW: 'View polls', POLL_VOTE: 'Cast votes', POLL_MANAGE: 'Create/manage polls',
  NOTICE_VIEW: 'Read notices', NOTICE_MANAGE: 'Post/manage notices',
  VEHICLE_REGISTER: 'Register own vehicle', VEHICLE_VIEW_ALL: 'View all vehicles',
  VEHICLE_MANAGE: 'Approve/suspend vehicles', PARKING_MANAGE: 'Manage parking slots',
  VISITOR_VEHICLE_LOG: 'Log visitor vehicles',
  USER_MANAGE: 'Manage users',
};

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page">
  <div class="header">
    <h1>⚙️ Role Permissions</h1>
    <p>Toggle permissions per role. Changes take effect immediately — no redeploy needed.</p>
    <div class="admin-note">🔒 Admin always has all permissions and cannot be restricted.</div>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div *ngIf="!loading" class="content">
    <div class="save-bar" *ngIf="pendingChanges">
      <span>⚠️ {{ pendingCount }} unsaved change{{ pendingCount === 1 ? '' : 's' }}</span>
      <div class="bar-actions">
        <button class="btn-discard" (click)="discardChanges()">Discard</button>
        <button class="btn-save" (click)="saveAll()" [disabled]="saving">
          {{ saving ? 'Saving…' : 'Save All Changes' }}
        </button>
      </div>
    </div>

    <div class="success-banner" *ngIf="savedMsg">{{ savedMsg }}</div>
    <div class="error-banner"   *ngIf="errorMsg">{{ errorMsg }}</div>

    <div *ngFor="let group of groups" class="group-card">
      <h2 class="group-title">{{ group.label }}</h2>
      <div class="perm-row header-row">
        <div class="perm-label"></div>
        <div class="role-col" *ngFor="let role of roles">
          <span class="role-tag">{{ roleLabel(role) }}</span>
        </div>
      </div>
      <div class="perm-row" *ngFor="let perm of group.perms; let odd = odd" [class.odd]="odd">
        <div class="perm-label">
          <span class="perm-name">{{ permLabel(perm) }}</span>
          <span class="perm-key">{{ perm }}</span>
        </div>
        <div class="role-col" *ngFor="let role of roles">
          <label class="toggle" [title]="roleLabel(role) + ' → ' + perm">
            <input type="checkbox"
              [checked]="getVal(role, perm)"
              (change)="toggle(role, perm, $event)"
              [disabled]="role === 'VISITOR'" />
            <span class="slider" [class.changed]="isChanged(role, perm)"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f5f6fa; padding-bottom:80px }
    .header { background:linear-gradient(135deg,#1a1a2e,#0f3460); padding:20px 20px 28px; color:white }
    .header h1 { font-size:22px; margin:0 0 6px }
    .header p  { font-size:13px; color:rgba(255,255,255,0.7); margin:0 0 10px }
    .admin-note { font-size:12px; background:rgba(255,255,255,0.12); padding:6px 12px; border-radius:8px; display:inline-block }
    .loading { display:flex; justify-content:center; padding:60px }
    .spinner { width:32px; height:32px; border:3px solid #eee; border-top-color:#0f3460; border-radius:50%; animation:spin 0.8s linear infinite }
    @keyframes spin { to { transform:rotate(360deg) } }
    .content { padding:16px }

    .save-bar {
      display:flex; justify-content:space-between; align-items:center;
      background:#1a1a2e; color:white; padding:12px 16px; border-radius:12px;
      margin-bottom:12px; font-size:14px; font-weight:600;
    }
    .bar-actions { display:flex; gap:10px }
    .btn-save { background:#22c55e; color:white; border:none; padding:8px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer }
    .btn-save:disabled { opacity:0.5 }
    .btn-discard { background:rgba(255,255,255,0.15); color:white; border:none; padding:8px 16px; border-radius:8px; font-size:13px; cursor:pointer }
    .success-banner { background:#dcfce7; color:#166534; padding:10px 14px; border-radius:10px; margin-bottom:12px; font-size:13px }
    .error-banner   { background:#fee2e2; color:#991b1b; padding:10px 14px; border-radius:10px; margin-bottom:12px; font-size:13px }

    .group-card { background:white; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.06); margin-bottom:14px; overflow-x:auto }
    .group-title { font-size:15px; font-weight:800; color:#0f3460; margin:0 0 12px; border-bottom:2px solid #e8f0fe; padding-bottom:8px }

    .perm-row { display:flex; align-items:center; min-width:max-content }
    .perm-row.odd { background:#f8f9ff; border-radius:8px }
    .header-row { margin-bottom:4px }

    .perm-label { width:220px; flex-shrink:0; padding:8px 10px; display:flex; flex-direction:column; gap:2px }
    .perm-name  { font-size:13px; color:#1a1a2e; font-weight:600 }
    .perm-key   { font-size:10px; color:#aaa; font-family:monospace }

    .role-col { width:90px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; padding:6px 4px }
    .role-tag { font-size:10px; color:#555; text-align:center; line-height:1.3; font-weight:600 }

    /* Toggle switch */
    .toggle { position:relative; display:inline-block; width:36px; height:20px; cursor:pointer }
    .toggle input { opacity:0; width:0; height:0 }
    .slider {
      position:absolute; inset:0; background:#ddd; border-radius:20px; transition:0.2s;
    }
    .slider:before {
      content:''; position:absolute; width:14px; height:14px; left:3px; top:3px;
      background:white; border-radius:50%; transition:0.2s;
    }
    input:checked + .slider { background:#0f3460 }
    input:checked + .slider:before { transform:translateX(16px) }
    input:disabled + .slider { opacity:0.35; cursor:not-allowed }
    .slider.changed { outline:2px solid #f59e0b; outline-offset:1px }
  `]
})
export class PermissionsComponent implements OnInit {
  matrix: Matrix = {};
  original: Matrix = {};
  pending: Matrix = {}; // role → perm → value changes
  roles: string[] = [];
  groups = PERMISSION_GROUPS;
  loading = true;
  saving = false;
  savedMsg = '';
  errorMsg = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/admin/permissions`).subscribe({
      next: res => {
        this.matrix   = res.data;
        this.original = JSON.parse(JSON.stringify(res.data));
        this.roles    = Object.keys(res.data);
        this.loading  = false;
      },
      error: () => { this.errorMsg = 'Failed to load permissions'; this.loading = false; }
    });
  }

  getVal(role: string, perm: string): boolean {
    return this.pending[role]?.[perm] !== undefined
      ? this.pending[role][perm]
      : (this.matrix[role]?.[perm] ?? false);
  }

  isChanged(role: string, perm: string): boolean {
    return this.pending[role]?.[perm] !== undefined &&
           this.pending[role][perm] !== (this.original[role]?.[perm] ?? false);
  }

  toggle(role: string, perm: string, event: Event) {
    const val = (event.target as HTMLInputElement).checked;
    if (!this.pending[role]) this.pending[role] = {};
    if (val === (this.original[role]?.[perm] ?? false)) {
      delete this.pending[role][perm]; // back to original — remove from pending
    } else {
      this.pending[role][perm] = val;
    }
  }

  get pendingChanges(): boolean {
    return Object.values(this.pending).some(p => Object.keys(p).length > 0);
  }

  get pendingCount(): number {
    return Object.values(this.pending).reduce((sum, p) => sum + Object.keys(p).length, 0);
  }

  discardChanges() { this.pending = {}; }

  saveAll() {
    this.saving = true;
    this.errorMsg = '';
    const saves = Object.entries(this.pending)
      .filter(([, perms]) => Object.keys(perms).length > 0)
      .map(([role, perms]) =>
        this.http.put<any>(`${environment.apiUrl}/admin/permissions/${role}`, perms).toPromise()
      );

    Promise.all(saves).then(() => {
      // Merge pending into matrix and original
      for (const [role, perms] of Object.entries(this.pending)) {
        for (const [perm, val] of Object.entries(perms)) {
          if (!this.matrix[role])   this.matrix[role]   = {};
          if (!this.original[role]) this.original[role] = {};
          this.matrix[role][perm]   = val;
          this.original[role][perm] = val;
        }
      }
      this.pending  = {};
      this.saving   = false;
      this.savedMsg = '✅ Permissions saved. New logins will reflect these changes immediately.';
      setTimeout(() => this.savedMsg = '', 4000);
    }).catch(() => {
      this.saving   = false;
      this.errorMsg = 'Some changes failed to save. Please try again.';
    });
  }

  roleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }
  permLabel(perm: string):  string { return PERM_LABELS[perm]  ?? perm; }
}
