// File: src/app/admin/components/user-management/user-management.component.ts
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

  /* ---------- STATE ---------- */
  public state$!: Observable<UserManagementState>;
  public filteredUsers$!: Observable<User[]>;
  private searchTerm$   = new BehaviorSubject<string>('');
  private refreshUsers$ = new BehaviorSubject<void>(undefined);

  /* ---------- EDIT MODE ---------- */
  public editingUserId: number | null = null;
  public editedUser: Partial<User> | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  /* ---------- INIT ---------- */
  ngOnInit(): void {

    /* 1) تحميل المستخدمين */
    const usersSource$ = this.refreshUsers$.pipe(
      startWith(undefined),
      switchMap(() => this.userService.getUsers().pipe(
        map(users => ({ isLoading: false, users, error: null })),
        startWith({ isLoading: true, users: [], error: null }),
        catchError(err => {
          console.error('Error fetching users:', err);
          const msg = err.status === 401
            ? 'You are not authorized to view this data. Please log in.'
            : (err.error?.message || 'Could not load user data.');
          return of({ isLoading: false, users: [], error: msg });
        })
      ))
    );

    this.state$ = usersSource$;

    /* 2) فلترة المستخدمين حسب البحث */
    this.filteredUsers$ = combineLatest([
      usersSource$.pipe(map(s => s.users)),
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]) => this.filterUsers(users, term))
    );
  }

  /* ---------- SEARCH ---------- */
  private filterUsers(users: User[], term: string): User[] {
    if (!users?.length) return [];
    if (!term) return users;

    term = term.toLowerCase();
    return users.filter(u =>
      u.firstName.toLowerCase().includes(term)           ||
      (u.lastname?.toLowerCase().includes(term) ?? false)||
      u.email.toLowerCase().includes(term)               ||
      u.id.toString().includes(term)                     ||
      this.getRoleInfo(u.role).name.toLowerCase().includes(term)
    );
  }

  onSearch(e: Event): void {
    this.searchTerm$.next((e.target as HTMLInputElement).value);
  }

  /* ---------- ROLE MAPPING (fixed) ---------- */
  getRoleInfo(roleId: number): { name: string; icon: string } {
    /* تعتمد هذه القيم على الـ Enum فى الـ Back‑End:
       Student = 0, Doctor = 1, Admin = 2
    */
    switch (roleId) {
      case 0: return { name: 'Student', icon: 'fa-user-graduate' };
      case 1: return { name: 'Doctor',  icon: 'fa-user-tie'      };
      case 2: return { name: 'Admin',   icon: 'fa-user-shield'   };
      default: return { name: 'User',   icon: 'fa-user'          };
    }
  }

  /* ---------- TEMPLATE HELPERS ---------- */
  trackById(_: number, item: User): number { return item.id; }

  isAdmin(): boolean { return this.authService.getUserRole() === 'admin'; }

  /* ---------- CRUD ---------- */
  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.userService.deleteUser(userId).pipe(
      catchError(err => {
        console.error('Error deleting user:', err);
        alert(err.error?.message || 'Failed to delete user.');
        return of(null);
      })
    ).subscribe(ok => ok !== null && this.refreshUsers$.next());
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
    if (!this.editedUser?.id) return alert('No user selected for editing.');
    this.userService.updateUser(this.editedUser).pipe(
      catchError(err => {
        console.error('Error updating user:', err);
        alert(err.error?.message || 'Failed to update user.');
        return of(null);
      })
    ).subscribe(ok => {
      if (ok !== null) {
        this.cancelEdit();
        this.refreshUsers$.next();
      }
    });
  }
}
