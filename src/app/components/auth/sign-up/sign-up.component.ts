import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { PopupService } from '../../../Services/popup.service';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private popupService: PopupService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['0', Validators.required], // 0: Male, 1: Female
      role: ['1', Validators.required], // 1: Student, 2: Admin, 3: Doctor (matching user-management roles)
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

    const payload = {
      ...this.signupForm.value,
      gender: +this.signupForm.value.gender,
      role: +this.signupForm.value.role
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.popupService.showSuccess(
          'Account Created!',
          'Your account has been created successfully. You can now log in.',
          () => this.router.navigate(['/home']) // هذا الـ callback سيتم تنفيذه الآن بشكل صحيح ثم ستُغلق النافذة
        );
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.message || err.error?.title || 'Registration failed. Please check your details and try again.';
        this.popupService.showError('Registration Failed', errorMessage);
      }
    });
  }
}
