import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/navbar/navbar.component';
import { NotificationPushService } from '@services/notification-push.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      padding: 16px;
      max-width: 960px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private notifSvc: NotificationPushService) {}
  ngOnInit() { this.notifSvc.startPolling(); }
}
