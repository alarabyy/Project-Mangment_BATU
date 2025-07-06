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
  isSearchActive = false;
  isGlobalAddOpen = false;
  isMobileActionsMenuOpen = false;
  userRole: string | null = null;
  notificationCount = 0;
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
    });

    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.userRole = this.authService.getUserRole();
    });

    this.userRole = this.authService.getUserRole();

    this.subscriptions.add(themeSub);
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }
  toggleSearch(): void { this.isSearchActive = !this.isSearchActive; }
  toggleGlobalAdd(): void { this.isGlobalAddOpen = !this.isGlobalAddOpen; }
  toggleMobileActionsMenu(): void { this.isMobileActionsMenuOpen = !this.isMobileActionsMenuOpen; }

  performSearch(query: string): void {
    if (query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: query.trim() } });
      this.isSearchActive = false;
    }
  }

  quickCreate(type: string): void {
    if (type === 'project') {
      this.router.navigate(['/projects/add']);
    }
    this.isGlobalAddOpen = false;
  }

  onMenuItemClick(path: string): void {
    this.router.navigate([path]);
    this.isMenuOpen = false;
    this.isMobileActionsMenuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.userRole = null;
    this.onMenuItemClick('/auth/login');
  }
}
