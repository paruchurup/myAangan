import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@services/user.service';
import { User } from '@models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/dashboard">← Back</a>
        </div>
        <h1>👤 My Profile</h1>
        <p>Your account details</p>
      </div>

      <div class="card" *ngIf="user">
        <div class="avatar">{{ user.firstName[0] }}{{ user.lastName[0] }}</div>
        <div class="user-meta">
          <h3>{{ user.firstName }} {{ user.lastName }}</h3>
          <p>{{ user.email }}</p>
          <span class="badge">{{ user.role }}</span>
          <span class="status-badge" [class.active]="user.status === 'ACTIVE'">{{ user.status }}</span>
        </div>
      </div>

      <!-- Edit Profile Form -->
      <div class="section">
        <h3>Edit Profile</h3>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <div class="row">
            <div class="field">
              <label>First Name</label>
              <input formControlName="firstName" />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input formControlName="lastName" />
            </div>
          </div>
          <div class="field">
            <label>Phone</label>
            <input formControlName="phone" />
          </div>
          <div class="success" *ngIf="profileSuccess">{{ profileSuccess }}</div>
          <div class="error" *ngIf="profileError">{{ profileError }}</div>
          <button type="submit" class="btn-primary" [disabled]="savingProfile">
            {{ savingProfile ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      <!-- Change Password Form -->
      <div class="section">
        <h3>Change Password</h3>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div class="field">
            <label>Current Password</label>
            <input type="password" formControlName="currentPassword" />
          </div>
          <div class="field">
            <label>New Password</label>
            <input type="password" formControlName="newPassword" />
          </div>
          <div class="success" *ngIf="passwordSuccess">{{ passwordSuccess }}</div>
          <div class="error" *ngIf="passwordError">{{ passwordError }}</div>
          <button type="submit" class="btn-secondary" [disabled]="changingPassword">
            {{ changingPassword ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin: 16px 16px 0;
    }
    .avatar {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: #1a237e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .user-meta h3 { margin: 0 0 4px; }
    .user-meta p { margin: 0 0 8px; color: #666; font-size: 14px; }
    .badge, .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
    }
    .badge { background: #e8eaf6; color: #3949ab; }
    .status-badge { background: #ffecb3; color: #e65100; }
    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin: 16px;
    }
    h3 { margin: 0 0 20px; color: #333; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 5px; color: #555; font-size: 13px; }
    input {
      width: 100%;
      padding: 11px;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }
    input:focus { outline: none; border-color: #1a237e; }
    .success { color: #2e7d32; background: #e8f5e9; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; }
    .error { color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; }
    .btn-primary, .btn-secondary {
      padding: 11px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary { background: #1a237e; color: white; }
    .btn-secondary { background: #f5f5f5; color: #333; border: 1.5px solid #ddd; }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  changingPassword = false;
  profileSuccess = '';
  profileError = '';
  passwordSuccess = '';
  passwordError = '';

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['']
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe(res => {
      this.user = res.data;
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phone: this.user.phone
      });
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.profileSuccess = '';
    this.profileError = '';
    this.userService.updateMyProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.user = res.data;
        this.profileSuccess = 'Profile updated successfully!';
        this.savingProfile = false;
      },
      error: (err) => {
        this.profileError = err.error?.message || 'Update failed';
        this.savingProfile = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.changingPassword = true;
    this.passwordSuccess = '';
    this.passwordError = '';
    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully!';
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Password change failed';
        this.changingPassword = false;
      }
    });
  }
}
