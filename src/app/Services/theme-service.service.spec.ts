// File: src/app/services/theme.service.ts

import { Injectable, Renderer2, RendererFactory2, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private _isDarkMode = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this._isDarkMode.asObservable();
  private renderer: Renderer2;
  private mediaQueryList?: MediaQueryList;
  private mediaQuerySubscription?: Subscription;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Check if running in a browser environment before accessing window
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.setupSystemThemeListener();
      this.loadThemePreference();
    }
  }

  private setupSystemThemeListener(): void {
    if (this.mediaQueryList) {
        this.mediaQuerySubscription = fromEvent(this.mediaQueryList, 'change').pipe(
          map((event: Event) => (event as MediaQueryListEvent).matches),
          startWith(this.mediaQueryList.matches)
        ).subscribe(isSystemDark => {
          if (localStorage.getItem('themePreference') === null) {
            this.setDarkMode(isSystemDark, false);
          }
        });
    }
  }

  private loadThemePreference(): void {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
        // Default to system preference if no localStorage (e.g., SSR)
        const isSystemDark = this.mediaQueryList ? this.mediaQueryList.matches : false;
        this.setDarkMode(isSystemDark, false);
        return;
    }

    const storedPreference = localStorage.getItem('themePreference');
    if (storedPreference === 'dark') {
      this.setDarkMode(true, false);
    } else if (storedPreference === 'light') {
      this.setDarkMode(false, false);
    } else {
      const isSystemDark = this.mediaQueryList ? this.mediaQueryList.matches : false;
      this.setDarkMode(isSystemDark, false);
    }
  }

  public toggleDarkMode(): void {
    const newMode = !this._isDarkMode.value;
    this.setDarkMode(newMode, true);
  }

  public setDarkMode(isDark: boolean, savePreference: boolean = true): void {
    this._isDarkMode.next(isDark);
    this.applyThemeToBody(isDark);

    if (savePreference && typeof localStorage !== 'undefined') {
      localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
    }
  }

  private applyThemeToBody(isDark: boolean): void {
    if (isDark) {
      this.renderer.removeClass(this.document.body, 'light-theme-active');
    } else {
      this.renderer.addClass(this.document.body, 'light-theme-active');
    }
  }

  ngOnDestroy(): void {
    if (this.mediaQuerySubscription) {
      this.mediaQuerySubscription.unsubscribe();
    }
  }
}
