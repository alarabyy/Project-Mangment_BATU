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

  private initializeTheme(): void {
    const storedPreference = localStorage.getItem(this.THEME_STORAGE_KEY);

    if (storedPreference) {
      const isDark = storedPreference === 'dark';
      this.setDarkMode(isDark, false);
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

      this.mediaQuerySubscription = fromEvent(mediaQueryList, 'change').pipe(
        map((event: Event) => (event as MediaQueryListEvent).matches),
        startWith(mediaQueryList.matches)
      ).subscribe(isDark => {
        if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
          this.setDarkMode(isDark, false);
        }
      });
    }
  }

  public toggleDarkMode(): void {
    const newMode = !this._isDarkMode.getValue();
    this.setDarkMode(newMode, true);
  }

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
