import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SignUpComponent } from './sign-up.component';
import { AuthService, RegisterRequest } from '../../../Services/auth.service';
import { PopupService } from '../../../Services/popup.service';
import { CommonModule } from '@angular/common';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPopupService: jasmine.SpyObj<PopupService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockPopupService = jasmine.createSpyObj('PopupService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        CommonModule,
        SignUpComponent
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: PopupService, useValue: mockPopupService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.register with correct student payload on valid form submission', () => {
    mockAuthService.register.and.returnValue(of({ success: true }));

    component.signupForm.setValue({
      firstName: 'Test',
      middleName: 'User',
      lastName: 'Student',
      gender: '0',
      role: '0',
      graduationDate: '2025-12-31',
      email: 'test.student@example.com',
      password: 'Password123'
    });

    const expectedPayload: RegisterRequest = {
      firstName: 'Test',
      middleName: 'User',
      lastName: 'Student',
      gender: 0,
      role: 0,
      graduationDate: '2025-12-31',
      email: 'test.student@example.com',
      password: 'Password123'
    };

    component.submitSignup();

    expect(mockAuthService.register).toHaveBeenCalledWith(expectedPayload);
    // As per the provided auth service, it handles the success popup itself.
    // The component just navigates.
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/Login']);
  });

  it('should call authService.register without graduationDate for a doctor', () => {
    mockAuthService.register.and.returnValue(of({ success: true }));

    component.signupForm.get('role')?.setValue('1');
    component.signupForm.patchValue({
      firstName: 'Test',
      lastName: 'Doctor',
      gender: '1',
      email: 'test.doctor@example.com',
      password: 'Password123',
    });

    const expectedPayload: RegisterRequest = {
      firstName: 'Test',
      middleName: '',
      lastName: 'Doctor',
      gender: 1,
      role: 1,
      email: 'test.doctor@example.com',
      password: 'Password123'
    };

    component.submitSignup();

    expect(mockAuthService.register).toHaveBeenCalledWith(expectedPayload);
  });

  it('should show an error popup if registration fails', () => {
    const errorResponse = new Error('Email already exists');
    mockAuthService.register.and.returnValue(throwError(() => errorResponse));

    component.signupForm.setValue({
      firstName: 'Test',
      lastName: 'Fail',
      middleName: '',
      gender: '0',
      role: '0',
      graduationDate: '2025-01-01',
      email: 'fail@example.com',
      password: 'Password123'
    });

    component.submitSignup();

    expect(mockAuthService.register).toHaveBeenCalled();
    expect(mockPopupService.showError).toHaveBeenCalledWith('Registration Failed', 'Email already exists');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
