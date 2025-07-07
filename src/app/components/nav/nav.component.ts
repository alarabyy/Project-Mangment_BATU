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
  // --- Component State ---
  isDarkMode = false;
  isMenuOpen = false;
  userRole: string | null = null;
  currentYear: number = new Date().getFullYear();

  private subscriptions = new Subscription();

  // --- Constructor & Lifecycle Hooks ---
  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscription to theme changes
    const themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      document.body.classList.toggle('dark-theme', isDark);
    });

    // Subscription to router events to close the menu on navigation
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.userRole = this.authService.getUserRole();
      this.isMenuOpen = false; // Automatically close menu
    });

    // Initialize user role on component load
    this.userRole = this.authService.getUserRole();

    this.subscriptions.add(themeSub);
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and global classes to prevent memory leaks
    this.subscriptions.unsubscribe();
    document.body.classList.remove('dark-theme');
  }

  // --- Public Methods ---

  /** Toggles the application's dark mode. */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  /** Toggles the visibility of the sidebar menu. */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /** Logs the user out and navigates to the login page. */
  onLogout(): void {
    this.authService.logout();
    this.userRole = null;
    this.isMenuOpen = false; // Close menu on logout
    this.router.navigate(['/auth/login']);
  }
}
