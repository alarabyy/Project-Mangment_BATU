// src/app/my-profile/my-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService, UserProfile, ChangePasswordRequest } from '../../Services/auth.service'; // Import ChangePasswordRequest
import { UserService } from '../../Services/user.service'; // Import UserService
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Import form modules
import { User } from '../../models/user'; // Import User model for updateUser

@Component({
  selector: 'app-my-profile',
  standalone: true,
  // Add FormsModule and ReactiveFormsModule to imports
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null; // New for success messages

  // Flags to control form visibility
  showEditProfileForm: boolean = false;
  showChangePasswordForm: boolean = false;

  // Forms
  editProfileForm!: FormGroup;
  changePasswordForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private userService: UserService, // Inject UserService
    private fb: FormBuilder // Inject FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms(); // Initialize forms when component starts
  }

  // Initialize forms
  initForms(): void {
    this.editProfileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: [''], // lastName can be null according to UserProfile, so not required for now
      email: ['', [Validators.required, Validators.email]],
      // gender is not in UserProfile for this context, so omit for now based on current form needs
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]], // Min length for password
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator }); // Custom validator for password confirmation
  }

  // Custom validator for password confirmation
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    // Set an error on confirmNewPassword control if they don't match
    if (newPassword !== confirmNewPassword) {
      form.get('confirmNewPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmNewPassword')?.setErrors(null);
    }
    return null; // Return null as the form group validator doesn't block submission
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null; // Clear messages on load

    this.authService.getUserProfileFromApi().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (profile) => {
        console.log('Profile data received from API:', profile);
        this.userProfile = profile;
        // Populate edit profile form when profile data is loaded
        this.editProfileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email
        });
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
        this.errorMessage = err.message || 'Could not retrieve user profile. Please try again later.';
      }
    });
  }

  // --- Change Password Methods ---
  toggleChangePasswordForm(): void {
    this.showChangePasswordForm = !this.showChangePasswordForm;
    this.showEditProfileForm = false; // Hide other form if open
    this.changePasswordForm.reset(); // Reset form fields
    this.errorMessage = null; // Clear previous errors
    this.successMessage = null; // Clear previous success
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
        this.showChangePasswordForm = false; // Optionally hide the form after success
      },
      error: (err) => {
        console.error('Password change failed:', err);
        // Display specific error message from API if available
        this.errorMessage = err.error?.message || 'Failed to change password. Please check your current password.';
      }
    });
  }

  // --- Update Profile Methods ---
  toggleEditProfileForm(): void {
    this.showEditProfileForm = !this.showEditProfileForm;
    this.showChangePasswordForm = false; // Hide other form if open
    if (this.userProfile) {
      // Reset form to current profile data if toggling it on
      this.editProfileForm.patchValue({
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        email: this.userProfile.email
      });
    }
    this.errorMessage = null; // Clear previous errors
    this.successMessage = null; // Clear previous success
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
      this.errorMessage = 'User ID not found for profile update.';
      return;
    }

    const updatedData = this.editProfileForm.value;
    const userToUpdate: Partial<User> = {
      id: parseInt(this.userProfile.id), // Ensure ID is number if API expects it
      firstName: updatedData.firstName,
      lastname: updatedData.lastName, // Use 'lastname' as per User model in src/app/models/user.ts
      email: updatedData.email,
      // middleName and gender are not part of the form, UserService.updateUser handles sending null
    };

    this.userService.updateUser(userToUpdate).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        // Reload user profile to reflect changes, or manually update userProfile object
        this.loadUserProfile(); // Re-fetch to ensure consistency with backend
        this.showEditProfileForm = false; // Hide form after success
      },
      error: (err) => {
        console.error('Profile update failed:', err);
        this.errorMessage = err.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  // Helper to mark all form controls as touched to show validation messages
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) { // Check if it's a nested FormGroup
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  /**
   * دالة لتحسين عرض الدور (Role) للمستخدم.
   * تعالج هذه الدالة الحالة التي يكون فيها الدور نصًا أو مصفوفة من النصوص أو رقمًا.
   * @param role الدور، والذي يمكن أن يكون نصًا أو مصفوفة من النصوص أو رقمًا.
   * @returns نصًا منسقًا وسهل القراءة (مثل "Admin", "Student", "Doctor")
   */
  getRoleAsString(role: string | string[] | number | undefined): string {
    if (role === undefined || role === null) {
      return 'User'; // قيمة افتراضية للأدوار غير المعرفة أو الفارغة
    }

    let roleName: string;

    if (typeof role === 'number') {
      // نفترض أن الأدوار الرقمية تتطابق مع نصوص معينة بناءً على الـ enum في الواجهة الخلفية:
      // 0: Student, 1: Doctor, 2: Admin
      switch (role) {
        case 0: roleName = 'Student'; break;
        case 1: roleName = 'Doctor'; break;
        case 2: roleName = 'Admin'; break;
        default: roleName = 'Unknown Role'; break; // في حال وجود رقم دور غير متوقع
      }
    } else if (Array.isArray(role) && role.length > 0) {
      roleName = role[0]; // إذا كان الدور مصفوفة (مثلاً من الـ JWT Claims)
    } else if (typeof role === 'string') {
      roleName = role; // إذا كان الدور نصًا مباشرًا
    } else {
      // حالة غير متوقعة للأنواع الأخرى، على الرغم من أن TypeScript يجب أن يمنعها
      return 'User';
    }

    // نتأكد من أن أول حرف كبير، ونتعامل مع النصوص الفارغة المحتملة بعد التحويل
    return roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : 'User';
  }

  logout(): void {
    this.authService.logout();
  }
}
