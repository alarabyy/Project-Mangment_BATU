// src/app/components/login/login.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserCredentials } from '../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.redirectToDashboard();
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() { return this.loginForm.controls; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    const credentials: UserCredentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // ======================= التشخيص الحاسم هنا =======================
        console.log('--- LOGIN API RESPONSE ---', response);
        // =================================================================

        console.log('Login successful!');
        this.redirectToDashboard();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private redirectToDashboard(): void {
    const role = this.authService.getRole()?.toLowerCase();
    switch (role) {
      case 'admin':
        this.router.navigate(['/FacultyList']);
        break;
      case 'doctor':
      case 'student':
        this.router.navigate(['/projects']);
        break;
      default:
        this.router.navigate(['/Home']);
        break;
    }
  }
}
