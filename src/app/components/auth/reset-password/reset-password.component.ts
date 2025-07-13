// src/app/components/auth/reset-password/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupService } from '../../../Services/popup.service';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  token: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private popupService: PopupService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.popupService.showError(
        'Invalid Token',
        'No reset token found in the URL. Please use the link from your email.',
        () => this.router.navigate(['/Login'])
      );
      return;
    }

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.pattern('^(?=.*[a-zA-Z])(?=.*\\d).{8,}$')]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  get f() { return this.resetPasswordForm.controls; }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const newPassword = this.resetPasswordForm.value.newPassword;

    this.authService.resetPassword({ token: this.token!, newPassword }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.popupService.showSuccess(
          'Password Reset Successfully',
          'Your password has been changed. You can now log in with your new password.',
          () => this.router.navigate(['/Login'])
        );
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.message || 'Failed to reset password. Please check your token and try again.';
        this.popupService.showError('Reset Failed', errorMessage);
      }
    });
  }
}
