// src/app/components/login/login.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

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
    private authService: AuthService,
    private router: Router
  ) {}

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
  togglePassword(): void { this.showPassword = !this.showPassword; }

  submitLogin(): void {
    if (this.loginForm.invalid) { return; }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValues = this.loginForm.value;
    // *** الإصلاح هنا: تحويل البيانات إلى PascalCase ***
    const payload = {
      Email: formValues.email,
      Password: formValues.password
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.redirectToDashboard();
      },
      error: (err) => {
        this.errorMessage = 'Invalid credentials. Please check your email and password.';
        this.isSubmitting = false;
      },
      complete: () => { this.isSubmitting = false; }
    });
  }

  private redirectToDashboard(): void {
    const role = this.authService.getRole();
    switch (role) {
      case 'admin': this.router.navigate(['/FacultyList']); break;
      case 'doctor':
      case 'student': this.router.navigate(['/projects']); break;
      default: this.router.navigate(['/Home']); break;
    }
  }
}
