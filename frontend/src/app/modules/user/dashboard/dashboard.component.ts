import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="welcome-card">
        <div class="welcome-icon">🏠</div>
        <div class="welcome-text">
          <h2>Welcome, {{ user?.firstName }}!</h2>
          <p class="role-badge" [class]="'role-' + user?.role?.toLowerCase()">{{ user?.role }}</p>
          <p class="status" [class.active]="user?.status === 'ACTIVE'" [class.pending]="user?.status === 'PENDING_APPROVAL'">
            Status: {{ user?.status }}
          </p>
        </div>
      </div>

      <!-- Pending notice -->
      <div class="notice" *ngIf="user?.status === 'PENDING_APPROVAL'">
        ⏳ Your account is pending admin approval. You'll get full access once approved.
      </div>

      <!-- Quick Links -->
      <div class="quick-links" *ngIf="user?.status === 'ACTIVE'">
        <h3>Quick Actions</h3>
        <div class="grid">
          <a routerLink="/services" class="action-card" *ngIf="!isVisitor">
            <span class="icon">🔧</span>
            <span>Service Directory</span>
          </a>
          <a routerLink="/profile" class="action-card">
            <span class="icon">👤</span>
            <span>My Profile</span>
          </a>
          <ng-container *ngIf="isAdmin">
            <a routerLink="/admin/users" class="action-card admin">
              <span class="icon">👥</span>
              <span>Manage Users</span>
            </a>
            <a routerLink="/admin/categories" class="action-card admin">
            <span class="icon">⚙️</span>
            <span>Categories</span>
          </a>
          <a routerLink="/admin/pending" class="action-card admin">
              <span class="icon">⏳</span>
              <span>Pending Approvals</span>
            </a>
          </ng-container>
        </div>
      </div>

      <!-- User Info Card -->
      <div class="info-card" *ngIf="user">
        <h3>Account Details</h3>
        <div class="info-row"><span>Email</span><strong>{{ user.email }}</strong></div>
        <div class="info-row"><span>Phone</span><strong>{{ user.phone || '—' }}</strong></div>
        <div class="info-row" *ngIf="user.flatNumber"><span>Flat</span><strong>{{ user.block ? user.block + '-' : '' }}{{ user.flatNumber }}</strong></div>
        <div class="info-row" *ngIf="user.societyName"><span>Society</span><strong>{{ user.societyName }}</strong></div>
        <div class="info-row" *ngIf="user.hostFlatNumber"><span>Visiting</span><strong>{{ user.hostFlatNumber }}</strong></div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 700px; margin: 0 auto; }
    .welcome-card {
      background: linear-gradient(135deg, #1a237e, #3949ab);
      border-radius: 16px;
      padding: 28px;
      color: white;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    .welcome-icon { font-size: 52px; }
    h2 { margin: 0 0 8px; font-size: 22px; }
    .role-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(255,255,255,0.2);
      margin: 0 0 6px;
    }
    .status { margin: 0; font-size: 13px; opacity: 0.85; }
    .status.active { color: #a5d6a7; }
    .status.pending { color: #ffcc80; }
    .notice {
      background: #fff8e1;
      border: 1px solid #ffd54f;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
      color: #e65100;
      font-size: 14px;
    }
    h3 { margin: 0 0 16px; color: #333; }
    .quick-links { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 24px 16px;
      background: white;
      border-radius: 12px;
      text-decoration: none;
      color: #333;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.2s;
      font-weight: 600;
      font-size: 14px;
    }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .action-card .icon { font-size: 32px; }
    .action-card.admin { border: 2px solid #e8eaf6; }
    .info-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row span { color: #666; }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  isAdmin = false;
  isVisitor = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isAdmin = user?.role === 'ADMIN';
      this.isVisitor = user?.role === 'VISITOR';
    });
  }
}
