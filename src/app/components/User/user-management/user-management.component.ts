// src/app/components/User/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import {
  map, debounceTime, distinctUntilChanged, startWith,
  catchError, switchMap
} from 'rxjs/operators';
import { User } from '../../../models/user';
import { AuthService } from '../../../Services/auth.service';
import { UserService } from '../../../Services/user.service';
import { HttpErrorResponse } from '@angular/common/http'; // Added for error typing

interface UserManagementState { // هذا التعريف موجود بالفعل في الملف
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
  private searchTerm$   = new BehaviorSubject<string>('');
  private refreshUsers$ = new BehaviorSubject<void>(undefined);

  public editingUserId: number | null = null;
  public editedUser: Partial<User> | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    const usersSource$ = this.refreshUsers$.pipe(
      startWith(undefined),
      switchMap(() => this.userService.getUsers().pipe(
        map((users: User[]) => ({ isLoading: false, users, error: null })),
        startWith({ isLoading: true, users: [], error: null }),
        catchError((err: HttpErrorResponse) => {
          console.error('Error fetching users:', err);
          const msg = err.status === 401
            ? 'You are not authorized to view this data. Please log in.'
            : (err.error?.message || 'Could not load user data.');
          return of({ isLoading: false, users: [], error: msg });
        })
      ))
    );

    this.state$ = usersSource$;

    this.filteredUsers$ = combineLatest([
      // التغيير هنا: استخدام UserManagementState بدلاً من AnalyticsState
      usersSource$.pipe(map((s: UserManagementState) => s.users)), // تم تصحيح AnalyticsState
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]: [User[], string]) => this.filterUsers(users, term))
    );
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
    let normalizedRole: string | number | undefined;

    if (Array.isArray(roleValue)) {
      normalizedRole = roleValue.length > 0 ? roleValue[0] : undefined;
    } else {
      normalizedRole = roleValue;
    }

    const numericRoleId = typeof normalizedRole === 'string' ? parseInt(normalizedRole, 10) : normalizedRole;

    switch (numericRoleId) {
      case 0: return { name: 'Student', icon: 'fa-user-graduate' };
      case 1: return { name: 'Doctor',  icon: 'fa-user-tie'      };
      case 2: return { name: 'Admin',   icon: 'fa-user-shield'   };
      default: return { name: 'User',   icon: 'fa-user'          };
    }
  }

  trackById(_: number, item: User): number { return item.id; }

  isAdmin(): boolean { return this.authService.getUserRole() === 'admin'; }

  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.userService.deleteUser(userId).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Error deleting user:', err);
        alert(err.error?.message || 'Failed to delete user.');
        return of(null);
      })
    ).subscribe((ok: any) => ok !== null && this.refreshUsers$.next()); // تم تصحيح (ok: any)
  }

  startEdit(user: User): void {
    this.editingUserId = user.id;
    this.editedUser    = { ...user };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editedUser    = null;
  }

  saveEdit(): void {
    if (!this.editedUser?.id) {
      alert('No user selected for editing.');
      return;
    }
    this.userService.updateUser(this.editedUser).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Error updating user:', err);
        alert(err.error?.message || 'Failed to update user.');
        return of(null);
      })
    ).subscribe((ok: any) => { // تم تصحيح (ok: any)
      if (ok !== null) {
        this.cancelEdit();
        this.refreshUsers$.next();
      }
    });
  }
}
