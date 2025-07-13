// src/app/pages/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, catchError, switchMap } from 'rxjs/operators';
import { User } from '../../../models/user';
import { UserService } from '../../../Services/user.service';
import { AuthService } from '../../../Services/auth.service';

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
  private searchTerm$ = new BehaviorSubject<string>('');
  private refreshUsers$ = new BehaviorSubject<void>(undefined);

  public editingUserId: number | null = null;
  public editedUser: Partial<User> | null = null;

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit(): void {
    const usersSource$ = this.refreshUsers$.pipe(
      startWith(undefined),
      switchMap(() => this.userService.getUsers().pipe(
        map(users => ({ isLoading: false, users, error: null })),
        startWith({ isLoading: true, users: [], error: null }),
        catchError(err => {
          console.error("Error fetching users:", err);
          let errorMessage = 'Could not load user data. Please check the API connection and try again.';
          if (err.status === 401) {
              errorMessage = 'You are not authorized to view this data. Please log in.';
          } else if (err.error && err.error.message) {
              errorMessage = err.error.message;
          }
          return of({ isLoading: false, users: [], error: errorMessage });
        })
      ))
    );

    this.state$ = usersSource$;

    this.filteredUsers$ = combineLatest([
      usersSource$.pipe(map(state => state.users)),
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]) => this.filterUsers(users, term))
    );
  }

  private filterUsers(users: User[], term: string): User[] {
    if (!users || users.length === 0) return [];
    if (!term) return users;
    const lowerCaseTerm = term.toLowerCase();
    return users.filter(user =>
      user.firstName.toLowerCase().includes(lowerCaseTerm) ||
      (user.lastname && user.lastname.toLowerCase().includes(lowerCaseTerm)) ||
      user.email.toLowerCase().includes(lowerCaseTerm) ||
      user.id.toString().includes(lowerCaseTerm)
    );
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm$.next(term);
  }

  getRoleInfo(roleId: number): { name: string, icon: string } {
    switch (roleId) {
      case 2: return { name: 'Admin', icon: 'fa-user-shield' };
      case 1: return { name: 'Student', icon: 'fa-user-graduate' };
      case 3: return { name: 'Doctor', icon: 'fa-user-tie' };
      default: return { name: 'User', icon: 'fa-user' };
    }
  }

  trackById(index: number, item: User): number {
    return item.id;
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'admin';
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(userId).pipe(
        catchError(err => {
          console.error('Error deleting user:', err);
          let errorMessage = 'Failed to delete user.';
          if (err.status === 401) {
            errorMessage += ' You are not authorized.';
          } else if (err.error && err.error.message) {
            errorMessage += ` Error: ${err.error.message}`;
          }
          alert(errorMessage);
          return of(null);
        })
      ).subscribe(response => {
        if (response !== null) {
          alert('User deleted successfully!');
          this.refreshUsers$.next();
        }
      });
    }
  }

  startEdit(user: User): void {
    this.editingUserId = user.id;
    this.editedUser = { ...user };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editedUser = null;
  }

  saveEdit(): void {
    if (!this.editedUser || !this.editedUser.id) {
      console.error('No user selected for editing or user ID is missing.');
      alert('Error: No user selected for editing.');
      return;
    }

    this.userService.updateUser(this.editedUser).pipe(
      catchError(err => {
        console.error('Error updating user:', err);
        let errorMessage = 'Failed to update user.';
        if (err.status === 401) {
          errorMessage += ' You are not authorized.';
        } else if (err.error && err.error.message) {
          errorMessage += ` Error: ${err.error.message}`;
        }
          alert(errorMessage);
          return of(null);
        })
      ).subscribe(response => {
        if (response !== null) {
          alert('User updated successfully!');
          this.editingUserId = null;
          this.editedUser = null;
          this.refreshUsers$.next();
        }
      });
    }
  }
