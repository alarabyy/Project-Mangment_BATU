// File: src/app/components/floating-controls/floating-controls.component.ts

import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { map } from 'rxjs/operators'; // Removed startWith as it's not needed with interval(1000)
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../Services/theme-service.service'; // Corrected import path

@Component({
  selector: 'app-floating-controls',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './floating-controls.component.html',
  styleUrls: ['./floating-controls.component.css']
})
export class FloatingControlsComponent implements OnInit, OnDestroy {
  isDarkMode: boolean = false;
  private themeSubscription!: Subscription;

  currentFontSize = 16;
  minFontSize = 12;
  maxFontSize = 22;
  fontSizeStep = 1;

  timeString: string = '';
  private clockSubscription!: Subscription;

  showControls = false;
  showScrollToTopButton = false;

  constructor(
    private themeService: ThemeService,
    @Inject(DOCUMENT) private document: Document,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(mode => {
      this.isDarkMode = mode;
      this.cdr.markForCheck(); // Ensure view updates
    });

    this.loadFontSizePreference();
    this.startClock();
    this.onWindowScroll(); // Call once on init to set initial state
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  increaseFontSize(): void {
    if (this.currentFontSize < this.maxFontSize) {
      this.currentFontSize += this.fontSizeStep;
      this.applyAndStoreFontSize();
    }
  }

  decreaseFontSize(): void {
    if (this.currentFontSize > this.minFontSize) {
      this.currentFontSize -= this.fontSizeStep;
      this.applyAndStoreFontSize();
    }
  }

  private applyAndStoreFontSize(): void {
    this.document.documentElement.style.fontSize = `${this.currentFontSize}px`;
    localStorage.setItem('preferredFontSize', this.currentFontSize.toString());
  }

  loadFontSizePreference(): void {
    const preferredSize = localStorage.getItem('preferredFontSize');
    if (preferredSize) {
      const size = parseInt(preferredSize, 10);
      if (size >= this.minFontSize && size <= this.maxFontSize) {
        this.currentFontSize = size;
      }
    }
    // Apply initial or loaded font size to the root HTML element
    this.document.documentElement.style.fontSize = `${this.currentFontSize}px`;
  }

  startClock(): void {
    this.clockSubscription = interval(1000)
      .pipe(
        map(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      )
      .subscribe(timeStr => {
        this.timeString = timeStr;
        this.cdr.markForCheck();
      });
  }

  toggleShowControls(): void {
    this.showControls = !this.showControls;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const yOffset = window.pageYOffset || this.document.documentElement.scrollTop;
    const showOffset = 250; // Pixels to scroll down before showing button
    const shouldShow = yOffset > showOffset;

    // Only update and trigger change detection if the state actually changes
    if (this.showScrollToTopButton !== shouldShow) {
      this.showScrollToTopButton = shouldShow;
      this.cdr.markForCheck();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.clockSubscription?.unsubscribe();
  }
}
