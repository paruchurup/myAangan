import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { Role } from '@models/user.model';

// Roles that can self-register via the public form
const SELF_REGISTER_ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'RESIDENT',       label: '🏠 Resident',         description: 'Flat owner or tenant' },
  { value: 'SECURITY_GUARD', label: '👮 Security Guard',    description: 'Gate / security staff' },
  { value: 'VISITOR',        label: '🧳 Visitor',           description: 'Guest visiting a resident' },
  { value: 'FACILITY_MANAGER', label: '🔧 Facility Manager', description: 'Handles maintenance & complaints' },
  { value: 'BUILDER_MANAGER',  label: '🏗️ Builder Manager',  description: 'Escalation point for FM' },
  { value: 'BDA_ENGINEER',     label: '🏛️ BDA Engineer',     description: 'Government authority escalation' },
  { value: 'PRESIDENT',    label: '🎖️ President',    description: 'Society office bearer' },
  { value: 'SECRETARY',    label: '📋 Secretary',    description: 'Society office bearer' },
  { value: 'VOLUNTEER',    label: '🤝 Volunteer',    description: 'Society helper / committee member' },
];

// Roles requiring Admin approval notice
const APPROVAL_ROLES: Role[] = ['RESIDENT', 'VISITOR'];
// Roles that are auto-approved on registration
const AUTO_APPROVED_ROLES: Role[] = [
  'SECURITY_GUARD', 'FACILITY_MANAGER', 'BUILDER_MANAGER',
  'BDA_ENGINEER', 'PRESIDENT', 'SECRETARY', 'VOLUNTEER'
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="logo">🏠</span>
          <h1>Register</h1>
          <p>Join MyAangan Society</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row">
            <div class="field">
              <label>First Name *</label>
              <input formControlName="firstName" placeholder="John" />
            </div>
            <div class="field">
              <label>Last Name *</label>
              <input formControlName="lastName" placeholder="Doe" />
            </div>
          </div>

          <div class="field">
            <label>Email *</label>
            <input type="email" formControlName="email" placeholder="john@example.com" />
          </div>

          <div class="field">
            <label>Phone</label>
            <input formControlName="phone" placeholder="9876543210" />
          </div>

          <div class="field">
            <label>Password *</label>
            <input type="password" formControlName="password" placeholder="Min 6 characters" />
          </div>

          <!-- Role selector — card grid -->
          <div class="field">
            <label>Register As *</label>
            <div class="role-grid">
              <button type="button" *ngFor="let r of roles"
                class="role-card" [class.selected]="selectedRole === r.value"
                (click)="selectRole(r.value)">
                <span class="role-icon">{{ r.label.split(' ')[0] }}</span>
                <span class="role-name">{{ r.label.substring(r.label.indexOf(' ')+1) }}</span>
                <span class="role-desc">{{ r.description }}</span>
              </button>
            </div>
            <div class="err" *ngIf="form.get('role')?.touched && form.get('role')?.invalid">
              Please select a role
            </div>
          </div>

          <!-- Resident fields -->
          <ng-container *ngIf="selectedRole === 'RESIDENT'">
            <div class="row">
              <div class="field">
                <label>Flat / Unit No *</label>
                <input formControlName="flatNumber" placeholder="101" />
              </div>
              <div class="field">
                <label>Block / Tower</label>
                <input formControlName="block" placeholder="A" />
              </div>
            </div>
            <div class="field">
              <label>Society Name *</label>
              <input formControlName="societyName" placeholder="MyAangan Society" />
            </div>
          </ng-container>

          <!-- Visitor field -->
          <div class="field" *ngIf="selectedRole === 'VISITOR'">
            <label>Host Flat Number *</label>
            <input formControlName="hostFlatNumber" placeholder="A-101 (flat you are visiting)" />
          </div>

          <!-- Society name for staff roles -->
          <div class="field" *ngIf="isStaffRole">
            <label>Society Name</label>
            <input formControlName="societyName" placeholder="MyAangan Society" />
          </div>

          <!-- Approval notice -->
          <div class="info-banner pending" *ngIf="needsApproval">
            ⏳ Your account will be activated after Admin approval.
          </div>
          <div class="info-banner active" *ngIf="selectedRole && !needsApproval">
            ✅ Your account will be active immediately after registration.
          </div>

          <div class="error-banner"   *ngIf="errorMessage">{{ errorMessage }}</div>
          <div class="success-banner" *ngIf="successMessage">{{ successMessage }}</div>

          <button type="submit" [disabled]="loading || !selectedRole" class="btn-primary">
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
        </form>

        <p class="auth-link">Already have an account? <a routerLink="/auth/login">Login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; justify-content: center; align-items: flex-start;
      min-height: calc(100vh - 64px); padding: 20px; background: #f5f6fa;
    }
    .auth-card {
      background: white; border-radius: 16px; padding: 32px; width: 100%;
      max-width: 520px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .auth-header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 40px; }
    h1 { margin: 8px 0 4px; color: #0f3460; }
    .auth-header p { color: #666; margin: 0; font-size: 14px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; color: #333; font-size: 13px; }
    input, select {
      width: 100%; padding: 11px 12px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; box-sizing: border-box; background: #fafafa; color: #1a1a2e;
    }
    input:focus, select:focus { outline: none; border-color: #0f3460; background: white; }

    /* Role grid */
    .role-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    }
    .role-card {
      display: flex; flex-direction: column; align-items: flex-start;
      padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: white; cursor: pointer; text-align: left; transition: all 0.15s;
    }
    .role-card:hover { border-color: #0f3460; background: #f0f4ff; }
    .role-card.selected { border-color: #0f3460; background: #0f3460; }
    .role-icon { font-size: 20px; margin-bottom: 4px; }
    .role-name { font-size: 13px; font-weight: 700; color: #1a1a2e; }
    .role-card.selected .role-name { color: white; }
    .role-desc { font-size: 11px; color: #888; margin-top: 2px; line-height: 1.3; }
    .role-card.selected .role-desc { color: rgba(255,255,255,0.75); }

    .err { color: #dc2626; font-size: 12px; margin-top: 6px; }

    .info-banner {
      padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13px;
    }
    .info-banner.pending { background: #fef3c7; color: #92400e; }
    .info-banner.active  { background: #dcfce7; color: #166534; }
    .error-banner {
      background: #fee2e2; color: #991b1b; padding: 10px 12px;
      border-radius: 8px; margin-bottom: 12px; font-size: 13px;
    }
    .success-banner {
      background: #dcfce7; color: #166534; padding: 10px 12px;
      border-radius: 8px; margin-bottom: 12px; font-size: 13px;
    }
    .btn-primary {
      width: 100%; padding: 13px; background: #0f3460; color: white;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-link { text-align: center; margin-top: 16px; color: #666; font-size: 14px; }
    .auth-link a { color: #0f3460; font-weight: 600; text-decoration: none; }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedRole: Role | '' = '';
  roles = SELF_REGISTER_ROLES;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      firstName:     ['', Validators.required],
      lastName:      ['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      phone:         [''],
      password:      ['', [Validators.required, Validators.minLength(6)]],
      role:          ['', Validators.required],
      flatNumber:    [''],
      block:         [''],
      societyName:   [''],
      hostFlatNumber:['']
    });
  }

  get needsApproval(): boolean {
    return APPROVAL_ROLES.includes(this.selectedRole as Role);
  }

  get isStaffRole(): boolean {
    return ['SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER',
            'BDA_ENGINEER','PRESIDENT','SECRETARY','VOLUNTEER']
      .includes(this.selectedRole);
  }

  selectRole(role: Role): void {
    this.selectedRole = role;
    this.form.patchValue({ role });
    this.form.get('role')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedRole) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = this.needsApproval
          ? '✅ Registered! Your account is pending Admin approval.'
          : '✅ Registered successfully! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed.';
        this.loading = false;
      }
    });
  }
}


