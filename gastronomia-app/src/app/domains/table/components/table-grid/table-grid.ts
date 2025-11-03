import { Component, computed, input, output} from '@angular/core';
import { Seating } from '../../../../shared/models/seating';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-grid',
  imports: [CommonModule],
  templateUrl: './table-grid.html',
  styleUrl: './table-grid.css',
})
export class TableGrid {
  tables = input<Seating[]>([]);
  select = output<Seating>();

  freeTables = computed(() => this.tables().filter(t => t.status === 'FREE'));
  occupiedTables = computed(() => this.tables().filter(t => t.status === 'OCCUPIED'));
  billingTables = computed(() => this.tables().filter(t => t.status === 'BILLING'));

  onSelect(table: Seating) {
    this.select.emit(table);
  }
  
}
