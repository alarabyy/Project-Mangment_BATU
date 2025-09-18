import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, RegisterRequest } from '../../../Services/auth.service';
import { PopupService } from '../../../Services/popup.service';

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
  private roleChangesSubscription?: Subscription;

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
      gender: ['0', Validators.required],
      role: ['0', Validators.required],
      graduationDate: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern('^(?=.*[a-zA-Z])(?=.*\\d).{8,}$')
      ]]
    });

    this.handleRoleChange();
    this.updateGraduationDateValidation(this.signupForm.get('role')?.value);
  }

  get f() {
    return this.signupForm.controls;
  }

  private handleRoleChange(): void {
    const roleControl = this.signupForm.get('role');
    if (roleControl) {
      this.roleChangesSubscription = roleControl.valueChanges.subscribe(role => {
        this.updateGraduationDateValidation(role);
      });
    }
  }

  private updateGraduationDateValidation(role: string): void {
    const graduationDateControl = this.signupForm.get('graduationDate');
    if (!graduationDateControl) return;

    if (role === '0') { // 0 = Student
      graduationDateControl.setValidators([Validators.required]);
      graduationDateControl.enable();
    } else {
      graduationDateControl.clearValidators();
      graduationDateControl.disable();
      graduationDateControl.reset();
    }
    graduationDateControl.updateValueAndValidity();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.popupService.showError('Validation Error', 'Please correct the errors in the form.');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.signupForm.getRawValue();

    const payload: RegisterRequest = {
      ...formValue,
      gender: Number(formValue.gender),
      role: Number(formValue.role)
    };

    if (payload.role !== 0) {
      delete payload.graduationDate;
    }

    this.authService.register(payload).subscribe({
      next: () => {
        // The service now handles the success notification
        // We can add additional logic here, like a delayed redirect
        this.router.navigate(['/Login']);
      },
      error: (err) => {
        const errorMessage = err.message || 'Registration failed. The email might already be in use.';
        this.popupService.showError('Registration Failed', errorMessage);
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.roleChangesSubscription) {
      this.roleChangesSubscription.unsubscribe();
    }
  }
}
