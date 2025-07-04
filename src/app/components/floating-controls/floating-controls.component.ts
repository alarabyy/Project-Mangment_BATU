import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ThemeService } from '../../Services/theme-service.service';
import { RouterModule } from '@angular/router';

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
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(mode => {
      this.isDarkMode = mode;
      this.cdr.markForCheck();
    });

    this.loadFontSizePreference();
    this.startClock();
    this.onWindowScroll();
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  increaseFontSize(): void {
    if (this.currentFontSize < this.maxFontSize) {
      this.currentFontSize += this.fontSizeStep;
      this.document.documentElement.style.fontSize = `${this.currentFontSize}px`;
      localStorage.setItem('preferredFontSize', this.currentFontSize.toString());
    }
  }

  decreaseFontSize(): void {
    if (this.currentFontSize > this.minFontSize) {
      this.currentFontSize -= this.fontSizeStep;
      this.document.documentElement.style.fontSize = `${this.currentFontSize}px`;
      localStorage.setItem('preferredFontSize', this.currentFontSize.toString());
    }
  }

  loadFontSizePreference(): void {
    const preferredSize = localStorage.getItem('preferredFontSize');
    if (preferredSize) {
      const size = parseInt(preferredSize, 10);
      if (size >= this.minFontSize && size <= this.maxFontSize) {
        this.currentFontSize = size;
      }
    }
    this.document.documentElement.style.fontSize = `${this.currentFontSize}px`;
  }

  startClock(): void {
    this.clockSubscription = interval(1000)
      .pipe(
        startWith(0),
        map(() => new Date()),
        map(date => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
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
    const yOffset = window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    const showOffset = 250;

    if (yOffset > showOffset) {
      if (!this.showScrollToTopButton) {
        this.showScrollToTopButton = true;
        this.cdr.markForCheck();
      }
    } else {
      if (this.showScrollToTopButton) {
        this.showScrollToTopButton = false;
        this.cdr.markForCheck();
      }
    }
  }

  scrollToTop(): void {
    this.document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) this.themeSubscription.unsubscribe();
    if (this.clockSubscription) this.clockSubscription.unsubscribe();
  }
}
