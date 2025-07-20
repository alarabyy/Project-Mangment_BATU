// src/app/core/components/nav/nav.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, Observable } from 'rxjs';
import { NotificationService } from '../../../Services/notification-proxy.service'; // Corrected path
import { ThemeService } from '../../../Services/theme-service.service'; // Corrected path
import { NavigationControlsComponent } from "../navigation-controls/navigation-controls.component"; // Assuming this is correct
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, TitleCasePipe, NavigationControlsComponent],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  isMenuOpen = false;
  userRole: string | null = null;
  currentYear: number = new Date().getFullYear();
  unreadCount$!: Observable<number>;

  private subscriptions = new Subscription();

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes from ThemeService
    const themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      // ThemeService already handles body classes: dark-theme-active/light-theme-active
      // No need for 'dark' class on body directly from here.
    });

    // Close menu and update user role on navigation
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.userRole = this.authService.getUserRole();
      this.isMenuOpen = false; // Close menu on navigation
    });

    // Get initial user role
    this.userRole = this.authService.getUserRole();

    // Get observable for unread notification count
    this.unreadCount$ = this.notificationService.unreadCount$;

    // Add subscriptions to manage them on component destruction
    this.subscriptions.add(themeSub);
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onLogout(): void {
    this.authService.logout();
    this.userRole = null;
    this.isMenuOpen = false; // Close menu on logout
    this.router.navigate(['/Login']); // Redirect to login page
  }
}
