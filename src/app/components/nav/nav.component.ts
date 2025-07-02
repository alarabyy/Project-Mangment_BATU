// src/app/components/navbar/nav/nav.component.ts
import { Component, OnInit, OnDestroy, HostListener, ElementRef, Renderer2, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule, NgClass } from '@angular/common';
import { ThemeService } from '../../Services/theme-service.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  imports: [CommonModule, RouterModule, NgClass], // Added NgClass for mobile actions menu icon
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isDarkMode: boolean = false;
  private themeSubscription!: Subscription;
  isSearchActive = false;
  isGlobalAddOpen = false;
  isMobileActionsMenuOpen = false; // For the new mobile actions menu

  userName: string = 'Ahmad Mahmoud';
  userRole: string = 'Computer Science Student';
  notificationCount: number = 3;
  isAdmin: boolean = true;
  currentYear: number = new Date().getFullYear();

  @ViewChild('searchInput') searchInputEl!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(mode => {
      this.isDarkMode = mode;
      if (mode) {
        this.renderer.addClass(document.body, 'dark-theme-active');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme-active');
      }
      this.cdr.markForCheck();
    });
  }

  private closeAllPopups(): void {
    this.isMenuOpen = false;
    this.isGlobalAddOpen = false;
    this.isSearchActive = false;
    this.isMobileActionsMenuOpen = false;
  }

  toggleMenu(): void {
    const currentlyOpen = this.isMenuOpen;
    this.closeAllPopups();
    this.isMenuOpen = !currentlyOpen;
    this.cdr.markForCheck();
  }

  toggleGlobalAdd(): void {
    const currentlyOpen = this.isGlobalAddOpen;
    this.closeAllPopups();
    this.isGlobalAddOpen = !currentlyOpen;
    this.cdr.markForCheck();
  }

  toggleSearch(): void {
    const currentlyOpen = this.isSearchActive;
    this.closeAllPopups();
    this.isSearchActive = !currentlyOpen;
    if (this.isSearchActive) {
      setTimeout(() => this.searchInputEl?.nativeElement.focus(), 0);
    }
    this.cdr.markForCheck();
  }

  toggleMobileActionsMenu(): void {
    const currentlyOpen = this.isMobileActionsMenuOpen;
    this.closeAllPopups(); // Close all other popups first
    this.isMobileActionsMenuOpen = !currentlyOpen; // Then toggle the desired one
    this.cdr.markForCheck();
  }

  closeMobileActionsMenu(): void { // Helper for items within mobile actions menu
    this.isMobileActionsMenuOpen = false;
    this.cdr.markForCheck(); // Ensure UI updates if called directly
  }

  // --- Trigger methods for Mobile Actions Menu items ---
  triggerSearchFromMobileMenu(): void {
    this.closeMobileActionsMenu(); // Close this menu first
    this.toggleSearch(); // Then open the search bar
  }

  triggerGlobalAddFromMobileMenu(): void {
    this.closeMobileActionsMenu(); // Close this menu first
    this.toggleGlobalAdd(); // Then open the global add dropdown
  }

  triggerDarkModeFromMobileMenu(): void {
    this.toggleDarkMode(); // Dark mode logic
    // No need to closeMobileActionsMenu explicitly if toggleDarkMode doesn't open anything else.
    // However, if it feels more consistent to close it:
    // this.closeMobileActionsMenu();
  }
  // --- End Trigger methods ---


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    let changed = false;

    // Main Sidebar Menu
    const clickedOnMenuToggle = target.closest('.menu-toggle');
    const clickedInsideDropdown = target.closest('.dropdown-menu');
    if (this.isMenuOpen && !clickedOnMenuToggle && !clickedInsideDropdown) {
      this.isMenuOpen = false;
      changed = true;
    }

    // Desktop Search Bar
    const clickedOnSearchToggle = target.closest('.search-toggle'); // This is the desktop toggle
    const clickedInsideSearchBar = target.closest('.search-bar-container');
    if (this.isSearchActive && !clickedOnSearchToggle && !clickedInsideSearchBar) {
      if (!this.searchInputEl?.nativeElement.contains(target)) {
         this.isSearchActive = false;
         changed = true;
      }
    }

    // Desktop Global Add Menu
    const clickedOnGlobalAddToggle = target.closest('.global-add-btn'); // Desktop toggle
    const clickedInsideGlobalAddMenu = target.closest('.global-add-menu');
    if (this.isGlobalAddOpen && !clickedOnGlobalAddToggle && !clickedInsideGlobalAddMenu) {
      this.isGlobalAddOpen = false;
      changed = true;
    }

    // Mobile Actions Menu
    const clickedOnMobileActionsToggle = target.closest('.mobile-actions-toggle-btn');
    const clickedInsideMobileActionsMenu = target.closest('.mobile-actions-menu');
    if (this.isMobileActionsMenuOpen && !clickedOnMobileActionsToggle && !clickedInsideMobileActionsMenu) {
      this.isMobileActionsMenuOpen = false;
      changed = true;
    }

    if (changed) {
      this.cdr.markForCheck();
    }
  }

  onMenuItemClick(path?: string, action?: string): void {
    if (path) {
      this.router.navigate([path]);
    } else if (action) {
      this.quickCreate(action);
    }
    this.closeAllPopups(); // Close everything after a main menu item click
    this.cdr.markForCheck();
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  performSearch(event: Event | KeyboardEvent, query: string): void {
    if (event instanceof KeyboardEvent && event.key !== 'Enter') {
        return;
    }
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      this.router.navigate(['/search-results'], { queryParams: { q: trimmedQuery } });
      if (this.searchInputEl?.nativeElement) {
        this.searchInputEl.nativeElement.value = '';
      }
    }
    this.isSearchActive = false; // Always close search after action
    this.cdr.markForCheck();
  }

  quickCreate(itemType: string): void {
    let navigationPath = '';
    switch (itemType) {
      case 'project': navigationPath = '/projects/create'; break;
      case 'task': navigationPath = '/tasks/create'; break;
      case 'document': navigationPath = '/documents/upload'; break;
      case 'event': navigationPath = '/calendar/new-event'; break;
      default: console.warn('Unknown item type for quick create:', itemType); return;
    }
    this.router.navigate([navigationPath]);
    this.closeAllPopups(); // Close everything after quick create
    this.cdr.markForCheck();
  }

  onLogout(): void {
    this.router.navigate(['/login']);
    this.closeAllPopups(); // Close everything on logout
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
