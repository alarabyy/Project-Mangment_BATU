// src/app/authentication/reset-password/reset-password.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css'] // reuse the same styles as login for consistency
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  resetToken: string | null = null; // Stores the token from the URL

  isSubmitting = false;
  showPassword = false;

  resetPasswordSuccessMessage: string | null = null;
  resetPasswordErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    // Extract the token from the URL
    this.route.queryParamMap.subscribe(params => {
      this.resetToken = params.get('token');
        console.log(this.resetToken)

      if (!this.resetToken) {
        // If no token, show an error and redirect to login
        this.resetPasswordErrorMessage = 'Password reset token is missing or invalid. Please request a new link.';
        setTimeout(() => this.router.navigate(['/Login']), 5000);
      }
      // You could optionally validate the token with your backend here if needed
      // before allowing the user to type in new passwords.
    });
  }

  // --- Form Control Getters ---
  get resetF() { return this.resetPasswordForm.controls; }
  get newPasswordControl() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPasswordControl() { return this.resetPasswordForm.get('confirmPassword'); }

  // --- Password Match Validator ---
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitResetPassword(): void {
    this.resetPasswordForm.markAllAsTouched(); // Show validation errors immediately

    if (this.resetPasswordForm.invalid) { return; }

    if (!this.resetToken) {
        this.resetPasswordErrorMessage = 'Cannot reset password: Token is missing.';
        return;
    }

    this.isSubmitting = true;
    this.resetPasswordSuccessMessage = null;
    this.resetPasswordErrorMessage = null;

    const payload = {
      token: this.resetToken,
      newPassword: this.resetPasswordForm.value.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.resetPasswordSuccessMessage = 'Your password has been successfully reset. You can now log in with your new password.';
        this.resetPasswordForm.reset();
        this.resetToken = null; // Clear token after successful reset
        // Automatically redirect to login mode after a short delay
        setTimeout(() => {
          this.router.navigate(['/Login']);
        }, 3000);
      },
      error: (err) => {
        console.error('Reset Password API error:', err);
        this.resetPasswordErrorMessage = err.error?.message || 'Failed to reset password. The token might be invalid or expired. Please try requesting a new link.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
