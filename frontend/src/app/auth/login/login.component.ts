import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="logo">🏠</span>
          <h1>MyAangan</h1>
          <p>Society Management App</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="admin@myaangan.com" />
            <span class="error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Valid email required
            </span>
          </div>

          <div class="field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="••••••••" />
            <span class="error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              Password required
            </span>
          </div>

          <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <p class="auth-link">
          Don't have an account? <a routerLink="/auth/register">Register here</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 20px;
    }
    .auth-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo { font-size: 48px; }
    h1 { margin: 8px 0 4px; color: #1a237e; font-size: 28px; }
    p { color: #666; margin: 0; }
    .field { margin-bottom: 20px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; color: #333; font-size: 14px; }
    input {
      width: 100%;
      padding: 12px;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: #1a237e; }
    .error { color: #d32f2f; font-size: 12px; margin-top: 4px; display: block; }
    .error-banner {
      background: #ffebee;
      color: #d32f2f;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #283593; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-link { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .auth-link a { color: #1a237e; font-weight: 600; text-decoration: none; }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Check credentials.';
        this.loading = false;
      }
    });
  }
}
