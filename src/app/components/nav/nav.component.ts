// src/app/components/navbar/nav/nav.component.ts

import { Component, OnInit, OnDestroy, Renderer2, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule, NgClass, TitleCasePipe } from '@angular/common';
import { ThemeService } from '../../Services/theme-service.service'; // تأكد من أن هذا المسار صحيح
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  imports: [CommonModule, RouterModule, NgClass, TitleCasePipe],
})
export class NavComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isDarkMode: boolean = false;

  // خاصية جديدة لعدد الإشعارات
  notificationCount: number = 3;

  private themeSubscription!: Subscription;

  constructor(
    private router: Router,
    private themeService: ThemeService, // إعادة إضافة خدمة الثيم
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // إعادة إضافة منطق الاشتراك في تغيير الثيم
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(mode => {
      this.isDarkMode = mode;
      // تطبيق الثيم على body ليعمل على مستوى التطبيق كله
      const theme = mode ? 'dark' : 'light';
      this.renderer.setAttribute(document.body, 'data-theme', theme);
      this.cdr.markForCheck();
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * دالة جديدة لتغيير الثيم
   */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  onMenuItemClick(path: string): void {
    this.router.navigate([path]);
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen = false;
  }

  get userRole(): 'admin' | 'doctor' | 'student' | null {
    const role = this.authService.getRole();
    return role ? role.toLowerCase() as 'admin' | 'doctor' | 'student' : null;
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
