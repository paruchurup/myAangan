import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="logo">🏠</span>
          <h1>Reset Password</h1>
          <p>Enter your new password below</p>
        </div>

        <div class="error-banner" *ngIf="!token">
          ⚠️ Invalid reset link. Please request a new one.
          <br><a routerLink="/auth/forgot-password">Request new link</a>
        </div>

        <ng-container *ngIf="token && !done">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field">
              <label>New Password</label>
              <input type="password" formControlName="newPassword" placeholder="Min. 6 characters" />
              <span class="error" *ngIf="form.get('newPassword')?.invalid && form.get('newPassword')?.touched">
                Password must be at least 6 characters
              </span>
            </div>

            <div class="field">
              <label>Confirm Password</label>
              <input type="password" formControlName="confirmPassword" placeholder="Repeat password" />
              <span class="error" *ngIf="form.get('confirmPassword')?.touched && form.hasError('mismatch')">
                Passwords do not match
              </span>
            </div>

            <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

            <button type="submit" [disabled]="loading" class="btn-primary">
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </ng-container>

        <div class="success-banner" *ngIf="done">
          ✅ Password reset successfully! <a routerLink="/auth/login">Login now →</a>
        </div>

        <p class="auth-link" *ngIf="!done">
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
    .error-banner a { color: #d32f2f; font-weight: 600; }
    .success-banner {
      background: #e8f5e9; color: #2e7d32; padding: 16px;
      border-radius: 8px; font-size: 14px; line-height: 1.5;
    }
    .success-banner a { color: #1b5e20; font-weight: 600; }
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
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token = '';
  loading = false;
  done = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  passwordMatch(group: FormGroup) {
    const pw  = group.get('newPassword')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: () => { this.done = true; this.loading = false; },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Reset failed. The link may have expired.';
        this.loading = false;
      }
    });
  }
}
