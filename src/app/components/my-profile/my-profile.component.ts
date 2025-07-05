// File: src/app/components/my-profile/my-profile.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../Services/auth.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {

  userProfile: UserProfile | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getUserProfileFromApi().subscribe({
      next: (profile) => {
        if (profile) {
          this.userProfile = profile;
        } else {
          this.errorMessage = "Profile data received from API is incomplete.";
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = "Could not load your profile. Please try again later.";
        this.isLoading = false;
        console.error("API Error fetching profile:", err);
      }
    });
  }

  getRoleAsString(roleNumber: number | undefined): string {
    if (roleNumber === undefined) return 'Unknown';
    switch (roleNumber) {
      case 0: return 'Student';
      case 1: return 'Professor';
      case 2: return 'Admin';
      default: return 'Unknown';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
