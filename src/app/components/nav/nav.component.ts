// src/app/components/navbar/nav/nav.component.ts

import { Component, OnInit, OnDestroy, HostListener, ElementRef, Renderer2, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule, NgClass, TitleCasePipe } from '@angular/common';
import { ThemeService } from '../../Services/theme-service.service';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  imports: [CommonModule, RouterModule, NgClass, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isDarkMode: boolean = false;
  isSearchActive = false;
  isGlobalAddOpen = false;
  isMobileActionsMenuOpen = false;
  notificationCount: number = 3;
  currentYear: number = new Date().getFullYear();
  private themeSubscription!: Subscription;

  @ViewChild('searchInput') searchInputEl!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(mode => {
      this.isDarkMode = mode;
      this.renderer.setAttribute(document.body, 'data-theme', mode ? 'dark' : 'light');
      this.cdr.markForCheck();
    });
  }

  private closeAllPopups(): void {
    this.isMenuOpen = false;
    this.isGlobalAddOpen = false;
    this.isSearchActive = false;
    this.isMobileActionsMenuOpen = false;
    this.cdr.markForCheck();
  }

  toggleMenu(): void {
    const currentlyOpen = this.isMenuOpen;
    this.closeAllPopups();
    this.isMenuOpen = !currentlyOpen;
  }

  toggleGlobalAdd(): void {
    const currentlyOpen = this.isGlobalAddOpen;
    this.closeAllPopups();
    this.isGlobalAddOpen = !currentlyOpen;
  }

  toggleSearch(): void {
    const currentlyOpen = this.isSearchActive;
    this.closeAllPopups();
    this.isSearchActive = !currentlyOpen;
    if (this.isSearchActive) {
      setTimeout(() => this.searchInputEl?.nativeElement.focus(), 0);
    }
  }

  toggleMobileActionsMenu(): void {
    const currentlyOpen = this.isMobileActionsMenuOpen;
    this.closeAllPopups();
    this.isMobileActionsMenuOpen = !currentlyOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar, .dropdown-menu, .global-add-menu, .mobile-actions-menu')) {
        this.closeAllPopups();
    }
  }

  onMenuItemClick(path: string): void {
    this.router.navigate([path]);
    this.closeAllPopups();
  }

  toggleDarkMode(): void {
    // افترض وجود هذه الدالة في خدمتك
    // this.themeService.toggleDarkMode();
  }

  onLogout(): void {
    this.authService.logout();
    this.closeAllPopups();
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
