// src/app/components/my-profile/my-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../models/user';
import { AuthService, ChangePasswordRequest, UserProfile } from '../../Services/auth.service';
import { UserService } from '../../Services/user.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showEditProfileForm: boolean = false;
  showChangePasswordForm: boolean = false;

  editProfileForm!: FormGroup;
  changePasswordForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms();
  }

  initForms(): void {
    this.editProfileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: [''],
      middleName: [''],
      email: ['', [Validators.required, Validators.email]],
      gender: ['']
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    if (newPassword !== confirmNewPassword) {
      form.get('confirmNewPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmNewPassword')?.setErrors(null);
    }
    return null;
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.getUserProfileFromApi().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (profile: UserProfile) => {
        console.log('Profile data received from API:', profile);
        this.userProfile = profile;
        this.editProfileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastname,
          middleName: profile.middleName || '',
          email: profile.email,
          gender: this.getGenderString(profile.gender)
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load user profile', err);
        this.errorMessage = err.message || 'Could not retrieve user profile. Please try again later.';
      }
    });
  }

  getFullName(): string {
    if (!this.userProfile) {
      return '';
    }
    const parts = [this.userProfile.firstName, this.userProfile.lastname];
    return parts.filter(Boolean).join(' ');
  }

  getGenderString(genderNum: number | undefined | null): string {
    if (genderNum === undefined || genderNum === null) return '';
    switch (genderNum) {
      case 0: return 'Male';
      case 1: return 'Female';
      case 2: return 'Other';
      default: return '';
    }
  }

  getGenderNumber(genderString: string | undefined | null): number | undefined {
    if (genderString === undefined || genderString === null || genderString === '') return undefined;
    switch (genderString) {
      case 'Male': return 0;
      case 'Female': return 1;
      case 'Other': return 2;
      default: return undefined;
    }
  }

  toggleChangePasswordForm(): void {
    this.showChangePasswordForm = !this.showChangePasswordForm;
    this.showEditProfileForm = false;
    this.changePasswordForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
  }

  onChangePassword(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.changePasswordForm.invalid) {
      this.errorMessage = 'Please fix the errors in the password form.';
      this.markFormGroupTouched(this.changePasswordForm);
      return;
    }

    const { currentPassword, newPassword } = this.changePasswordForm.value;
    const request: ChangePasswordRequest = { currentPassword, newPassword };

    this.authService.changePassword(request).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully!';
        this.changePasswordForm.reset();
        this.showChangePasswordForm = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Password change failed:', err);
        this.errorMessage = err.error?.message || 'Failed to change password. Please check your current password.';
      }
    });
  }

  toggleEditProfileForm(): void {
    this.showEditProfileForm = !this.showEditProfileForm;
    this.showChangePasswordForm = false;
    if (this.userProfile) {
      this.editProfileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastname,
        middleName: this.userProfile.middleName || '',
        email: this.userProfile.email,
        gender: this.getGenderString(this.userProfile.gender)
      });
    }
    this.errorMessage = null;
    this.successMessage = null;
  }

  onUpdateProfile(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.editProfileForm.invalid) {
      this.errorMessage = 'Please fill in all required profile fields correctly.';
      this.markFormGroupTouched(this.editProfileForm);
      return;
    }

    if (!this.userProfile?.id || isNaN(parseInt(this.userProfile.id))) {
      this.errorMessage = 'User ID not found or invalid for profile update.';
      return;
    }

    const updatedData = this.editProfileForm.value;
    const userToUpdate: Partial<User> = {
      id: parseInt(this.userProfile.id),
      firstName: updatedData.firstName,
      middleName: updatedData.middleName || null,
      lastname: updatedData.lastName,
      email: updatedData.email,
      gender: this.getGenderNumber(updatedData.gender)
    };

    this.userService.updateUser(userToUpdate).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        this.loadUserProfile();
        this.showEditProfileForm = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Profile update failed:', err);
        this.errorMessage = err.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  getRoleAsString(role: string | string[] | number | undefined): string {
    if (role === undefined || role === null) {
      return 'User';
    }

    let roleName: string;

    if (typeof role === 'number') {
      switch (role) {
        case 0: roleName = 'Student'; break;
        case 1: roleName = 'Doctor'; break;
        case 2: roleName = 'Admin'; break;
        default: roleName = 'Unknown Role'; break;
      }
    } else if (Array.isArray(role) && role.length > 0) {
      roleName = role[0];
    } else if (typeof role === 'string') {
      roleName = role;
    } else {
      return 'User';
    }

    return roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase() : 'User';
  }

  logout(): void {
    this.authService.logout();
  }
}
