import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '@services/auth.service';
import { NoticeService } from '@services/notice.service';
import { User } from '@models/user.model';
import { filter } from 'rxjs/operators';

// Routes where the back button should NOT appear
const HOME_ROUTES = ['/dashboard', '/auth/login', '/auth/register',
                     '/auth/forgot-password', '/auth/reset-password'];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  unreadCount = 0;
  canViewNotices = false;
  showBack = false;

  private pollInterval: any;

  constructor(
    public authService: AuthService,
    private noticeSvc: NoticeService,
    private location: Location,
    private router: Router
  ) {
    authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.canViewNotices = user ? this.authService.can('NOTICE_VIEW') : false;
      if (this.canViewNotices) this.noticeSvc.refreshUnreadCount();
    });
    this.noticeSvc.unread$.subscribe(n => this.unreadCount = n);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects.split('?')[0];
      this.showBack = !HOME_ROUTES.some(r => url === r || url.startsWith(r + '/'));
    });
  }

  goBack() { this.location.back(); }

  ngOnInit() {
    this.pollInterval = setInterval(() => {
      if (this.canViewNotices) this.noticeSvc.refreshUnreadCount();
    }, 60_000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }
}