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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
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


