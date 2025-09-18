// src/app/components/User/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../Services/auth.service';
import { UserService } from '../../../Services/user.service';
import { User } from '../../../models/user';

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
  public searchTerm$ = new BehaviorSubject<string>('');
  public refreshUsers$ = new BehaviorSubject<void>(undefined);

  public editingUserId: number | null = null;
  public editedUser: Partial<User> | null = null;

  public successMessage: string | null = null;
  public errorMessage: string | null = null;
  private feedbackTimeout: any;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usersSource$ = this.refreshUsers$.pipe(
      startWith(undefined),
      switchMap(() => this.userService.getUsers().pipe(
        map(users => ({ isLoading: false, users, error: null })),
        startWith({ isLoading: true, users: [], error: null }),
        catchError((err: Error) => {
          this.showFeedback('error', err.message || 'Could not load user data.');
          return of({ isLoading: false, users: [], error: err.message });
        })
      ))
    );

    this.state$ = usersSource$;

    this.filteredUsers$ = combineLatest([
      this.state$.pipe(map(s => s.users)),
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]) => this.filterUsers(users, term))
    );
  }

  // ✅ --- دالة جديدة لحل مشكلة خطأ تحميل الصورة ---
  handleImageError(event: Event): void {
    // إخفاء عنصر الصورة الفاشل للسماح للأيقونة البديلة بالظهور
    (event.target as HTMLImageElement).style.display = 'none';
  }

  showFeedback(type: 'success' | 'error', message: string): void {
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    if (type === 'success') { this.successMessage = message; this.errorMessage = null; }
    else { this.errorMessage = message; this.successMessage = null; }
    this.feedbackTimeout = setTimeout(() => { this.successMessage = null; this.errorMessage = null; }, 4000);
  }

  private filterUsers(users: User[], term: string): User[] {
    if (!term) return users;
    term = term.toLowerCase();
    return users.filter(u =>
      u.firstName.toLowerCase().includes(term) ||
      (u.lastname && u.lastname.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term) ||
      this.getRoleInfo(u.role).name.toLowerCase().includes(term)
    );
  }

  onSearch(e: Event): void {
    this.searchTerm$.next((e.target as HTMLInputElement).value);
  }

  getRoleInfo(roleValue: number): { name: string; icon: string; class: string } {
    switch (roleValue) {
      case 0: return { name: 'Student', icon: 'fa-user-graduate', class: 'role-student' };
      case 1: return { name: 'Doctor', icon: 'fa-user-tie', class: 'role-doctor' };
      case 2: return { name: 'Admin', icon: 'fa-user-shield', class: 'role-admin' };
      default: return { name: 'User', icon: 'fa-user', class: 'role-user' };
    }
  }

  formatGraduationDate(user: User): string {
    if (user.role === 0 && user.graduationDate && !user.graduationDate.startsWith('1900')) {
      return new Date(user.graduationDate).toLocaleDateString();
    }
    return 'N/A';
  }

  trackById(_: number, item: User): number { return item.id; }

  isAdmin(): boolean { return this.authService.getUserRole() === 'admin'; }

  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.showFeedback('success', 'User deleted successfully!');
        this.refreshUsers$.next();
      },
      error: (err: Error) => this.showFeedback('error', err.message)
    });
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
    if (!this.editedUser?.id) return;
    const formData = new FormData();
    formData.append('id', this.editedUser.id.toString());
    formData.append('firstName', this.editedUser.firstName ?? '');
    formData.append('lastName', this.editedUser.lastname ?? '');
    formData.append('email', this.editedUser.email ?? '');
    if (this.editedUser.gender !== undefined) {
      formData.append('gender', this.editedUser.gender.toString());
    }
    this.userService.updateUser(formData).subscribe({
      next: () => {
        this.showFeedback('success', 'User updated successfully!');
        this.cancelEdit();
        this.refreshUsers$.next();
      },
      error: (err: Error) => this.showFeedback('error', err.message)
    });
  }

  goToUserAnalytics(): void {
    this.router.navigate(['/user-analytics']);
  }
}
