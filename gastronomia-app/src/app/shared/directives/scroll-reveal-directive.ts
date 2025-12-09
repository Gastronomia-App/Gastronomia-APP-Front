import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input('appScrollReveal')
  direction: 'up' | 'down' | 'left' | 'right' | 'fade' = 'up';

  @Input()
  revealDelay = 0;

  private observer?: IntersectionObserver;
  private hasRevealed = false;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;

    // Force base hidden state with inline styles (no CSS dependency)
    this.renderer.setStyle(element, 'opacity', '0');
    this.renderer.setStyle(element, 'transform', this.getInitialTransform());
    this.renderer.setStyle(
      element,
      'transition',
      'opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1)'
    );

    // DEBUG: this will tell you if the directive is being instantiated
    console.log('[ScrollRevealDirective] init for', element.tagName);

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.hasRevealed) {
            this.hasRevealed = true;

            // DEBUG: check when it actually reveals
            console.log('[ScrollRevealDirective] reveal', element.tagName);

            const delay = this.revealDelay > 0 ? `${this.revealDelay}ms` : '0ms';
            this.renderer.setStyle(element, 'transition-delay', delay);

            // Final visible state
            this.renderer.setStyle(element, 'opacity', '1');
            this.renderer.setStyle(element, 'transform', 'translate3d(0,0,0)');

            this.observer?.unobserve(element);
          }
        }
      },
      {
        root: null, // viewport (works incluso si scrolleás un contenedor interno)
        threshold: 0.15
      }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private getInitialTransform(): string {
    switch (this.direction) {
      case 'down':
        return 'translate3d(0,-24px,0)';
      case 'left':
        return 'translate3d(-32px,0,0)';
      case 'right':
        return 'translate3d(32px,0,0)';
      case 'fade':
        return 'translate3d(0,0,0)';
      case 'up':
      default:
        return 'translate3d(0,24px,0)';
    }
  }
}
