import { Component, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../Services/theme-service.service';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../Services/language-service.service';

// Interfaces (kept for clarity, though `homeContent` will directly match the service's structure)
interface Project {
  id: number;
  title: string;
  icon: string;
  status: 'active' | 'pending' | 'completed';
  abstract: string;
}

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
}

interface Statistic {
  icon: string;
  value: string;
  label: string;
  description?: string;
}

interface Service {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

interface CoreFeature {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
}

interface SkillOutcome {
  icon: string;
  title: string;
  description: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  universityName: string = "";
  unitName: string = "";
  isDarkMode: boolean = true;
  currentYear: number = new Date().getFullYear();

  homeContent: any; // Object to hold all translated content

  private languageSubscription!: Subscription;
  private themeSubscription!: Subscription;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private themeService: ThemeService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    this.languageSubscription = this.languageService.currentLanguage$.subscribe(lang => {
      this.loadContent();
    });

    this.addAnimationClasses();
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  loadContent(): void {
    this.homeContent = this.languageService.getTranslation('home');
    this.universityName = this.homeContent.universityName;
    this.unitName = this.homeContent.unitName;
  }

  getCurrentLanguage(): 'en' | 'ar' {
    return this.languageService.getCurrentLanguage();
  }

  toggleLanguage(): void {
    const newLang = this.getCurrentLanguage() === 'en' ? 'ar' : 'en';
    this.languageService.setLanguage(newLang);
  }

  private addAnimationClasses(): void {
    setTimeout(() => {
      const heroText = this.el.nativeElement.querySelector('.hero-text');
      const heroVisual = this.el.nativeElement.querySelector('.hero-visual');

      if (heroText) {
        this.renderer.addClass(heroText, 'animate-fade-up');
      }
      if (heroVisual) {
        this.renderer.addClass(heroVisual, 'animate-slide-right');
      }
    }, 100);
  }
}
