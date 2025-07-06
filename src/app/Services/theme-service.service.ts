// File: src/app/Services/theme-service.service.ts

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
   * Initializes the theme based on user's saved preference or system settings.
   */
  private initializeTheme(): void {
    const storedPreference = localStorage.getItem(this.THEME_STORAGE_KEY);

    if (storedPreference) {
      // If a preference is saved, use it.
      const isDark = storedPreference === 'dark';
      this.setDarkMode(isDark, false);
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      // If no preference, listen to system settings.
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

      this.mediaQuerySubscription = fromEvent(mediaQueryList, 'change').pipe(
        map((event: Event) => (event as MediaQueryListEvent).matches),
        startWith(mediaQueryList.matches)
      ).subscribe(isDark => {
        // Apply system theme only if the user hasn't made a choice yet.
        if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
          this.setDarkMode(isDark, false);
        }
      });
    }
  }

  /**
   * Toggles the theme and saves the user's choice.
   */
  public toggleDarkMode(): void {
    const newMode = !this._isDarkMode.getValue();
    this.setDarkMode(newMode, true);
  }

  /**
   * Applies the theme to the UI and optionally saves the preference.
   * @param isDark - Whether to enable dark mode.
   * @param savePreference - Whether to save the choice to localStorage.
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
