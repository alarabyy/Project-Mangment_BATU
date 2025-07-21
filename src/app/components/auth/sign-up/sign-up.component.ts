// KEEP ONLY ONE SET OF IMPORTS
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { PopupService } from '../../../Services/popup.service';

// KEEP ONLY ONE @Component DECORATOR AND CLASS DEFINITION
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
      gender: ['0', Validators.required], // 0 = Male, 1 = Female
      role: ['0', Validators.required],   // ✅ default role = Student (0)
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        // Password must contain at least one letter (upper or lower case) and one digit, and be at least 8 characters long.
        Validators.pattern('^(?=.*[a-zA-Z])(?=.*\\d).{8,}$')
      ]]
    });
  }

  // Helper getter for easy access to form controls in the template
  get f() {
    return this.signupForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitSignup(): void {
    // Mark all fields as touched to display validation errors immediately on submit attempt
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.popupService.showError('Validation Error', 'Please correct the errors in the form.');
      return;
    }

    const payload = {
      ...this.signupForm.value,
      // Ensure gender and role are sent as numbers, not strings
      gender: Number(this.signupForm.value.gender),
      role: Number(this.signupForm.value.role)
    };

    console.log("📤 Payload to Register:", payload); // Debug

    this.isSubmitting = true;

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.popupService.showSuccess(
          'Account Created!',
          'Your account has been created successfully. You can now log in.',
          () => this.router.navigate(['/home']) // Navigate to home or login page
        );
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.message || err.error?.title || 'Registration failed due to an unexpected error.';
        this.popupService.showError('Registration Failed', errorMessage);
      }
    });
  }
}
