// src/app/authentication/login/login.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service'; // Corrected path
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;

  currentMode: 'login' | 'forgotPassword' = 'login';
  showPassword = false;
  isSubmitting = false;

  loginErrorMessage: string | null = null;
  forgotPasswordSuccessMessage: string | null = null;
  forgotPasswordErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    if (this.authService.isLoggedIn()) {
      this.redirectToDashboard();
    }
  }

  get loginF() { return this.loginForm.controls; }
  get forgotF() { return this.forgotPasswordForm.controls; }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  showForgotPasswordForm(): void {
    this.currentMode = 'forgotPassword';
    this.loginErrorMessage = null;
    this.forgotPasswordForm.reset();
    this.forgotPasswordSuccessMessage = null;
    this.forgotPasswordErrorMessage = null;
  }
  showLoginForm(): void {
    this.currentMode = 'login';
    this.forgotPasswordSuccessMessage = null;
    this.forgotPasswordErrorMessage = null;
    this.loginForm.reset();
  }

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
      error: (err: HttpErrorResponse) => {
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
      error: (err: HttpErrorResponse) => {
        console.error('Forgot Password API error:', err);
        this.forgotPasswordErrorMessage = err.error?.message || 'Failed to send reset link. Please try again.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private redirectToDashboard(): void {
    const role = this.authService.getUserRole();
    switch (role) {
      case 'admin':
      case 'doctor':
      case 'student':
        this.router.navigate(['/Home']);
        break;
      default:
        this.router.navigate(['/Home']);
        break;
    }
  }
}
