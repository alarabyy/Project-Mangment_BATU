// src/app/components/User/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { UserProfile } from '../../../Services/auth.service'; // Ensure UserProfile is correctly defined here
import { UserService } from '../../../Services/user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userProfile$: Observable<UserProfile | undefined> | undefined;
  loadingError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.userProfile$ = this.route.paramMap.pipe(
      switchMap(params => {
        const userId = params.get('id');
        if (userId) {
          return this.userService.getUserProfile(parseInt(userId, 10)).pipe(
            catchError(err => {
              console.error("Error fetching user profile:", err);
              this.loadingError = 'Failed to load user profile. It might not exist or you lack permissions.';
              if (err.status === 401 || err.status === 403) {
                this.loadingError = 'You are not authorized to view this profile.';
              }
              return of(undefined);
            })
          );
        } else {
          this.loadingError = 'User ID not provided in the URL.';
          return of(undefined);
        }
      })
    );
  }
}
