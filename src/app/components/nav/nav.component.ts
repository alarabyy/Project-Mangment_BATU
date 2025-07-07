import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, Observable } from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { ThemeService } from '../../Services/theme-service.service';
import { NotificationService } from '../../Services/notification-proxy.service';
// ==========================================================
// ==            THIS IS THE CORRECTED IMPORT              ==
// ==========================================================

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
  unreadCount$!: Observable<number>;

  private subscriptions = new Subscription();

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private notificationService: NotificationService // Injection is now correct
  ) {}

  ngOnInit(): void {
    const themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      document.body.classList.toggle('dark-theme', isDark);
    });

    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.userRole = this.authService.getUserRole();
      this.isMenuOpen = false;
    });

    this.userRole = this.authService.getUserRole();
    // This will now correctly get the unread count from the right service
    this.unreadCount$ = this.notificationService.unreadCount$;

    this.subscriptions.add(themeSub);
    this.subscriptions.add(routerSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    document.body.classList.remove('dark-theme');
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
    this.isMenuOpen = false;
    this.router.navigate(['/auth/login']);
  }
}
