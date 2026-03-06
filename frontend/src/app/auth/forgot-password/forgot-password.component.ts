import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="logo">🏠</span>
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <ng-container *ngIf="!submitted; else successTpl">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field">
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="you@example.com" />
              <span class="error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
                Valid email required
              </span>
            </div>

            <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

            <button type="submit" [disabled]="loading" class="btn-primary">
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
        </ng-container>

        <ng-template #successTpl>
          <div class="success-banner">
            ✅ If that email is registered, a reset link has been sent. Check your inbox (and spam folder).
          </div>
        </ng-template>

        <p class="auth-link">
          <a routerLink="/auth/login">← Back to Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; justify-content: center; align-items: center;
      min-height: calc(100vh - 64px); padding: 20px;
    }
    .auth-card {
      background: white; border-radius: 12px; padding: 40px;
      width: 100%; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .auth-header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 48px; }
    h1 { margin: 8px 0 4px; color: #1a237e; font-size: 24px; }
    p { color: #666; margin: 0; font-size: 14px; }
    .field { margin-bottom: 20px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; color: #333; font-size: 14px; }
    input {
      width: 100%; padding: 12px; border: 1.5px solid #ddd;
      border-radius: 8px; font-size: 15px; box-sizing: border-box; transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: #1a237e; }
    .error { color: #d32f2f; font-size: 12px; margin-top: 4px; display: block; }
    .error-banner {
      background: #ffebee; color: #d32f2f; padding: 12px;
      border-radius: 8px; margin-bottom: 16px; font-size: 14px;
    }
    .success-banner {
      background: #e8f5e9; color: #2e7d32; padding: 16px;
      border-radius: 8px; margin-bottom: 16px; font-size: 14px; line-height: 1.5;
    }
    .btn-primary {
      width: 100%; padding: 14px; background: #1a237e; color: white;
      border: none; border-radius: 8px; font-size: 16px; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #283593; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-link { text-align: center; margin-top: 20px; font-size: 14px; }
    .auth-link a { color: #1a237e; font-weight: 600; text-decoration: none; }
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => { this.submitted = true; this.loading = false; },
      error: () => { this.submitted = true; this.loading = false; } // show success either way
    });
  }
}
