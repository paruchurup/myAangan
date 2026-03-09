import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '@services/user.service';
import { User, UserStatus } from '@models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/dashboard">← Back</a>
        </div>
        <h1>👥 User Management</h1>
        <p>Manage society residents and staff</p>
      </div>

      <div class="filters-row">
        <div class="filters">
          <select [(ngModel)]="filterRole" (change)="applyFilter()">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="RESIDENT">Resident</option>
            <option value="SECURITY_GUARD">Security Guard</option>
            <option value="VISITOR">Visitor</option>
          </select>
          <select [(ngModel)]="filterStatus" (change)="applyFilter()">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_APPROVAL">Pending</option>
          </select>
        </div>
      </div>

      <div class="loading" *ngIf="loading">Loading users...</div>

      <div class="table-wrapper" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Flat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td><strong>{{ user.firstName }} {{ user.lastName }}</strong></td>
              <td>{{ user.email }}</td>
              <td><span class="badge role">{{ user.role }}</span></td>
              <td>
                <span class="badge" [class.active]="user.status === 'ACTIVE'"
                  [class.pending]="user.status === 'PENDING_APPROVAL'"
                  [class.inactive]="user.status === 'INACTIVE'">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.block ? user.block + '-' : '' }}{{ user.flatNumber || '—' }}</td>
              <td class="actions">
                <button *ngIf="user.status !== 'ACTIVE'" (click)="updateStatus(user, 'ACTIVE')" class="btn-success">Activate</button>
                <button *ngIf="user.status === 'ACTIVE'" (click)="updateStatus(user, 'INACTIVE')" class="btn-warn">Deactivate</button>
                <button (click)="deleteUser(user)" class="btn-danger">Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredUsers.length === 0">
              <td colspan="6" class="empty">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="success" *ngIf="message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }
    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
    .filters-row { padding: 16px 16px 0; display: flex; justify-content: flex-end; }
    .filters { display: flex; gap: 10px; }
    select { padding: 8px 12px; border: 1.5px solid #ddd; border-radius: 8px; font-size: 13px; background: white; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .table-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow-x: auto; margin: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a237e; color: white; padding: 14px 16px; text-align: left; font-size: 13px; }
    td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8f9ff; }
    .badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      display: inline-block;
    }
    .badge.role { background: #e8eaf6; color: #3949ab; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.pending { background: #fff8e1; color: #e65100; }
    .badge.inactive { background: #fafafa; color: #757575; }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-success, .btn-warn, .btn-danger {
      padding: 5px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-success { background: #e8f5e9; color: #2e7d32; }
    .btn-warn { background: #fff8e1; color: #e65100; }
    .btn-danger { background: #ffebee; color: #d32f2f; }
    .empty { text-align: center; color: #999; padding: 30px; }
    .success { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 8px; margin-top: 16px; }
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  filterRole = '';
  filterStatus = '';
  loading = true;
  message = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filteredUsers = this.users.filter(u => {
      const matchRole = !this.filterRole || u.role === this.filterRole;
      const matchStatus = !this.filterStatus || u.status === this.filterStatus;
      return matchRole && matchStatus;
    });
  }

  updateStatus(user: User, status: UserStatus): void {
    this.userService.updateUserStatus(user.id, status).subscribe({
      next: (res) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index >= 0) this.users[index] = res.data;
        this.applyFilter();
        this.message = `User ${res.data.firstName} status updated to ${status}`;
        setTimeout(() => this.message = '', 3000);
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}?`)) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.applyFilter();
        this.message = 'User deleted successfully';
        setTimeout(() => this.message = '', 3000);
      }
    });
  }
}
