import { Injectable, Renderer2, RendererFactory2, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private readonly THEME_STORAGE_KEY = 'theme-preference';

  private _isDarkMode = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this._isDarkMode.asObservable();

  private renderer: Renderer2;
  private mediaQuerySubscription?: Subscription;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  /**
   * Initializes the theme based on:
   * 1. Stored user preference in localStorage.
   * 2. System preference (prefers-color-scheme) if no preference is stored.
   */
  private initializeTheme(): void {
    const storedPreference = localStorage.getItem(this.THEME_STORAGE_KEY);

    if (storedPreference) {
      // If a preference is stored, use it
      const isDark = storedPreference === 'dark';
      this.setDarkMode(isDark, false); // Don't save again, just apply
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      // If no preference stored, check system preference and listen for changes
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

      // Initial check
      this.setDarkMode(mediaQueryList.matches, false); // Apply system default, don't save yet

      // Listen for system preference changes
      this.mediaQuerySubscription = fromEvent(mediaQueryList, 'change').pipe(
        map((event: Event) => (event as MediaQueryListEvent).matches),
        // No startWith here, as we already applied the initial state above.
        // This subscription only triggers on actual changes.
      ).subscribe(isDark => {
        // Only update if the user hasn't explicitly set a preference yet
        if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
          this.setDarkMode(isDark, false); // Apply system change, don't save
        }
      });
    }
  }

  /**
   * Toggles between dark and light mode.
   * Saves the new preference to localStorage.
   */
  public toggleDarkMode(): void {
    const newMode = !this._isDarkMode.getValue();
    this.setDarkMode(newMode, true); // Save the new explicit preference
  }

  /**
   * Sets the theme mode.
   * @param isDark True for dark mode, false for light mode.
   * @param savePreference If true, saves the preference to localStorage.
   */
  public setDarkMode(isDark: boolean, savePreference: boolean = true): void {
    this._isDarkMode.next(isDark);

    if (isDark) {
      this.renderer.addClass(this.document.body, 'dark-theme-active');
      this.renderer.removeClass(this.document.body, 'light-theme-active');
    } else {
      this.renderer.addClass(this.document.body, 'light-theme-active');
      this.renderer.removeClass(this.document.body, 'dark-theme-active');
    }

    if (savePreference) {
      localStorage.setItem(this.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    }
  }

  ngOnDestroy(): void {
    this.mediaQuerySubscription?.unsubscribe();
  }
}
