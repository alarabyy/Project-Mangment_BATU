// src/app/components/User/my-profile/my-profile.component.ts
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, ChangePasswordRequest, UserProfile } from '../../../Services/auth.service';
import { environment } from '../../../environments/environment';
import { UserService } from '../../../Services/user.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showEditProfileForm: boolean = false;
  showChangePasswordForm: boolean = false;

  editProfileForm!: FormGroup;
  changePasswordForm!: FormGroup;

  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>; // Reference to hidden file input

  selectedAvatarFile: File | null = null;
  previewImageUrl: string | null = null; // New property for local preview URL
  readonly environment = environment; // Make environment accessible in template

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms();
  }

  // IMPORTANT: Clean up created object URLs when the component is destroyed
  ngOnDestroy(): void {
    this.clearPreviewImage();
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
    this.selectedAvatarFile = null; // Reset file selection on profile load
    this.clearPreviewImage(); // Clear any existing preview when loading new profile data

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
          gender: this.getGenderString(profile.gender) // Map number to string for dropdown
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
    this.showEditProfileForm = false; // Hide other form
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
    this.selectedAvatarFile = null; // Clear selected file when toggling form
    this.clearPreviewImage(); // Clear preview when toggling form

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

  triggerFileInput(): void {
    if (this.avatarFileInput && this.avatarFileInput.nativeElement) {
      this.avatarFileInput.nativeElement.value = '';
    }
    this.avatarFileInput.nativeElement.click();
    console.log('File input triggered.'); // Debugging
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedAvatarFile = file;
      this.clearPreviewImage();
      this.previewImageUrl = URL.createObjectURL(file);
      console.log('File selected:', this.selectedAvatarFile.name, 'Preview URL:', this.previewImageUrl); // Debugging
    } else {
      this.selectedAvatarFile = null;
      this.clearPreviewImage();
      console.log('No file selected.'); // Debugging
    }
  }

  private clearPreviewImage(): void {
    if (this.previewImageUrl) {
      URL.revokeObjectURL(this.previewImageUrl);
      this.previewImageUrl = null;
    }
  }

  onUpdateProfile(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.editProfileForm.invalid) {
      this.errorMessage = 'Please fill in all required profile fields correctly.';
      this.markFormGroupTouched(this.editProfileForm);
      return;
    }

    if (!this.userProfile?.id) {
      this.errorMessage = 'User ID is missing for profile update.';
      return;
    }

    const userId = parseInt(this.userProfile.id, 10);
    if (isNaN(userId)) {
      this.errorMessage = 'Invalid User ID for profile update.';
      return;
    }

    const updatedData = this.editProfileForm.value;
    const formData = new FormData();

    // Append ID
    formData.append('id', userId.toString());

    // FIXED: Explicitly cast values to string to satisfy FormData.append() overloads
    // Check if values are not null/undefined and then append.
    // Use String() conversion to be safe, as backend expects strings for `string?` fields.

    // First Name
    // It's required by form validator, so it should be a string.
    formData.append('firstName', String(updatedData.firstName || '')); // Convert to string

    // Middle Name (optional in backend, can be an empty string if cleared)
    formData.append('middleName', String(updatedData.middleName || '')); // Convert to string

    // Last Name
    formData.append('lastName', String(updatedData.lastName || '')); // Convert to string

    // Email
    // It's required by form validator, so it should be a string.
    formData.append('email', String(updatedData.email || '')); // Convert to string

    // Gender
    const genderNum = this.getGenderNumber(updatedData.gender);
    if (genderNum !== undefined && genderNum !== null) {
      formData.append('gender', genderNum.toString());
    } else {
      // If "Select Gender" (empty string) is chosen, ensure it's sent as an empty string.
      // Backend's Enum.TryParse will handle this as null for `Gender?`.
      formData.append('gender', '');
    }

    // Avatar Image
    if (this.selectedAvatarFile) {
      formData.append('avatarImage', this.selectedAvatarFile, this.selectedAvatarFile.name);
      console.log('Appending avatarImage to FormData:', this.selectedAvatarFile.name);
    } else {
      console.log('No new avatarImage selected to append.');
      // If no new image is selected, the 'avatarImage' field will NOT be in FormData,
      // and backend's req.AvatarImage will be null, thus keeping the existing image.
    }

    // --- Debugging FormData contents (Optional, keep for testing) ---
    console.log("FormData contents before sending:");
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    // --- End Debugging ---

    this.userService.updateUser(formData).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        this.clearPreviewImage();
        this.selectedAvatarFile = null;
        this.loadUserProfile(); // RELOAD PROFILE DATA FROM BACKEND
        this.showEditProfileForm = false;
        console.log('Profile update successful, reloading user profile.');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Profile update failed:', err);
        // Display a user-friendly error message from backend
        this.errorMessage = err.error?.message || err.error?.errors?.general || err.error || 'Failed to update profile. Please try again.';
        console.log('Error message to user:', this.errorMessage);
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
