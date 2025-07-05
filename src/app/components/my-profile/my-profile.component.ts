// src/app/components/my-profile/my-profile.component.ts

import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../Services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
        if (profile && profile.firstName) {
          this.userProfile = profile;
        } else {
          this.errorMessage = "Profile data received from API is incomplete.";
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = "Could not load your profile. Please try again later.";
        this.isLoading = false;
      }
    });
  }

  getRoleAsString(roleNumber: number): string {
    switch (roleNumber) {
      case 0: return 'Student';
      case 1: return 'Doctor';
      case 2: return 'Admin';
      default: return 'Unknown';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
