import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, catchError, tap } from 'rxjs/operators';
import { User } from '../../models/user';
import { UserService } from '../../Services/user.service';

// Interface for the component's reactive state, which drives the UI
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
  // A single state observable for loading and error states
  public state$!: Observable<UserManagementState>;
  // A dedicated observable for the filtered user list
  public filteredUsers$!: Observable<User[]>;

  private searchTerm$ = new BehaviorSubject<string>('');

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Create the primary data source stream
    const usersSource$ = this.userService.getUsers().pipe(
      map(users => ({ isLoading: false, users, error: null })),
      startWith({ isLoading: true, users: [], error: null }),
      catchError(err => {
        console.error("Error fetching users:", err);
        return of({ isLoading: false, users: [], error: 'Could not load user data. Please check the connection and try again.' });
      })
    );

    // 2. Create the filtered users stream based on the source and search term
    this.filteredUsers$ = combineLatest([
      usersSource$.pipe(map(state => state.users)), // We only need the users array for filtering
      this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([users, term]) => this.filterUsers(users, term))
    );

    // 3. Expose the original state stream to the template for loading/error UI
    this.state$ = usersSource$;
  }

  // Pure function for filtering logic, easy to test and maintain
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

  // --- Template-facing methods ---

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm$.next(term);
  }

  // Returns both a name and an icon for the role
  getRoleInfo(roleId: number): { name: string, icon: string } {
    switch (roleId) {
      case 2: return { name: 'Admin', icon: 'fa-user-shield' };
      case 1: return { name: 'Student', icon: 'fa-user-graduate' };
      case 3: return { name: 'Doctor', icon: 'fa-user-tie' };
      default: return { name: 'User', icon: 'fa-user' };
    }
  }

  // For NgFor performance
  trackById(index: number, item: User): number {
    return item.id;
  }
}
