import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, catchError } from 'rxjs/operators';
import { User } from '../../../models/user';
import { UserService } from '../../../Services/user.service';

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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const usersSource$ = this.userService.getUsers().pipe(
      map(users => ({ isLoading: false, users, error: null })),
      startWith({ isLoading: true, users: [], error: null }),
      catchError(err => {
        console.error("Error fetching users:", err);
        return of({ isLoading: false, users: [], error: 'Could not load user data. Please check the API connection and try again.' });
      })
    );

    this.state$ = usersSource$;

    this.filteredUsers$ = combineLatest([
      usersSource$.pipe(map(state => state.users)),
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]) => this.filterUsers(users, term))
    );
  }

  // [تم التصحيح] استخدام الخصائص الصحيحة (camelCase/lowercase)
  private filterUsers(users: User[], term: string): User[] {
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

  // [تم التصحيح] استخدام الخاصية الصحيحة user.role
  getRoleInfo(roleId: number): { name: string, icon: string } {
    switch (roleId) {
      case 2: return { name: 'Admin', icon: 'fa-user-shield' };
      case 1: return { name: 'Student', icon: 'fa-user-graduate' };
      case 3: return { name: 'Doctor', icon: 'fa-user-tie' };
      default: return { name: 'User', icon: 'fa-user' };
    }
  }

  // [تم التصحيح] استخدام الخاصية الصحيحة item.id
  trackById(index: number, item: User): number {
    return item.id;
  }
}
