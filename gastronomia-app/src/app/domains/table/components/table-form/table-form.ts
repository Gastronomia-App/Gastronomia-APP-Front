import {
  Component,
  inject,
  input,
  output,
  computed,
  effect,
  viewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form } from '../../../../shared/components/form/form';
import {
  Seating,
  SeatingCreateRequest,
  SeatingUpdateRequest,
} from '../../../../shared/models/seating';
import { TablesService } from '../../services/tables-service';
import { FormConfig, FormSubmitEvent } from '../../../../shared/models/form-config.model';

@Component({
  selector: 'app-table-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './table-form.html',
  styleUrl: './table-form.css',
})
export class TableForm {
  private readonly tablesService = inject(TablesService);
  private readonly cdr = inject(ChangeDetectorRef);

  seating = input<Seating>();
  mode = input<'create' | 'edit'>('create');
  closed = output<void>();

  formRef = viewChild(Form<any>);

  // Config del form dinámico
  formConfig = computed<FormConfig<Seating>>(() => {
    const s = this.seating();
    return {
      title: this.mode() === 'create' ? 'Nueva mesa' : 'Editar mesa',
      submitLabel: this.mode() === 'create' ? 'Crear mesa' : 'Guardar cambios',
      sections: [
        {
          title: 'Identificación',
          fields: [
            {
              name: 'number',
              label: 'Número',
              type: 'number',
              required: true,
              min: 1,
              fullWidth: true,
              defaultValue: s?.number ?? null,
            },
          ],
        },
        {
          title: 'Posición en salón',
          fields: [
            {
              name: 'posX',
              label: 'Columna (X)',
              type: 'number',
              readonly: true,
              required: true,
              defaultValue: s?.posX ?? 1,
            },
            {
              name: 'posY',
              label: 'Fila (Y)',
              type: 'number',
              readonly: true,
              required: true,
              defaultValue: s?.posY ?? 1,
            },
          ],
        },
        {
          title: 'Apariencia',
          fields: [
            {
              name: 'shape',
              label: 'Forma',
              type: 'select',
              required: true,
              options: [
                { label: 'Cuadrada', value: 'SQUARE' },
                { label: 'Redonda', value: 'ROUND' },
              ],
              defaultValue: s?.shape ?? 'SQUARE',
            },
            {
              name: 'size',
              label: 'Tamaño',
              type: 'select',
              required: true,
              options: [
                { label: 'Chica', value: 'SMALL' },
                { label: 'Mediana', value: 'MEDIUM' },
                { label: 'Grande', value: 'LARGE' },
              ],
              defaultValue: s?.size ?? 'SMALL',
            },
            {
              name: 'orientation',
              label: 'Orientación',
              type: 'select',
              required: true,
              options: [
                { label: 'Horizontal', value: 'HORIZONTAL' },
                { label: 'Vertical', value: 'VERTICAL' },
              ],
              defaultValue: s?.orientation ?? 'HORIZONTAL',
            },
          ],
        },
      ],
    };
  });

  constructor() {
    // ✅ Resetea el form cuando cambia seating() o mode()
    effect(() => {
      const s = this.seating();
      const form = this.formRef();

      if (form && s) {
        form.resetForm();
        form.loadData({
          number: s.number,
          posX: s.posX,
          posY: s.posY,
          shape: s.shape,
          size: s.size,
          orientation: s.orientation,
        } as any);
        this.cdr.detectChanges();
      }
    });
  }

  // 🟢 Guardar o crear
  onSubmit(event: FormSubmitEvent<Seating>): void {
    if (this.mode() === 'create') {
      const payload: SeatingCreateRequest = {
        number: Number(event.data.number),
        posX: Number(event.data.posX),
        posY: Number(event.data.posY),
        shape: event.data.shape,
        size: event.data.size,
        orientation: event.data.orientation,
      };

      this.tablesService.create(payload).subscribe({
        next: (created) => {
          console.log('✅ Mesa creada:', created);
          this.closed.emit();
        },
        error: (err) => console.error('❌ Error al crear mesa:', err),
      });
    } else {
      const base = this.seating();
      if (!base) return;

      const payload: SeatingUpdateRequest = {
        id: base.id,
        number: Number(event.data.number),
        posX: Number(event.data.posX),
        posY: Number(event.data.posY),
        shape: event.data.shape,
        size: event.data.size,
        orientation: event.data.orientation,
      };

      this.tablesService.update(base.id, payload).subscribe({
        next: (updated) => {
          console.log('💾 Mesa actualizada:', updated);
          this.closed.emit();
        },
        error: (err) => console.error('❌ Error al actualizar mesa:', err),
      });
    }
  }

  onCancel(): void {
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
