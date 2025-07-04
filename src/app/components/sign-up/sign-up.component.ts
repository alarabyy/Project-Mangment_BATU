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
      gender: ['0', Validators.required], // Default to '0' (Male)
      role: ['0', Validators.required],   // Default to '0' (Student)
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
    const userData: UserRegistration = this.signupForm.value;

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registration successful!', response);
        this.router.navigate(['/login']); // Redirect to login on success
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'An unknown error occurred during registration.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
