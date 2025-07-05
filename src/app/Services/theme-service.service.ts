// src/app/Services/theme-service.service.ts
// هذا الكود سليم كما أرسلته، لا حاجة لتعديله.

import { Injectable, Renderer2, RendererFactory2, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
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
    if (window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.setupSystemThemeListener();
    }
    this.loadThemePreference();
  }

  private setupSystemThemeListener(): void {
    if (this.mediaQueryList) {
        this.mediaQuerySubscription = fromEvent(this.mediaQueryList, 'change').pipe(
          map((event: any) => event.matches),
          startWith(this.mediaQueryList.matches)
        ).subscribe(isSystemDark => {
          if (localStorage.getItem('themePreference') === null) {
            this.setDarkMode(isSystemDark, false);
          }
        });
    }
  }

  private loadThemePreference(): void {
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
    if (savePreference) {
      localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
    }
  }

  private applyThemeToBody(isDark: boolean): void {
    // هذا الكود سيتحكم في الثيم على مستوى التطبيق كله
    // سأقوم بتغيير هذا ليتوافق مع التصميم العام (استخدام data-theme)
    const theme = isDark ? 'dark' : 'light';
    this.renderer.setAttribute(this.document.body, 'data-theme', theme);
  }

  ngOnDestroy(): void {
    if (this.mediaQuerySubscription) {
      this.mediaQuerySubscription.unsubscribe();
    }
  }
}
