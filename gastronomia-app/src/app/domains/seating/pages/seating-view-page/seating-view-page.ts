import { AfterViewInit, Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatingGridView } from '../../components/seating-grid-view/seating-grid-view';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';
import { ZoomStateService } from '../../services/zoom-state-service';

@Component({
  selector: 'app-seating-view-page',
  standalone: true,
  imports: [CommonModule, SeatingGridView],
  templateUrl: './seating-view-page.html',
  styleUrl: './seating-view-page.css'
})
export class SeatingViewPage implements AfterViewInit {
  private readonly seatingService = inject(SeatingsService);

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadSeatings();
  }

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  private zoomState = inject(ZoomStateService);
  
readonly zoomLevel = this.zoomState.zoomLevel;
  ngAfterViewInit() {
    const el = this.scrollContainer.nativeElement;
    effect(() => {
      el.scrollLeft = this.zoomState.scrollLeft();
      el.scrollTop = this.zoomState.scrollTop();
    });
  }


  private loadSeatings(): void {
    this.seatingService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ubicaciones.');
        this.loading.set(false);
      }
    });
  }

  increaseZoom(): void {
    this.zoomLevel.set(Math.min(5, this.zoomLevel() + 1));
  }

  decreaseZoom(): void {
    this.zoomLevel.set(Math.max(1, this.zoomLevel() - 1));
  }
}
