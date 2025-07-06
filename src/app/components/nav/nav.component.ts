// File: src/app/components/nav/nav.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { ThemeService } from '../../Services/theme-service.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, TitleCasePipe],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  isMenuOpen = false;
  userRole: string | null = null;
  currentYear: number = new Date().getFullYear();
  private subscriptions: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      // Optional: Add/remove a class from the body for global dark mode styling
      document.body.classList.toggle('dark-theme', isDark);
    });

    // On route change, get the user role and close the menu
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.userRole = this.authService.getUserRole();
      this.isMenuOpen = false; // Always close menu on navigation
    });

    this.userRole = this.authService.getUserRole();

    this.subscriptions.add(themeSub);
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
     // Clean up body class
    document.body.classList.remove('dark-theme');
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // This function is called when a menu link is clicked
  onMenuItemClick(path: string): void {
    this.router.navigate([path]);
    // The menu will close automatically because of the router event subscription in ngOnInit
  }

  onLogout(): void {
    this.authService.logout();
    this.userRole = null;
    this.onMenuItemClick('/auth/login'); // Use the same function to navigate
  }
}
