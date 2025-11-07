import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seating } from '../../../../shared/models/seating';

@Component({
  selector: 'app-seating-status-view',
  standalone: true, // 👈 OBLIGATORIO
  imports: [CommonModule],
  templateUrl: './seating-status-view.html',
  styleUrl: './seating-status-view.css'
})
export class SeatingStatusView {  // 👈 Nombre debe coincidir con el import
  seatings = input<Seating[]>([]);
  select = output<Seating>();

  freeSeatings = computed(() =>
    this.seatings().filter(s => s.status === 'FREE')
  );
  occupiedSeatings = computed(() =>
    this.seatings().filter(s => s.status === 'OCCUPIED')
  );
  billingSeatings = computed(() =>
    this.seatings().filter(s => s.status === 'BILLING')
  );

  onSelect(seating: Seating): void {
    this.select.emit(seating);
  }
}
