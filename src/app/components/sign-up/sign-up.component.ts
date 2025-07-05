// File: src/app/components/sign-up/sign-up.component.ts

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
      middleName: [''],
      lastName: ['', [Validators.required]],
      gender: ['0', Validators.required],
      role: ['0', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*[a-zA-Z])(?=.*\\d).{8,}$')]]
    });
  }

  get f() { return this.signupForm.controls; }
  togglePassword(): void { this.showPassword = !this.showPassword; }

  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // ================= 🔽 تم التعديل هنا 🔽 =================
    // إنشاء الـ payload بأسماء حقول camelCase لتطابق مواصفات الـ API
    const payload = {
      firstName: this.signupForm.value.firstName,
      middleName: this.signupForm.value.middleName,
      lastName: this.signupForm.value.lastName,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      gender: +this.signupForm.value.gender,
      role: +this.signupForm.value.role
    };
    // ========================================================

    this.authService.register(payload).subscribe({
      next: () => {
        alert('Account created successfully! Please log in.');
        this.router.navigate(['/Login']);
      },
      error: (err) => {
        // يمكننا الآن عرض رسالة الخطأ القادمة من الخادم مباشرة
        this.errorMessage = err.error?.message || err.error?.title || 'Registration failed. Please check your details.';
        this.isSubmitting = false;
      },
      complete: () => { this.isSubmitting = false; }
    });
  }
}
