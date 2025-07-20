// src/app/authentication/login/login.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // --- Form Groups ---
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  // resetPasswordForm!: FormGroup; // REMOVED: Moved to ResetPasswordComponent

  // --- State Variables ---
  currentMode: 'login' | 'forgotPassword' = 'login'; // UPDATED: Only login and forgotPassword here
  showPassword = false; // For login only now
  isSubmitting = false;

  // --- Message Variables ---
  loginErrorMessage: string | null = null;
  forgotPasswordSuccessMessage: string | null = null;
  forgotPasswordErrorMessage: string | null = null;
  // resetPasswordSuccessMessage: string | null = null; // REMOVED: Moved to ResetPasswordComponent
  // resetPasswordErrorMessage: string | null = null; // REMOVED: Moved to ResetPasswordComponent

  // resetToken: string | null = null; // REMOVED: Moved to ResetPasswordComponent

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Still needed for queryParamMap in case of direct /Login access
  ) {}

  ngOnInit(): void {
    // 1. Initialize forms
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // 2. Check if already logged in (redirect) - this should be prioritized IF NO specific token URL is requested
    // This logic is now simpler as the /reset-password route goes to a different component entirely.
    if (this.authService.isLoggedIn()) {
      this.redirectToDashboard();
    }
    // No need to check queryParamMap for 'token' here anymore, as ResetPasswordComponent handles it.
  }

  // --- Form Control Getters ---
  get loginF() { return this.loginForm.controls; }
  get forgotF() { return this.forgotPasswordForm.controls; }
  // get resetF() { return this.resetPasswordForm.controls; } // REMOVED
  // get newPasswordControl() { return this.resetPasswordForm.get('newPassword'); } // REMOVED
  // get confirmPasswordControl() { return this.resetPasswordForm.get('confirmPassword'); } // REMOVED

  // --- Password Match Validator for Reset Password Form ---
  // passwordMatchValidator(form: FormGroup) { ... } // REMOVED: Moved to ResetPasswordComponent

  // --- UI Toggle Functions ---
  togglePassword(): void { this.showPassword = !this.showPassword; }
  showForgotPasswordForm(): void {
    this.currentMode = 'forgotPassword';
    this.loginErrorMessage = null; // Clear login errors when switching
    this.forgotPasswordForm.reset(); // Clear form fields
    this.forgotPasswordSuccessMessage = null; // Clear previous success messages
    this.forgotPasswordErrorMessage = null; // Clear previous error messages
  }
  showLoginForm(): void {
    this.currentMode = 'login';
    // Clear any messages from forgot password when returning to login
    this.forgotPasswordSuccessMessage = null;
    this.forgotPasswordErrorMessage = null;
    this.loginForm.reset(); // Clear form fields
    // No need to clear URL params here, as the reset password component would have handled its own URL
  }

  // --- Submission Handlers ---
  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.loginErrorMessage = null;

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.redirectToDashboard();
      },
      error: (err) => {
        this.loginErrorMessage = err.error?.message || 'Invalid credentials. Please check your email and password.';
        this.isSubmitting = false;
      },
      complete: () => { this.isSubmitting = false; }
    });
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.forgotPasswordSuccessMessage = null;
    this.forgotPasswordErrorMessage = null;

    const email = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.forgotPasswordSuccessMessage = 'If an account with that email exists, a password reset link has been sent to your inbox. Please check your email.';
        this.forgotPasswordForm.reset();
      },
      error: (err) => {
        console.error('Forgot Password API error:', err);
        this.forgotPasswordErrorMessage = err.error?.message || 'Failed to send reset link. Please try again.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // submitResetPassword(): void { ... } // REMOVED: Moved to ResetPasswordComponent

  // --- Redirection after successful login ---
  private redirectToDashboard(): void {
    const role = this.authService.getUserRole();
    switch (role) {
      case 'admin':
        this.router.navigate(['/Home']);
        break;
      case 'doctor':
      case 'professor':
        this.router.navigate(['/Home']);
        break;
      case 'student':
        this.router.navigate(['/Home']);
        break;
      default:
        this.router.navigate(['/Home']);
        break;
    }
  }
}
