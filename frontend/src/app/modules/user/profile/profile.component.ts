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
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
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
