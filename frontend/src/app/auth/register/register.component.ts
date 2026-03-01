import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/user.model';

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

          <div class="field">
            <label>Register As *</label>
            <select formControlName="role" (change)="onRoleChange()">
              <option value="">Select Role</option>
              <option value="RESIDENT">Resident</option>
              <option value="SECURITY_GUARD">Security Guard</option>
              <option value="VISITOR">Visitor</option>
            </select>
          </div>

          <!-- Resident fields -->
          <ng-container *ngIf="selectedRole === 'RESIDENT'">
            <div class="row">
              <div class="field">
                <label>Flat/Unit No *</label>
                <input formControlName="flatNumber" placeholder="A-101" />
              </div>
              <div class="field">
                <label>Block/Tower</label>
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

          <div class="info-banner" *ngIf="selectedRole === 'RESIDENT' || selectedRole === 'VISITOR'">
            ℹ️ Your account will be activated after Admin approval.
          </div>

          <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>
          <div class="success-banner" *ngIf="successMessage">{{ successMessage }}</div>

          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
        </form>

        <p class="auth-link">Already have an account? <a routerLink="/auth/login">Login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(100vh - 64px);
      padding: 20px;
    }
    .auth-card {
      background: white;
      border-radius: 12px;
      padding: 36px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .auth-header { text-align: center; margin-bottom: 28px; }
    .logo { font-size: 40px; }
    h1 { margin: 8px 0 4px; color: #1a237e; }
    p { color: #666; margin: 0; font-size: 14px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 5px; color: #333; font-size: 13px; }
    input, select {
      width: 100%;
      padding: 11px;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }
    input:focus, select:focus { outline: none; border-color: #1a237e; }
    .info-banner {
      background: #e8eaf6;
      color: #3949ab;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
    }
    .error-banner {
      background: #ffebee;
      color: #d32f2f;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .success-banner {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .btn-primary {
      width: 100%;
      padding: 13px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; }
    .auth-link { text-align: center; margin-top: 16px; color: #666; font-size: 14px; }
    .auth-link a { color: #1a237e; font-weight: 600; text-decoration: none; }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedRole = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
      flatNumber: [''],
      block: [''],
      societyName: [''],
      hostFlatNumber: ['']
    });
  }

  onRoleChange(): void {
    this.selectedRole = this.form.get('role')?.value;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.form.value).subscribe({
      next: (res) => {
        this.successMessage = res.message + ' You can now login once approved.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed.';
        this.loading = false;
      }
    });
  }
}
