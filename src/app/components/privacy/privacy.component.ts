import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-Privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css']
})
export class PrivacyPolicyComponent implements AfterViewInit, OnDestroy {

  private observer: IntersectionObserver | undefined;

  constructor(private elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    const sections = this.elementRef.nativeElement.querySelectorAll('.content-section');

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1 // The element is considered "visible" when 10% of it is in the viewport
    });

    sections.forEach((section: Element) => {
      this.observer?.observe(section);
    });
  }

  ngOnDestroy(): void {
    // Clean up the observer when the component is destroyed to prevent memory leaks
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
