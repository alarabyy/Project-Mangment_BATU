import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
    imports: [ReactiveFormsModule , CommonModule],

})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    // Initialize the reactive form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^[0-9]{3,8}[a-zA-Z]{3,8}$/)]]
    });
  }

  // Getters for easier template access
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  // Method to toggle password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Method to handle form submission
  submitLogin(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to display errors
      this.loginForm.markAllAsTouched();
      return;
    }
    // API call logic would go here
    console.log('Login form submitted:', this.loginForm.value);
  }
}
