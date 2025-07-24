import { Component, OnInit, OnDestroy, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../Services/theme-service.service';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../Services/language-service.service';
import { FormsModule, NgForm } from '@angular/forms';
import { MailCreateRequest, MailService } from '../../Services/mail.service.service';
import { MailListComponent } from "../Mails/mail-list/mail-list.component";

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
  imports: [CommonModule, FormsModule, MailListComponent],
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

  contactFormModel: MailCreateRequest = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  @ViewChild('contactForm') contactForm!: NgForm;

  formMessage: string | null = null;
  isSuccessMessage: boolean = false;
  private messageTimeout: any;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private themeService: ThemeService,
    private languageService: LanguageService,
    private mailService: MailService
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      if (this.isDarkMode) {
        this.renderer.addClass(document.body, 'dark-theme-active');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme-active');
      }
    });

    this.languageSubscription = this.languageService.currentLanguage$.subscribe(lang => {
      this.loadContent();
      if (lang === 'ar') {
        this.renderer.addClass(document.body, 'rtl-active');
      } else {
        this.renderer.removeClass(document.body, 'rtl-active');
      }
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
    this.renderer.removeClass(document.body, 'dark-theme-active');
    this.renderer.removeClass(document.body, 'rtl-active');
    this.clearFormMessage();
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

  onSubmitContactForm(form: NgForm): void {
    this.clearFormMessage(); // مسح أي رسالة سابقة

    if (form.valid) {
      console.log('Contact form submitted:', this.contactFormModel);
      this.mailService.createMail(this.contactFormModel).subscribe({
        next: (response) => {
          console.log('Email sent successfully!', response);
          // NEW: عرض رسالة نجاح باللغة الإنجليزية
          this.setFormMessage('Your message has been sent successfully!', true);
          form.resetForm();
          this.contactFormModel = { name: '', email: '', subject: '', message: '' };
        },
        error: (error) => {
          console.error('Error sending email:', error);
          // عرض رسالة خطأ من ملف الترجمة
          this.setFormMessage(this.homeContent.messages.errorGeneric, false);
        }
      });
    } else {
      console.warn('Contact form is invalid. Please fill all required fields.');
      // عرض رسالة خطأ عامة للفاليديشن من ملف الترجمة
      this.setFormMessage(this.homeContent.messages.validationError, false);
      // جعل جميع الحقول تظهر كـ "touched" لتفعيل رسائل الأخطاء
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
    }
  }

  private setFormMessage(message: string, isSuccess: boolean): void {
    this.formMessage = message;
    this.isSuccessMessage = isSuccess;

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageTimeout = setTimeout(() => {
      this.clearFormMessage();
    }, 5000); // الرسالة ستختفي بعد 5 ثوانٍ
  }

  clearFormMessage(): void {
    this.formMessage = null;
    this.isSuccessMessage = false;
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }
}
