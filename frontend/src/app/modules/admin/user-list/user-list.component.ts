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
  templateUrl: "./user-list.component.html",
  styleUrls: ["./user-list.component.scss"]
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
