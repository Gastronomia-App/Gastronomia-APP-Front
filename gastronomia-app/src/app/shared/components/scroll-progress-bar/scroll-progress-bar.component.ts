// scroll-progress-bar.component.ts
import {
  AfterViewInit,
  Component,
  DestroyRef,
  Inject,
  Input,
  inject,
  signal
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-scroll-progress-bar',
  standalone: true,
  templateUrl: './scroll-progress-bar.component.html',
  styleUrls: ['./scroll-progress-bar.component.css']
})
export class ScrollProgressBarComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  @Input() accentColor = '#d4a64c';

  // NEW: scroll container (si no se pasa, usa window)
  @Input() scrollElement?: HTMLElement | null;

  // Value actually painted on the bar (smoothed)
  readonly progress = signal(0);

  // Target value based on real scroll
  private targetProgress = 0;

  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    const source: EventTarget = this.scrollElement ?? window;

    fromEvent(source, 'scroll')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTargetProgress());

    // Initial value
    this.updateTargetProgress();
    this.startAnimationLoop();

    this.destroyRef.onDestroy(() => {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  // Only calculates the target value
  private updateTargetProgress(): void {
    const el: HTMLElement =
      this.scrollElement ??
      (this.document.scrollingElement as HTMLElement) ??
      (this.document.documentElement as HTMLElement) ??
      (this.document.body as HTMLElement);

    const top = el.scrollTop;
    const height = el.scrollHeight - el.clientHeight;
    this.targetProgress = height > 0 ? top / height : 0;
  }

  // Animation loop: interpolates progress() towards targetProgress
  private startAnimationLoop(): void {
    const ease = 0.18;

    const animate = () => {
      const current = this.progress();
      const diff = this.targetProgress - current;

      if (Math.abs(diff) > 0.001) {
        const next = current + diff * ease;
        this.progress.set(next);
      } else {
        this.progress.set(this.targetProgress);
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}
