import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NoticeService } from '../../core/services/notice.service';
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
        <!-- Notification bell — visible to anyone with NOTICE_VIEW -->
        <a class="bell-btn" routerLink="/notices" title="Notices" *ngIf="canViewNotices">
          <span class="bell-icon">🔔</span>
          <span class="bell-badge" *ngIf="unreadCount > 0">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </a>
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

    /* Bell */
    .bell-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      text-decoration: none;
      background: rgba(255,255,255,0.1);
      transition: background 0.2s;
      cursor: pointer;
    }
    .bell-btn:hover { background: rgba(255,255,255,0.25); }
    .bell-icon { font-size: 18px; line-height: 1; }
    .bell-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid #1a237e;
      animation: pop 0.3s ease;
    }
    @keyframes pop {
      0%   { transform: scale(0); }
      70%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

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
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  unreadCount = 0;
  canViewNotices = false;

  private pollInterval: any;

  constructor(
    public authService: AuthService,
    private noticeSvc: NoticeService
  ) {
    authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.canViewNotices = user ? this.authService.can('NOTICE_VIEW') : false;
      if (this.canViewNotices) this.noticeSvc.refreshUnreadCount();
    });
    // Always reflect the shared count — no local copy needed
    this.noticeSvc.unread$.subscribe(n => this.unreadCount = n);
  }

  ngOnInit() {
    // Refresh from server every 60 seconds while the app is open
    this.pollInterval = setInterval(() => {
      if (this.canViewNotices) this.noticeSvc.refreshUnreadCount();
    }, 60_000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }
}