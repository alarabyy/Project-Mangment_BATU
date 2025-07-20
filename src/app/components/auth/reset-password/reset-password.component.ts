// src/app/authentication/reset-password/reset-password.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css'] // reuse the same styles as login for consistency
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  resetToken: string | null = null; // Stores the token from the URL

  isSubmitting = false;
  showPassword = false;

  resetPasswordSuccessMessage: string | null = null;
  resetPasswordErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: [this.passwordMatchValidator]
    });

    // استخراج الـ token من الـ URL
    this.route.queryParamMap.subscribe(params => {
      const rawToken = params.get('token');
      console.log('Reset Token from URL (raw):', rawToken); // طباعة التوكن الخام مع المسافات المحولة

      if (rawToken) {
        // *** الحل هنا: استبدال المسافات بـ '+' ثم إزالة أي مسافات أخرى غير متوقعة ***
        // هذا يتعامل مع الحالة التي يحول فيها المتصفح '+' إلى مسافة في URL query parameters
        let processedToken = rawToken.replace(/ /g, '+');
        // تأكد من إزالة أي مسافات بيضاء أخرى (مثل newlines أو tabs) إن وجدت،
        // على الرغم من أنها أقل شيوعًا في توكنات URL.
        processedToken = processedToken.replace(/\s/g, ''); // يزيل أي نوع من المسافات البيضاء

        this.resetToken = processedToken;
        console.log('Reset Token from URL (processed):', this.resetToken); // طباعة التوكن بعد المعالجة
      } else {
        this.resetToken = null;
      }

      if (!this.resetToken) {
        this.resetPasswordErrorMessage = 'Password reset token is missing or invalid. Please request a new link.';
        console.warn('No valid reset token found in URL. Redirecting to login in 5 seconds...');
        setTimeout(() => this.router.navigate(['/Login']), 5000);
      }
    });
  }

  // --- Form Control Getters ---
  get resetF() { return this.resetPasswordForm.controls; }
  get newPasswordControl(): AbstractControl | null { return this.resetPasswordForm.get('newPassword'); }
  get confirmPasswordControl(): AbstractControl | null { return this.resetPasswordForm.get('confirmPassword'); }

  // --- Password Match Validator ---
  passwordMatchValidator: ValidatorFn = (form: AbstractControl): { [key: string]: boolean } | null => {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword.value === confirmPassword.value) {
      if (confirmPassword.errors && confirmPassword.errors['mismatch']) {
        const errors = { ...confirmPassword.errors };
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length === 0 ? null : errors);
      }
      return null;
    } else {
      if (!confirmPassword.errors || !confirmPassword.errors['mismatch']) {
        confirmPassword.setErrors({ ...confirmPassword.errors, mismatch: true });
      }
      return { mismatch: true };
    }
  };


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitResetPassword(): void {
    this.resetPasswordForm.updateValueAndValidity();
    this.resetPasswordForm.markAllAsTouched();

    if (this.resetPasswordForm.invalid) {
      console.log('Form is invalid:', this.resetPasswordForm.errors);
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        const controlErrors = this.resetPasswordForm.get(key)?.errors;
        if (controlErrors) {
          console.log(`Control '${key}' has errors:`, controlErrors);
        }
      });
      return;
    }

    if (!this.resetToken) {
        this.resetPasswordErrorMessage = 'Cannot reset password: Token is missing.';
        console.error('Submit attempt without reset token present.');
        return;
    }

    this.isSubmitting = true;
    this.resetPasswordSuccessMessage = null;
    this.resetPasswordErrorMessage = null;

    const payload = {
      token: this.resetToken, // هذا هو الـ Token النظيف بعد إزالة المسافات واستعادة الـ '+'
      newPassword: this.resetPasswordForm.value.newPassword
    };

    console.log('Sending reset password payload (token and newPassword are obfuscated for security):', { tokenPresent: !!payload.token, newPasswordLength: payload.newPassword?.length });

    this.authService.resetPassword(payload).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Reset Password API error caught in pipe:', err);
        console.error('Backend error response:', err.error);
        console.error('Backend error message:', err.error?.message);
        console.error('Backend error title:', err.error?.title);
        console.error('Backend error errors object:', err.error?.errors);

        // استخدام رسالة الخطأ من الـ Backend إذا كانت متاحة، وإلا رسالة احتياطية
        this.resetPasswordErrorMessage = err.error?.message || err.error?.title || 'Failed to reset password. The token might be invalid or expired. Please try requesting a new link.';

        if (err.status === 400) {
            if (typeof err.error === 'string' && err.error.includes('expired')) {
                this.resetPasswordErrorMessage = 'Password reset link has expired. Please request a new one.';
            } else if (typeof err.error === 'string' && err.error.includes('invalid')) {
                this.resetPasswordErrorMessage = 'Password reset link is invalid. Please request a new one.';
            } else if (err.error && typeof err.error === 'object') {
                if (err.error.errors) {
                    let errorMessages = [];
                    for (const key in err.error.errors) {
                        if (err.error.errors.hasOwnProperty(key)) {
                            errorMessages.push(`${key}: ${err.error.errors[key].join(', ')}`);
                        }
                    }
                    if (errorMessages.length > 0) {
                        this.resetPasswordErrorMessage = errorMessages.join('; ');
                    }
                }
            }
        }
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response !== null) {
          this.resetPasswordSuccessMessage = 'Your password has been successfully reset. You can now log in with your new password.';
          this.resetPasswordForm.reset();
          this.resetToken = null;
          console.log('Password reset successful. Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/Login']);
          }, 3000);
        }
      },
      error: (err) => {
        console.error('Reset Password API error in subscribe block (should be handled by pipe):', err);
        this.isSubmitting = false;
      },
      complete: () => {
        console.log('Reset Password request complete.');
        this.isSubmitting = false;
      }
    });
  }
}
