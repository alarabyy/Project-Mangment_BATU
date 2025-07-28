// src/app/components/User/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import {
  map, debounceTime, distinctUntilChanged, startWith,
  catchError, switchMap
} from 'rxjs/operators';
import { User } from '../../../models/user';
import { AuthService } from '../../../Services/auth.service';
import { UserService } from '../../../Services/user.service';
import { HttpErrorResponse } from '@angular/common/http';

interface UserManagementState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  public state$!: Observable<UserManagementState>;
  public filteredUsers$!: Observable<User[]>;
  public searchTerm$   = new BehaviorSubject<string>('');
  public refreshUsers$ = new BehaviorSubject<void>(undefined);

  public editingUserId: number | null = null;
  public editedUser: Partial<User> | null = null;

  // NEW: Feedback messages properties
  public successMessage: string | null = null;
  public errorMessage: string | null = null;
  private feedbackTimeout: any; // To manage the auto-hide for messages

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usersSource$ = this.refreshUsers$.pipe(
      startWith(undefined),
      switchMap(() => this.userService.getUsers().pipe(
        map((users: User[]) => ({ isLoading: false, users, error: null })),
        startWith({ isLoading: true, users: [], error: null }),
        catchError((err: Error) => { // Catch 'Error' type now as service throws it
          console.error('Error fetching users:', err);
          const msg = (err instanceof HttpErrorResponse && err.status === 401)
            ? 'You are not authorized to view this data. Please log in.'
            : (err.message || 'Could not load user data.'); // Use err.message from thrown error
          this.showFeedback('error', msg); // Display error as feedback
          return of({ isLoading: false, users: [], error: msg }); // Return state with error
        })
      ))
    );

    this.state$ = usersSource$;

    this.filteredUsers$ = combineLatest([
      usersSource$.pipe(map((s: UserManagementState) => s.users)),
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]: [User[], string]) => this.filterUsers(users, term))
    );
  }

  // NEW: Function to display feedback messages
  showFeedback(type: 'success' | 'error', message: string): void {
    // Clear any existing timeout to avoid messages overlapping
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }

    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = null;
    } else {
      this.errorMessage = message;
      this.successMessage = null;
    }

    // Hide message after 4 seconds
    this.feedbackTimeout = setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 4000);
  }

  private filterUsers(users: User[], term: string): User[] {
    if (!users?.length) return [];
    if (!term) return users;

    term = term.toLowerCase();
    return users.filter(u =>
      (u.firstName?.toLowerCase().includes(term) ?? false) ||
      (u.lastname?.toLowerCase().includes(term) ?? false) ||
      (u.email?.toLowerCase().includes(term) ?? false) ||
      (u.id?.toString().includes(term) ?? false) ||
      (u.role != null && this.getRoleInfo(u.role).name.toLowerCase().includes(term))
    );
  }

  onSearch(e: Event): void {
    this.searchTerm$.next((e.target as HTMLInputElement).value);
  }

  getRoleInfo(roleValue: number | string | string[] | undefined): { name: string; icon: string } {
    let actualRole: string | number | undefined;

    if (Array.isArray(roleValue)) {
      actualRole = roleValue.length > 0 ? roleValue[0] : undefined;
    } else {
      actualRole = roleValue;
    }

    const numericRoleId = typeof actualRole === 'string' ? parseInt(actualRole, 10) : actualRole;

    switch (numericRoleId) {
      case 0: return { name: 'Student', icon: 'fa-user-graduate' };
      case 1: return { name: 'Doctor',  icon: 'fa-user-tie'      };
      case 2: return { name: 'Admin',   icon: 'fa-user-shield'   };
      default: return { name: 'User',   icon: 'fa-user'          };
    }
  }

  getGenderName(genderValue: number | undefined | null): string {
    switch (genderValue) {
      case 0: return 'Male';
      case 1: return 'Female';
      case 2: return 'Other';
      default: return 'N/A';
    }
  }

  trackById(_: number, item: User): number { return item.id; }

  isAdmin(): boolean { return this.authService.getUserRole() === 'admin'; }

  deleteUser(userId: number): void {
    // Confirmation before deletion
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.showFeedback('error', 'User deletion cancelled.'); // Optional feedback for cancellation
      return;
    }

    console.log('Attempting to delete user with ID:', userId);

    this.userService.deleteUser(userId).pipe(
      catchError((err: Error) => { // Catch 'Error' type now
        console.error('Error deleting user:', err);
        const errorMessage = err.message || 'Failed to delete user.'; // Use err.message
        this.showFeedback('error', errorMessage); // Show red error feedback
        return of(null); // Return observable of null to allow subscription to complete
      })
    ).subscribe((ok: any) => {
      if (ok !== null) {
        console.log('User deleted successfully. Refreshing user list.');
        this.showFeedback('success', 'User deleted successfully!'); // Show green success feedback
        this.refreshUsers$.next(); // Refresh data without full page reload
      } else {
        console.log('User deletion failed, not refreshing list.');
      }
    });
  }

  startEdit(user: User): void {
    this.editingUserId = user.id;
    // Create a shallow copy to prevent direct modification of the original user object
    // Only include fields that are visible/editable in the UI and supported by the API
    this.editedUser    = {
      id: user.id,
      firstName: user.firstName,
      lastname: user.lastname, // Ensure this matches backend 'lastName' if different in API
      email: user.email,
      gender: user.gender
    };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editedUser    = null;
    this.showFeedback('error', 'Edit cancelled.'); // Optional: provide feedback for cancellation
  }

  saveEdit(): void {
    if (!this.editedUser?.id) {
      this.showFeedback('error', 'No user selected for editing.');
      return;
    }

    const formData = new FormData();
    formData.append('id', this.editedUser.id.toString());

    formData.append('firstName', this.editedUser.firstName ?? '');
    // Assuming backend API expects 'lastName' for user's last name
    formData.append('lastName', this.editedUser.lastname ?? '');
    formData.append('email', this.editedUser.email ?? '');

    // Gender handling: editedUser.gender will be a number (0, 1, or 2) directly from the select binding
    if (this.editedUser.gender !== undefined && this.editedUser.gender !== null) {
        formData.append('gender', this.editedUser.gender.toString());
    } else {
        // Fallback if gender is unexpectedly missing or null from the model
        console.warn("Gender field is missing from editedUser, defaulting to 'Other' (2) for backend compatibility.");
        formData.append('gender', '2'); // Default to 'Other'
    }

    // Role and avatarImage are not part of the current update form fields, so they are not included.

    console.log("FormData contents from user-management before sending:");
    formData.forEach((value, key) => {
        if (value instanceof File) {
            console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
            console.log(`${key}: ${value}`);
        }
    });

    this.userService.updateUser(formData).pipe(
      catchError((err: Error) => { // Catch 'Error' type now
        console.error('Error updating user:', err);
        this.showFeedback('error', err.message || 'Failed to update user.'); // Show red error feedback
        return of(null); // Return observable of null to allow subscription to complete
      })
    ).subscribe((ok: any) => {
      if (ok !== null) {
        console.log('User updated successfully. Refreshing user list.');
        this.showFeedback('success', 'User updated successfully!'); // Show green success feedback
        this.cancelEdit(); // Close edit mode
        this.refreshUsers$.next(); // Refresh data without full page reload
      } else {
        console.log('User update failed.');
      }
    });
  }

  // NEW: Navigation method for User Analytics
  goToUserAnalytics(): void {
    this.router.navigate(['/user-analytics']);
  }
}
