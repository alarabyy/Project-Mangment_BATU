// src/app/components/auth/sign-up/sign-up.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, RegisterRequest } from '../../../Services/auth.service';
import { PopupService } from '../../../Services/popup.service';
import { RoleService } from '../../../Services/role.service';
import { Role } from '../../../models/role';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit, OnDestroy {
  signupForm!: FormGroup;
  showPassword = false;
  isSubmitting = false;

  roles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private popupService: PopupService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadRoles();

    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['0', Validators.required],
      roleId: [null, Validators.required],
      graduationDate: [''], // No longer disabled, handled by API logic
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*[a-zA-Z])(?=.*\\d).{8,}$')]]
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => { this.roles = data; },
      error: () => { this.popupService.showError('Error', 'Could not load available roles.'); }
    });
  }

  get f() { return this.signupForm.controls; }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.popupService.showError('Validation Error', 'Please fill all required fields.');
      return;
    }
    this.isSubmitting = true;
    const formValue = this.signupForm.getRawValue();

    const payload: RegisterRequest = {
      firstName: formValue.firstName,
      middleName: formValue.middleName,
      lastName: formValue.lastName,
      gender: Number(formValue.gender),
      roleId: Number(formValue.roleId),
      email: formValue.email,
      password: formValue.password,
      graduationDate: formValue.graduationDate || undefined
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.popupService.showSuccess('User Created', 'The new user account has been created successfully.', () => {
          this.router.navigate(['/users']);
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.popupService.showError('Creation Failed', err.message || 'Registration failed.');
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
