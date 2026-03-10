import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

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
  imports: [CommonModule, RouterModule],
  templateUrl: "./permissions.component.html",
  styleUrls: ["./permissions.component.scss"]
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
