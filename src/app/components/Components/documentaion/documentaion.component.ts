import { Component, AfterViewInit, ElementRef, OnDestroy, Renderer2, NgZone } from '@angular/core';

@Component({

  selector: 'app-documentaion', // Corrected selector name
  templateUrl: './documentaion.component.html', // Corrected template URL
  styleUrls: ['./documentaion.component.css'] // Corrected style URL
})
export class documentaionComponent implements AfterViewInit, OnDestroy {

  // Properties for typing animation
  private subtitleText = "Borg El Arab Technological University Projects Platform";
  private typingSpeed = 50;
  private typingIndex = 0;
  private typingInterval: any;

  // Properties for canvas background animation
  private canvas: HTMLCanvasElement | undefined;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: any[] = [];
  private animationFrameId: number | undefined;

  constructor(private el: ElementRef, private renderer: Renderer2, private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    this.startTypingAnimation();
    this.initCanvasBackground();
    // Run resize event listener outside of Angular's zone to improve performance
    this.ngZone.runOutsideAngular(() => {
        window.addEventListener('resize', this.resizeCanvas);
    });
  }

  ngOnDestroy(): void {
    // Cleanup to prevent memory leaks
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.resizeCanvas);
  }

  private startTypingAnimation(): void {
    const subtitleElement = this.el.nativeElement.querySelector('#typing-subtitle');
    if (!subtitleElement) return;

    this.typingInterval = setInterval(() => {
      if (this.typingIndex < this.subtitleText.length) {
        subtitleElement.innerHTML += this.subtitleText.charAt(this.typingIndex);
        this.typingIndex++;
      } else {
        clearInterval(this.typingInterval);
        subtitleElement.style.borderRightColor = 'transparent'; // Hide caret when done
      }
    }, this.typingSpeed);
  }

  // --- Neural Network Background Logic ---

  private initCanvasBackground(): void {
    const backgroundContainer = this.el.nativeElement.querySelector('.neural-background');
    if (!backgroundContainer) return;

    this.canvas = this.renderer.createElement('canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      // other code using this.canvas
    }

    this.renderer.appendChild(backgroundContainer, this.canvas);

    this.resizeCanvas();
    this.createParticles();

    // Run animation outside of Angular's zone for better performance
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  private resizeCanvas = (): void => {
    if (!this.canvas) return;
    this.canvas.width = this.el.nativeElement.offsetWidth;
    this.canvas.height = this.el.nativeElement.offsetHeight;
    // We need to re-create particles on resize to ensure they fit the new canvas size
    this.createParticles();
  }

  private createParticles(): void {
    if (!this.canvas) return;
    const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 10000); // Responsive particle count
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 1
      });
    }
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      // Draw particle
      this.ctx!.fillStyle = 'rgba(35, 209, 96, 0.5)'; // --primary-accent
      this.ctx!.beginPath();
      this.ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx!.fill();

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = this.canvas!.width;
      if (p.x > this.canvas!.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas!.height;
      if (p.y > this.canvas!.height) p.y = 0;
    });

    // Draw lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dist = Math.hypot(this.particles[i].x - this.particles[j].x, this.particles[i].y - this.particles[j].y);
        if (dist < 100) {
          this.ctx.strokeStyle = `rgba(35, 209, 96, ${1 - dist / 100})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}
