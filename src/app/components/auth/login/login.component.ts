import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Import ActivatedRoute
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // --- Form Groups ---
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  // --- State Variables ---
  currentMode: 'login' | 'forgotPassword' | 'resetPassword' = 'login'; // Controls which form is shown
  showPassword = false; // For login and reset password
  isSubmitting = false; // General submission flag

  // --- Message Variables ---
  loginErrorMessage: string | null = null;
  forgotPasswordSuccessMessage: string | null = null;
  forgotPasswordErrorMessage: string | null = null;
  resetPasswordSuccessMessage: string | null = null;
  resetPasswordErrorMessage: string | null = null;

  resetToken: string | null = null; // Stores the token for reset password

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Inject ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if already logged in (redirect)
    if (this.authService.isLoggedIn()) {
      this.redirectToDashboard();
    }

    // Initialize all forms
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator }); // Add custom validator

    // Check for reset password token in URL on initialization
    this.route.queryParamMap.subscribe(params => {
      this.resetToken = params.get('token');
      if (this.resetToken) {
        this.currentMode = 'resetPassword';
        // Clear any previous error messages related to other modes
        this.loginErrorMessage = null;
        this.forgotPasswordSuccessMessage = null;
        this.forgotPasswordErrorMessage = null;
      } else if (this.currentMode === 'resetPassword' && !this.resetToken) {
        // If mode is resetPassword but no token, show error and default to login after a delay
        this.resetPasswordErrorMessage = 'Password reset token is missing or invalid. Please request a new link.';
        setTimeout(() => this.showLoginForm(), 5000); // Redirect to login after 5 seconds
      }
    });
  }

  // --- Form Control Getters ---
  get loginF() { return this.loginForm.controls; }
  get forgotF() { return this.forgotPasswordForm.controls; }
  get resetF() { return this.resetPasswordForm.controls; }
  get newPasswordControl() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPasswordControl() { return this.resetPasswordForm.get('confirmPassword'); }

  // --- Password Match Validator for Reset Password Form ---
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  // --- UI Toggle Functions ---
  togglePassword(): void { this.showPassword = !this.showPassword; }
  showForgotPasswordForm(): void {
    this.currentMode = 'forgotPassword';
    this.loginErrorMessage = null; // Clear login errors when switching
    this.forgotPasswordForm.reset(); // Clear form fields
  }
  showLoginForm(): void {
    this.currentMode = 'login';
    // Clear any messages from forgot/reset password when returning to login
    this.forgotPasswordSuccessMessage = null;
    this.forgotPasswordErrorMessage = null;
    this.resetPasswordSuccessMessage = null;
    this.resetPasswordErrorMessage = null;
    this.loginForm.reset(); // Clear form fields
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true }); // Clear URL params
  }

  // --- Submission Handlers ---
  submitLogin(): void {
    if (this.loginForm.invalid) { return; }

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
    if (this.forgotPasswordForm.invalid) { return; }

    this.isSubmitting = true;
    this.forgotPasswordSuccessMessage = null;
    this.forgotPasswordErrorMessage = null;

    const email = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.forgotPasswordSuccessMessage = 'If an account with that email exists, a password reset link has been sent to your inbox.';
        this.forgotPasswordForm.reset();
      },
      error: (err) => {
        this.forgotPasswordErrorMessage = err.error?.message || 'Failed to send reset link. Please try again.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
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
        // Automatically switch back to login mode after a short delay
        setTimeout(() => {
          this.showLoginForm();
        }, 3000);
      },
      error: (err) => {
        this.resetPasswordErrorMessage = err.error?.message || 'Failed to reset password. The token might be invalid or expired. Please try requesting a new link.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

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
