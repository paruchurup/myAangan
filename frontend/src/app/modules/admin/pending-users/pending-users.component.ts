import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '@services/user.service';
import { User } from '@models/user.model';

@Component({
  selector: 'app-pending-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./pending-users.component.html",
  styleUrls: ["./pending-users.component.scss"]
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
