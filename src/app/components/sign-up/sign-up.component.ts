import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'], // Remove or comment out if not needed
  imports: [CommonModule , ReactiveFormsModule ] // Add any necessary imports here
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^[0-9]{3,8}[a-zA-Z]{3,8}$/)]]
    });
  }

  // Getters for easier template access
  get name() { return this.signupForm.get('name'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }

  // Method to toggle password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Method to handle form submission
  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    console.log('Signup form submitted:', this.signupForm.value);
  }
}
