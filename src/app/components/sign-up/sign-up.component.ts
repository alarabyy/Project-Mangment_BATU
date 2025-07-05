// src/app/components/sign-up/sign-up.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRegistration } from '../../Services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: ['', Validators.required],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['0', Validators.required],
      role: ['0', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$')]]
    });
  }

  get f() { return this.signupForm.controls; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValues = this.signupForm.value;
    const payload: UserRegistration = {
      firstName: formValues.firstName,
      middleName: formValues.middleName,
      lastName: formValues.lastName,
      email: formValues.email,
      password: formValues.password,
      gender: +formValues.gender,
      role: +formValues.role
    };

    this.authService.register(payload).subscribe({
      next: () => {
        alert('Account created successfully! Please log in.');
        this.router.navigate(['/Login']);
      },
      error: (err) => {
        console.error('Registration failed:', err);
        if (err.error && typeof err.error === 'object') {
          const validationErrors = err.error.errors ? Object.values(err.error.errors).flat().join(' ') : null;
          this.errorMessage = validationErrors || err.error.message || err.error.title || 'An unknown error occurred.';
        } else {
          this.errorMessage = 'An unknown server error occurred.';
        }
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
