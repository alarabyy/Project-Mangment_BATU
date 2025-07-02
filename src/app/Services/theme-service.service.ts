import { Injectable, Renderer2, RendererFactory2, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

/**
 * @service ThemeService
 * @description Manages the application's color theme (Light/Dark Mode).
 * It detects the user's system preference and allows for manual toggling.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  // A Subject to hold the current theme state (true = dark, false = light)
  private _isDarkMode = new BehaviorSubject<boolean>(false);

  // Public Observable for components to subscribe to theme changes
  public isDarkMode$ = this._isDarkMode.asObservable();

  private renderer: Renderer2;

  // These properties are now optional with the '?' operator
  private mediaQueryList?: MediaQueryList;
  private mediaQuerySubscription?: Subscription;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Check for the 'prefers-color-scheme' media feature and listen for changes
    if (window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.setupSystemThemeListener();
    }

    // Load the theme preference on service initialization
    this.loadThemePreference();
  }

  /**
   * @private
   * @method setupSystemThemeListener
   * @description Listens for changes to the user's system theme preference.
   */
  private setupSystemThemeListener(): void {
    if (this.mediaQueryList) { // Add a null check here to be safe
        // Use fromEvent to create an Observable from the 'change' event
        this.mediaQuerySubscription = fromEvent(this.mediaQueryList, 'change').pipe(
          // Map the event to the new 'matches' value
          map((event: any) => event.matches),
          // Start with the initial value
          startWith(this.mediaQueryList.matches)
        ).subscribe(isSystemDark => {
          // If there's no manual preference stored, apply the system theme
          if (localStorage.getItem('themePreference') === null) {
            this.setDarkMode(isSystemDark, false); // Do not save this to local storage
          }
        });
    }
  }

  /**
   * @private
   * @method loadThemePreference
   * @description Loads the theme preference from local storage or defaults to system preference.
   */
  private loadThemePreference(): void {
    const storedPreference = localStorage.getItem('themePreference');

    if (storedPreference === 'dark') {
      // User has manually set the theme to dark
      this.setDarkMode(true, false);
    } else if (storedPreference === 'light') {
      // User has manually set the theme to light
      this.setDarkMode(false, false);
    } else {
      // No manual preference, apply the system's current preference
      const isSystemDark = this.mediaQueryList ? this.mediaQueryList.matches : false;
      this.setDarkMode(isSystemDark, false);
    }
  }

  /**
   * @public
   * @method toggleDarkMode
   * @description Toggles the theme between dark and light mode.
   * This action saves the user's preference to local storage.
   */
  public toggleDarkMode(): void {
    const newMode = !this._isDarkMode.value;
    this.setDarkMode(newMode, true);
  }

  /**
   * @public
   * @method setDarkMode
   * @description Sets the theme to a specific mode (dark or light).
   * @param isDark - A boolean indicating whether to activate dark mode.
   * @param savePreference - A boolean to indicate whether to save the preference to local storage.
   */
  public setDarkMode(isDark: boolean, savePreference: boolean = true): void {
    this._isDarkMode.next(isDark);
    this.applyThemeToBody(isDark);

    if (savePreference) {
      // Save the user's manual choice to override system preference
      localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
    }
  }

  /**
   * @private
   * @method applyThemeToBody
   * @description Applies or removes the 'light-theme-active' class to the body element.
   * @param isDark - A boolean indicating the current theme.
   */
  private applyThemeToBody(isDark: boolean): void {
    if (isDark) {
      this.renderer.removeClass(this.document.body, 'light-theme-active');
    } else {
      this.renderer.addClass(this.document.body, 'light-theme-active');
    }
  }

  /**
   * @lifecycle hook
   * @description Cleans up the subscription to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.mediaQuerySubscription) {
      this.mediaQuerySubscription.unsubscribe();
    }
  }
}
