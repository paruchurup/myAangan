import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" *ngIf="authService.isLoggedIn()">
      <div class="navbar-brand">
        <span class="brand-icon">🏠</span>
        <span class="brand-name">MyAangan</span>
      </div>
      <div class="navbar-menu">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/profile" routerLinkActive="active">Profile</a>
        <ng-container *ngIf="authService.isAdmin()">
          <a routerLink="/admin/users" routerLinkActive="active">Users</a>
          <a routerLink="/admin/pending" routerLinkActive="active">Pending</a>
        </ng-container>
      </div>
      <div class="navbar-user">
        <span class="user-info">{{ currentUser?.firstName }} ({{ currentUser?.role }})</span>
        <button class="logout-btn" (click)="authService.logout()">Logout</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #1a237e;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      flex-wrap: wrap;
      gap: 8px;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: bold;
    }
    .navbar-menu {
      display: flex;
      gap: 16px;
    }
    .navbar-menu a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .navbar-menu a.active, .navbar-menu a:hover {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    .navbar-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-info { font-size: 13px; color: rgba(255,255,255,0.8); }
    .logout-btn {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(255,255,255,0.3); }
  `]
})
export class NavbarComponent {
  currentUser: User | null = null;

  constructor(public authService: AuthService) {
    authService.currentUser$.subscribe(user => this.currentUser = user);
  }
}
