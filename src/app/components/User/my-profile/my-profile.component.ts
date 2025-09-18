// src/app/components/User/my-profile/my-profile.component.ts
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, of, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService, ChangePasswordRequest, UserProfile } from '../../../Services/auth.service';
import { environment } from '../../../environments/environment';
import { UserService } from '../../../Services/user.service';

interface ProfileState {
  profile?: UserProfile;
  isLoading: boolean;
  error?: string;
  success?: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyProfileComponent implements OnInit, OnDestroy {
  private state = new BehaviorSubject<ProfileState>({ isLoading: true });
  state$: Observable<ProfileState> = this.state.asObservable();

  showEditProfileForm = false;
  showChangePasswordForm = false;

  editProfileForm!: FormGroup;
  changePasswordForm!: FormGroup;

  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>;

  selectedAvatarFile: File | null = null;
  previewImageUrl: string | null = null;
  readonly environment = environment;
  private successToastSub!: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms();
  }

  ngOnDestroy(): void {
    if (this.previewImageUrl) URL.revokeObjectURL(this.previewImageUrl);
    if (this.successToastSub) this.successToastSub.unsubscribe();
  }

  private initForms(): void {
    this.editProfileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastname: [''],
      middleName: [''],
      email: ['', [Validators.required, Validators.email]],
      gender: [null, Validators.required],
      graduationDate: ['']
    });
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  loadUserProfile(): void {
    this.state.next({ isLoading: true });
    this.authService.getUserProfileFromApi().pipe(
      tap(profile => {
        this.state.next({ profile, isLoading: false });
        this.patchEditForm(profile);
      }),
      catchError(error => {
        this.state.next({ isLoading: false, error: error.message || 'Failed to load profile.' });
        return of(null);
      })
    ).subscribe();
  }

  private patchEditForm(profile: UserProfile): void {
    this.editProfileForm.patchValue({
      firstName: profile.firstName,
      lastname: profile.lastname,
      middleName: profile.middleName || '',
      email: profile.email,
      gender: profile.gender,
      graduationDate: profile.graduationDate ? profile.graduationDate.split('T')[0] : ''
    });
    const graduationDateControl = this.editProfileForm.get('graduationDate');
    if (profile.role === 0) graduationDateControl?.setValidators([Validators.required]);
    else graduationDateControl?.clearValidators();
    graduationDateControl?.updateValueAndValidity();
  }

  getRoleAsString(role: number): string {
    return role === 0 ? 'Student' : role === 1 ? 'Doctor' : 'Admin';
  }

  getGenderAsString(gender: number): string {
    return gender === 0 ? 'Male' : gender === 1 ? 'Female' : 'Not specified';
  }

  formatGraduationDate(dateStr: string): string {
    if (!dateStr || dateStr.startsWith('1900')) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getAvatarUrl(profile: UserProfile): string {
    if (this.previewImageUrl) return this.previewImageUrl;
    if (profile.imageUrl) {
      const baseUrl = this.environment.imageBaseUrl.endsWith('/') ? this.environment.imageBaseUrl : `${this.environment.imageBaseUrl}/`;
      return `${baseUrl}${profile.imageUrl}`;
    }
    return '';
  }

  toggleEditProfileForm(profile: UserProfile): void {
    this.showEditProfileForm = !this.showEditProfileForm;
    this.showChangePasswordForm = false;
    if (this.showEditProfileForm) this.patchEditForm(profile);
    this.resetMessages();
  }

  toggleChangePasswordForm(): void {
    this.showChangePasswordForm = !this.showChangePasswordForm;
    this.showEditProfileForm = false;
    this.changePasswordForm.reset();
    this.resetMessages();
  }

  triggerFileInput(): void { this.avatarFileInput.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedAvatarFile = file;
      if (this.previewImageUrl) URL.revokeObjectURL(this.previewImageUrl);
      this.previewImageUrl = URL.createObjectURL(file);
    }
  }

  onUpdateProfile(): void {
    if (this.editProfileForm.invalid) {
      this.showToast('error', 'Please correct the errors in the form.');
      return;
    }
    const currentState = this.state.value;
    if (!currentState.profile) return;

    const formData = new FormData();
    formData.append('id', currentState.profile.id);
    formData.append('firstName', this.editProfileForm.value.firstName || '');
    formData.append('lastName', this.editProfileForm.value.lastname || '');
    formData.append('middleName', this.editProfileForm.value.middleName || '');
    formData.append('email', this.editProfileForm.value.email || '');
    if (this.editProfileForm.value.gender !== null) {
      formData.append('gender', this.editProfileForm.value.gender.toString());
    }
    if (currentState.profile.role === 0) {
      formData.append('graduationDate', this.editProfileForm.value.graduationDate || '1900-01-01');
    } else {
      formData.append('graduationDate', '1900-01-01');
    }
    if (this.selectedAvatarFile) formData.append('avatarImage', this.selectedAvatarFile);

    this.userService.updateUser(formData).subscribe({
      next: () => {
        this.showEditProfileForm = false; this.selectedAvatarFile = null; this.previewImageUrl = null;
        this.loadUserProfile();
        this.showToast('success', 'Profile updated successfully!');
      },
      error: (err) => this.showToast('error', err.message || 'Update failed.')
    });
  }

  onChangePassword(): void {
    if (this.changePasswordForm.invalid) { this.showToast('error', 'Please fix the password form errors.'); return; }
    const request: ChangePasswordRequest = this.changePasswordForm.value;
    this.authService.changePassword(request).subscribe({
      next: () => {
        this.showChangePasswordForm = false;
        this.showToast('success', 'Password changed successfully!');
      },
      error: (err) => this.showToast('error', err.message || 'Password change failed.')
    });
  }

  passwordMatchValidator(control: AbstractControl) {
    return control.get('newPassword')?.value === control.get('confirmNewPassword')?.value ? null : { mismatch: true };
  }

  private showToast(type: 'success' | 'error', message: string): void {
    const currentState = this.state.value;
    if (type === 'success') this.state.next({ ...currentState, success: message, error: undefined });
    else this.state.next({ ...currentState, error: message, success: undefined });
    this.cdr.markForCheck();
    setTimeout(() => {
      this.resetMessages();
      this.cdr.markForCheck();
    }, 3000);
  }

  resetMessages(): void {
    this.state.next({ ...this.state.value, error: undefined, success: undefined });
  }

  logout(): void { this.authService.logout(); }
}
