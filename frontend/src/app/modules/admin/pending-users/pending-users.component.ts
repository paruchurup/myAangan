import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-pending-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>⏳ Pending Approvals</h2>
        <span class="count" *ngIf="users.length > 0">{{ users.length }} pending</span>
      </div>

      <div class="empty-state" *ngIf="!loading && users.length === 0">
        <span>✅</span>
        <p>No pending approvals! All users are reviewed.</p>
      </div>

      <div class="cards" *ngIf="!loading">
        <div class="user-card" *ngFor="let user of users">
          <div class="user-info">
            <div class="avatar">{{ user.firstName[0] }}{{ user.lastName[0] }}</div>
            <div>
              <h3>{{ user.firstName }} {{ user.lastName }}</h3>
              <p>{{ user.email }}</p>
              <p *ngIf="user.phone">📞 {{ user.phone }}</p>
              <span class="badge">{{ user.role }}</span>
              <div class="details" *ngIf="user.flatNumber">
                🏠 Flat: {{ user.block ? user.block + '-' : '' }}{{ user.flatNumber }}
                <span *ngIf="user.societyName">, {{ user.societyName }}</span>
              </div>
              <div class="details" *ngIf="user.hostFlatNumber">
                🔑 Visiting: {{ user.hostFlatNumber }}
              </div>
            </div>
          </div>
          <div class="actions">
            <button class="btn-approve" (click)="approve(user)">✓ Approve</button>
            <button class="btn-reject" (click)="reject(user)">✗ Reject</button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">Loading pending users...</div>
      <div class="message success" *ngIf="message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .page { max-width: 700px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    h2 { margin: 0; color: #1a237e; }
    .count {
      background: #ff8f00;
      color: white;
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
    }
    .empty-state {
      text-align: center;
      padding: 60px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .empty-state span { font-size: 48px; }
    .empty-state p { color: #666; margin-top: 16px; }
    .cards { display: flex; flex-direction: column; gap: 16px; }
    .user-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      border-left: 4px solid #ff8f00;
    }
    .user-info { display: flex; gap: 16px; align-items: flex-start; }
    .avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: #1a237e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      flex-shrink: 0;
    }
    h3 { margin: 0 0 4px; font-size: 16px; }
    p { margin: 0 0 4px; color: #666; font-size: 13px; }
    .badge {
      background: #e8eaf6;
      color: #3949ab;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    .details { font-size: 12px; color: #555; margin-top: 6px; }
    .actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn-approve, .btn-reject {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-approve { background: #e8f5e9; color: #2e7d32; }
    .btn-approve:hover { background: #c8e6c9; }
    .btn-reject { background: #ffebee; color: #d32f2f; }
    .btn-reject:hover { background: #ffcdd2; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .message.success { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 8px; margin-top: 16px; }
  `]
})
export class PendingUsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  message = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading = true;
    this.userService.getPendingUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  approve(user: User): void {
    this.userService.updateUserStatus(user.id, 'ACTIVE').subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.message = `${user.firstName} approved and activated!`;
        setTimeout(() => this.message = '', 3000);
      }
    });
  }

  reject(user: User): void {
    this.userService.updateUserStatus(user.id, 'INACTIVE').subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.message = `${user.firstName}'s request rejected.`;
        setTimeout(() => this.message = '', 3000);
      }
    });
  }
}
