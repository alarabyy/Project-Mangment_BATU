// src/app/components/sign-up/sign-up.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

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

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      middleName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      gender: ['0', Validators.required],
      role: ['0', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$')]]
    });
  }

  get f() { return this.signupForm.controls; }
  togglePassword(): void { this.showPassword = !this.showPassword; }

  submitSignup(): void {
    if (this.signupForm.invalid) { return; }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValues = this.signupForm.value;
    // *** الإصلاح هنا: تحويل البيانات إلى PascalCase ***
    const payload = {
      FirstName: formValues.firstName,
      MiddleName: formValues.middleName,
      LastName: formValues.lastName,
      Email: formValues.email,
      Password: formValues.password,
      Gender: +formValues.gender,
      Role: +formValues.role
    };

    this.authService.register(payload).subscribe({
      next: () => {
        alert('Account created successfully! Please log in.');
        this.router.navigate(['/Login']);
      },
      error: (err) => {
        this.errorMessage = 'Registration failed. The email might already be in use.';
        this.isSubmitting = false;
      },
      complete: () => { this.isSubmitting = false; }
    });
  }
}
